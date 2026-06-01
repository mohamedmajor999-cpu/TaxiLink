// ============================================================================
// Edge Function : dispatch_mission
//
// Le « robot » du dispatch. À chaque appel, il fait grandir le rond autour
// d'une mission AVAILABLE jusqu'à ce qu'un chauffeur clique « Je prends » ou
// que le rayon plafond soit atteint.
//
// Stratégie validée 2026-05-07 (cf. project_dispatch_strategy.md) :
//   - Rayons : 3 → 6 → 12 → 20 → 30 km
//   - 20 secondes par palier
//   - Si rayon vide (0 chauffeur online dans le rond) → saut immédiat au suivant
//   - Plafond rayon = MIN(30, horizon_minutes * 0.6 km/min) (max physiquement
//     atteignable à 36 km/h moyenne)
//   - Phase 3 — bonus avance de visibilité : dans un rond, un chauffeur avec
//     un click_loss_streak supérieur voit la course AVANT les autres. Concrétisé
//     par mission_offers.unlock_at = now() + (maxStreak - myStreak) * 5s.
//
// Auth : exige un JWT valide. Trois cas acceptés :
//   - JWT service_role  → trusted (déclenchement par trigger DB / cron)
//   - JWT user = publisher de la mission (missions.shared_by = auth.uid())
//   - JWT user = patron (owner/admin/dispatcher) de l'org de la mission
//
// Body : { mission_id: string }
// Retour : { success, status, rings_explored, total_offers_sent, duration_ms }
//
// Limite Edge Function Supabase : 150s (free) / 400s (pro). Cascade max
// 5 paliers × 20s = 100s, on tient large.
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RING_KM_TIERS = [3, 6, 12, 20, 30] as const;
const RING_DURATION_MS = 20_000;
const AVG_SPEED_KM_PER_MIN = 0.6; // 36 km/h moyenne urbaine
const STREAK_LEAD_SECONDS = 5;    // chaque cran de streak = 5s d'avance
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const PUSH_BATCH_SIZE = 100;

interface DirectOfferPushPayload {
  missionId: string;
  departure: string | null;
  destination: string | null;
}

// Best-effort : envoi push Expo "Course pour toi !" aux drivers qui viennent
// de recevoir une offre PENDING. Channel direct-offer, priority high, son +
// vibration. Erreur silencieuse pour ne pas bloquer la cascade.
async function pushDirectOfferToDrivers(
  adminClient: ReturnType<typeof createClient>,
  driverIds: string[],
  payload: DirectOfferPushPayload,
): Promise<void> {
  if (driverIds.length === 0) return;
  const { data: tokens, error } = await adminClient
    .from("push_tokens")
    .select("token")
    .in("user_id", driverIds);
  if (error) {
    console.warn("[dispatch_mission] push_tokens fetch failed", error);
    return;
  }
  const list = ((tokens ?? []) as { token: string }[])
    .map((r) => r.token)
    .filter((t) => t.startsWith("ExponentPushToken["));
  if (list.length === 0) return;

  const trajet = [payload.departure ?? "?", payload.destination ?? "?"].join(" -> ");
  const messages = list.map((to) => ({
    to,
    title: "Course pour toi !",
    body: `${trajet} - vite, accepte avant que ca expire`,
    data: { mission_id: payload.missionId, kind: "direct_offer" },
    sound: "default" as const,
    priority: "high" as const,
    channelId: "direct-offer",
  }));

  for (let i = 0; i < messages.length; i += PUSH_BATCH_SIZE) {
    const chunk = messages.slice(i, i + PUSH_BATCH_SIZE);
    try {
      const resp = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });
      if (!resp.ok) {
        console.warn("[dispatch_mission] expo push batch failed", resp.status, await resp.text());
      }
    } catch (err) {
      console.warn("[dispatch_mission] expo push fetch threw", err);
    }
  }
}

interface DispatchRequest {
  mission_id: string;
}

interface DispatchResult {
  success: boolean;
  status: "TAKEN" | "NO_DRIVER_FOUND" | "NOT_AVAILABLE" | "NO_REACHABLE_RING";
  rings_explored: number[];
  total_offers_sent: number;
  duration_ms: number;
}

function computeRings(horizonMinutes: number): number[] {
  const maxReachable = Math.min(30, horizonMinutes * AVG_SPEED_KM_PER_MIN);
  return RING_KM_TIERS.filter((r) => r <= maxReachable);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Décode un JWT (sans vérification de signature — la plateforme Supabase a
// déjà validé le JWT en amont via verify_jwt:true). On lit juste les claims
// pour distinguer service_role / user.
function decodeJwtPayload(token: string): { role?: string; sub?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const startedAt = Date.now();

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ error: "MISCONFIGURED" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "MISSING_AUTH" }, 401);
  }

  // Détermine le type d'appelant à partir du claim role du JWT.
  // verify_jwt:true a déjà validé le token côté plateforme Supabase.
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const claims = decodeJwtPayload(token);
  const isServiceRole = claims?.role === "service_role";

  let callerId: string | null = null;
  if (!isServiceRole) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "INVALID_AUTH" }, 401);
    }
    callerId = userData.user.id;
  }

  // Client admin (bypass RLS pour le travail serveur)
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Parse body
  let body: DispatchRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "INVALID_BODY" }, 400);
  }
  if (!body.mission_id || typeof body.mission_id !== "string") {
    return jsonResponse({ error: "MISSING_MISSION_ID" }, 400);
  }

  // Charge la mission. departure/destination utilises pour le payload push
  // envoye aux drivers cibles par chaque palier.
  const { data: mission, error: missionErr } = await adminClient
    .from("missions")
    .select("id, status, scheduled_at, departure_lat, departure_lng, shared_by, organization_id, departure, destination")
    .eq("id", body.mission_id)
    .maybeSingle();
  if (missionErr || !mission) {
    return jsonResponse({ error: "MISSION_NOT_FOUND" }, 404);
  }

  // Authorization : publisher OU patron de l'org de la mission
  // service_role → bypass authorization (déclenché par trigger DB / cron)
  if (!isServiceRole) {
    let authorized = mission.shared_by === callerId;
    if (!authorized && mission.organization_id) {
      const { data: membership } = await adminClient
        .from("organization_members")
        .select("role")
        .eq("org_id", mission.organization_id)
        .eq("user_id", callerId)
        .maybeSingle();
      authorized = ["owner", "admin", "dispatcher"].includes(membership?.role ?? "");
    }
    if (!authorized) {
      return jsonResponse({ error: "FORBIDDEN" }, 403);
    }
  }

  if (mission.status !== "AVAILABLE") {
    const result: DispatchResult = {
      success: false,
      status: "NOT_AVAILABLE",
      rings_explored: [],
      total_offers_sent: 0,
      duration_ms: Date.now() - startedAt,
    };
    return jsonResponse(result);
  }

  if (mission.departure_lat === null || mission.departure_lng === null) {
    return jsonResponse({ error: "MISSION_HAS_NO_COORDS" }, 400);
  }

  // Calcul des paliers en fonction de l'horizon temporel
  const horizonMs = new Date(mission.scheduled_at as string).getTime() - Date.now();
  const horizonMin = Math.max(0, horizonMs / 60_000);
  const rings = computeRings(horizonMin);

  if (rings.length === 0) {
    const result: DispatchResult = {
      success: false,
      status: "NO_REACHABLE_RING",
      rings_explored: [],
      total_offers_sent: 0,
      duration_ms: Date.now() - startedAt,
    };
    return jsonResponse(result);
  }

  // Cascade
  const alreadyOffered = new Set<string>();
  let totalOffers = 0;
  const ringsExplored: number[] = [];

  for (const radiusKm of rings) {
    // Re-check mission status à chaque palier (un autre a peut-être accepté)
    const { data: missionState } = await adminClient
      .from("missions")
      .select("status")
      .eq("id", body.mission_id)
      .maybeSingle();
    if (missionState?.status !== "AVAILABLE") {
      const result: DispatchResult = {
        success: true,
        status: "TAKEN",
        rings_explored: ringsExplored,
        total_offers_sent: totalOffers,
        duration_ms: Date.now() - startedAt,
      };
      return jsonResponse(result);
    }

    // Récupère les candidats du rond (déjà filtrés online + groupes + blocages)
    const { data: candidates, error: cvdErr } = await adminClient.rpc(
      "compute_visible_drivers",
      { p_mission_id: body.mission_id, p_radius_km: radiusKm }
    );
    if (cvdErr) {
      console.error("compute_visible_drivers error", cvdErr);
      return jsonResponse({ error: "CVD_ERROR", details: cvdErr.message }, 500);
    }

    type Candidate = { driver_id: string; distance_km: number };
    const newCandidates = ((candidates as Candidate[]) ?? []).filter(
      (c) => !alreadyOffered.has(c.driver_id)
    );

    if (newCandidates.length === 0) {
      // Rond vide → saut immédiat (pas d'attente 20s)
      continue;
    }

    // Phase 3 : récupère le click_loss_streak de chaque candidat pour calculer
    // l'avance de visibilité (unlock_at). Le candidat avec le streak max voit
    // immédiatement ; les autres voient (maxStreak - leurStreak) * 5s plus tard.
    const candidateIds = newCandidates.map((c) => c.driver_id);
    const { data: streaks } = await adminClient
      .from("drivers")
      .select("id, click_loss_streak")
      .in("id", candidateIds);
    const streakById = new Map<string, number>();
    for (const row of (streaks ?? []) as { id: string; click_loss_streak: number }[]) {
      streakById.set(row.id, row.click_loss_streak ?? 0);
    }
    const maxStreak = Math.max(0, ...candidateIds.map((id) => streakById.get(id) ?? 0));

    // Insert offres PENDING (expires_at = now + 20s, unlock_at par streak)
    const nowMs = Date.now();
    const expiresAt = new Date(nowMs + RING_DURATION_MS).toISOString();
    const offers = newCandidates.map((c) => {
      const myStreak = streakById.get(c.driver_id) ?? 0;
      const leadSec = (maxStreak - myStreak) * STREAK_LEAD_SECONDS;
      const unlockAt = new Date(nowMs + leadSec * 1000).toISOString();
      return {
        mission_id: body.mission_id,
        driver_id: c.driver_id,
        status: "PENDING",
        radius_km_at_offer: radiusKm,
        distance_km_at_offer: c.distance_km,
        expires_at: expiresAt,
        unlock_at: unlockAt,
      };
    });
    const { error: insertErr } = await adminClient.from("mission_offers").insert(offers);
    if (insertErr) {
      console.error("mission_offers insert error", insertErr);
      // On continue : un échec d'insert pour conflit unique (offre déjà
      // existante) ou erreur transitoire ne doit pas bloquer la cascade.
    } else {
      totalOffers += newCandidates.length;
      ringsExplored.push(radiusKm);
      // Push notif "Course pour toi !" aux drivers cibles par ce palier.
      // Fire-and-forget en parallele de l'attente 20s du palier. Ne bloque pas.
      void pushDirectOfferToDrivers(
        adminClient,
        newCandidates.map((c) => c.driver_id),
        {
          missionId: body.mission_id,
          departure: (mission.departure as string | null) ?? null,
          destination: (mission.destination as string | null) ?? null,
        },
      );
    }
    // Marquer comme deja tente meme si l'INSERT a echoue : sinon, en cas de
    // conflit (race avec un autre dispatch ou cron) on retentait les memes
    // candidats a chaque palier suivant, en spammant l'INSERT 5 fois sans
    // effet. La cascade doit avancer aux nouveaux rayons, pas boucler.
    newCandidates.forEach((c) => alreadyOffered.add(c.driver_id));

    // Attente 20s avant le prochain palier
    await new Promise((r) => setTimeout(r, RING_DURATION_MS));
  }

  // Cascade épuisée. Vérifie une dernière fois si quelqu'un a accepté pendant
  // les 20s du dernier palier.
  const { data: finalCheck } = await adminClient
    .from("missions")
    .select("status")
    .eq("id", body.mission_id)
    .maybeSingle();
  const finalStatus = finalCheck?.status === "AVAILABLE" ? "NO_DRIVER_FOUND" : "TAKEN";

  const result: DispatchResult = {
    success: finalStatus === "TAKEN",
    status: finalStatus,
    rings_explored: ringsExplored,
    total_offers_sent: totalOffers,
    duration_ms: Date.now() - startedAt,
  };
  return jsonResponse(result);
});
