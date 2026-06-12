/* push-utils.mjs — envoi des notifications Web Push depuis le robot.
   Utilisé par fetch-results-apify.mjs (GitHub Actions).
   Secrets requis : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY. */
import webpush from "web-push";

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;

export function pushConfigured() {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

export function setupPush() {
  webpush.setVapidDetails("mailto:laminotgabriel@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/* Envoie `payload` ({title, body, tag, url}) à une liste de lignes push_subs.
   Supprime de la base les abonnements morts (appareil désabonné). */
export async function sendToSubs(sb, subs, payload) {
  if (!pushConfigured() || !subs.length) return 0;
  const body = JSON.stringify(payload);
  let sent = 0;
  for (const row of subs) {
    try {
      await webpush.sendNotification(row.sub, body);
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await sb.from("push_subs").delete().eq("endpoint", row.endpoint);
        console.log("  🧹 abonnement mort supprimé");
      } else {
        console.error("  ⚠️ push:", e.statusCode || e.message);
      }
    }
  }
  return sent;
}

/* Abonnements des joueurs qui veulent les résultats. */
export async function resultSubs(sb) {
  const { data: profs } = await sb.from("profiles").select("id").eq("notify_results", true);
  const ids = (profs || []).map((p) => p.id);
  if (!ids.length) return [];
  const { data } = await sb.from("push_subs").select("endpoint, sub").in("user_id", ids);
  return data || [];
}

/* Abonnements des admins (alertes "score à saisir / valider"). */
export async function adminSubs(sb) {
  const { data: profs } = await sb.from("profiles").select("id").eq("is_admin", true);
  const ids = (profs || []).map((p) => p.id);
  if (!ids.length) return [];
  const { data } = await sb.from("push_subs").select("endpoint, sub").in("user_id", ids);
  return data || [];
}
