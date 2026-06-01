// ============================================================================
// Edge Function : notify_poster_mission_accepted
//
// Envoie une push notification au chauffeur qui a POSTE une annonce, quand
// un autre chauffeur l'accepte. Le poster (shared_by) recoit "<driver> a pris
// ta course <depart> -> <destination>" sur son tel, meme app fermee.
//
// Appelee fire-and-forget par l'app mobile (via supabase.functions.invoke)
// apres un missionMutations.accept reussi. L'edge function verifie via le JWT
// user que l'appelant est bien le driver de la mission, puis fetch le token
// Expo du poster via la RPC SECURITY DEFINER get_poster_token_for_accepted_mission.
//
// Body : { mission_id: string }
// Header : Authorization: Bearer <user JWT>
// Retour : { sent: number } ou { skipped: string }
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface NotifyRequest {
  mission_id: string;
}

interface PosterRow {
  poster_id: string;
  token: string;
  departure: string | null;
  destination: string | null;
  driver_name: string;
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

  // 1. Verifie l'identite du caller via son JWT user.
  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "INVALID_JWT" }, 401);
  const callerId = userData.user.id;

  // 2. RPC SECURITY DEFINER : retourne le token du poster SI le caller est
  // bien le driver_id de la mission et que la mission a un shared_by distinct
  // du caller. Sinon table vide -> on no-op.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: rows, error: rpcErr } = await admin.rpc(
    "get_poster_token_for_accepted_mission",
    { p_mission_id: body.mission_id, p_caller_user_id: callerId },
  );
  if (rpcErr) return json({ error: "RPC_FAILED", detail: rpcErr.message }, 500);
  const row = (rows as PosterRow[] | null)?.[0];
  if (!row) return json({ sent: 0, skipped: "NOT_POSTER_OR_NOT_ACCEPTED_BY_CALLER" });
  if (!row.token.startsWith("ExponentPushToken[")) {
    return json({ sent: 0, skipped: "INVALID_TOKEN" });
  }

  // 3. Construit et envoie le message.
  const trajet = [row.departure ?? "?", row.destination ?? "?"].join(" -> ");
  const message = {
    to: row.token,
    title: "Annonce acceptee",
    body: `${row.driver_name} a pris ta course ${trajet}`,
    data: { mission_id: body.mission_id, kind: "mission_accepted" },
    sound: "default" as const,
    priority: "high" as const,
    channelId: "mission-accepted",
  };

  try {
    const resp = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify([message]),
    });
    if (!resp.ok) {
      console.warn("[notify_poster_mission_accepted] expo push failed", resp.status, await resp.text());
      return json({ sent: 0, skipped: "EXPO_PUSH_FAILED" });
    }

    // Parse la reponse Expo : si le ticket renvoie DeviceNotRegistered, le
    // token est mort (app desinstallee, token rotated, etc.) — on le supprime
    // sinon on continuera a payer un round-trip pour rien a chaque accept.
    // Sans ce cleanup, les tokens morts s'accumulent et les "notifs en retard"
    // sont en realite des notifs envoyees a un device qui ne les recoit plus.
    type ExpoTicket = { status: "ok" | "error"; details?: { error?: string } };
    type ExpoResponse = { data?: ExpoTicket[] };
    const parsed = (await resp.json().catch(() => null)) as ExpoResponse | null;
    const ticket = parsed?.data?.[0];
    if (ticket?.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
      await admin.from("push_tokens").delete().eq("token", row.token);
      return json({ sent: 0, skipped: "TOKEN_DEAD_DELETED" });
    }

    return json({ sent: 1 });
  } catch (err) {
    console.warn("[notify_poster_mission_accepted] expo push threw", err);
    return json({ sent: 0, skipped: "EXPO_PUSH_THREW" });
  }
});
