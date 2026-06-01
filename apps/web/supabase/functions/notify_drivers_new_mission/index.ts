// ============================================================================
// Edge Function : notify_drivers_new_mission
//
// Envoie une push notification (Expo Push Service -> FCM Android / APNs iOS)
// a tous les chauffeurs dont le departement matche celui de la mission et qui
// ont active la notif (`notification_prefs.popupNewMission` != false).
//
// Appelee fire-and-forget par /api/missions apres creation. Service-role JWT
// requis dans Authorization.
//
// Body : { mission_id: string }
// Retour : { sent: number, batches: number, skipped: string[] }
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

interface NotifyRequest {
  mission_id: string;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: "default";
  priority: "high";
  channelId: "new-mission";
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" }, 401);

  const body = (await req.json().catch(() => null)) as NotifyRequest | null;
  if (!body?.mission_id) return json({ error: "MISSING_MISSION_ID" }, 400);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 1. Fetch mission (departement + champs d'affichage).
  const { data: mission, error: mErr } = await admin
    .from("missions")
    .select("id, status, departement, departure, type")
    .eq("id", body.mission_id)
    .single();
  if (mErr || !mission) return json({ error: "MISSION_NOT_FOUND" }, 404);
  if (mission.status !== "AVAILABLE") return json({ sent: 0, batches: 0, skipped: ["NOT_AVAILABLE"] });
  if (!mission.departement) return json({ sent: 0, batches: 0, skipped: ["NO_DEPARTEMENT"] });

  // 2. Recuperer (user_id, token) pour tous les chauffeurs dont le dept matche
  // et qui n'ont pas desactive la notif. RPC SECURITY DEFINER : la query
  // jointe push_tokens + auth.users avec filtre sur raw_user_meta_data tient
  // en une round-trip SQL au lieu de 2 fetch + filter cote JS.
  const { data: rows, error: rErr } = await admin.rpc("get_drivers_for_dept_push", {
    p_dept: mission.departement,
  });
  if (rErr) return json({ error: "RPC_FAILED", detail: rErr.message }, 500);
  const tokenList = ((rows ?? []) as Array<{ token: string }>)
    .map((r) => r.token)
    .filter((t) => t.startsWith("ExponentPushToken["));
  if (tokenList.length === 0) return json({ sent: 0, batches: 0, skipped: ["NO_TOKENS"] });

  // 4. Construit les messages.
  const title = mission.type === "CPAM" ? "Nouvelle course CPAM" : "Nouvelle course";
  const where = mission.departure ?? "lieu inconnu";
  const messages: ExpoMessage[] = tokenList.map((to) => ({
    to,
    title,
    body: `Depart : ${where}`,
    data: { mission_id: mission.id },
    sound: "default",
    priority: "high",
    channelId: "new-mission",
  }));

  // 5. Envoi a Expo Push par batchs de 100.
  let sent = 0;
  let batches = 0;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
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
      if (resp.ok) {
        sent += chunk.length;
        batches += 1;
      } else {
        console.warn("[notify_drivers_new_mission] expo push batch failed", resp.status, await resp.text());
      }
    } catch (err) {
      console.warn("[notify_drivers_new_mission] expo push fetch threw", err);
    }
  }

  return json({ sent, batches, tokens: tokenList.length });
});
