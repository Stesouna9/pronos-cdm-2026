/* ============================================================
   league.js — pont entre l'appli et la base Supabase.
   Lit les matchs, les pronos du joueur et le classement
   commun ; enregistre les pronos (avec verrou au coup d'envoi).
   ============================================================ */
import { supabase } from "./supabase.js";

/* Une ligne "matches" de la base -> la forme attendue par l'UI. */
function mapMatch(r) {
  const date = new Date(r.kickoff);
  const fini = r.status === "fini" && r.score_home != null && r.score_away != null;
  return {
    id: r.id,
    phase: r.phase,
    group: r.grp,
    round: r.round,
    date,
    venue: { city: r.venue_city || "", stade: r.venue_stade || "" },
    home: r.home,
    away: r.away,
    homeName: r.home_name,
    awayName: r.away_name,
    fromA: r.home_from,
    fromB: r.away_from,
    score: fini ? [r.score_home, r.score_away] : null,
    pens: r.pens_home != null && r.pens_away != null ? [r.pens_home, r.pens_away] : null,
    status: fini ? "fini" : "à venir",
    winner: r.winner,
    locked: date <= new Date(),
  };
}

export async function fetchMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapMatch);
}

/* Pronos du joueur connecté -> { [matchId]: [home, away] } */
export async function fetchMyPredictions() {
  const { data, error } = await supabase
    .from("predictions")
    .select("match_id, pred_home, pred_away, confidence, pred_pen_winner");
  if (error) throw error;
  const m = {}, conf = {}, pens = {};
  (data || []).forEach((p) => {
    m[p.match_id] = [p.pred_home, p.pred_away];
    if (p.confidence) conf[p.match_id] = true;
    if (p.pred_pen_winner) pens[p.match_id] = p.pred_pen_winner;
  });
  return { preds: m, conf, pens };
}

/* Choix du vainqueur aux tirs au but (phases finales, prono nul). */
export async function savePenWinner(matchId, code) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  const { error } = await supabase.from("predictions")
    .update({ pred_pen_winner: code || null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id).eq("match_id", matchId);
  return { error: error ? error.message : null };
}

/* Active/retire le prono de confiance (×2). Un seul par jour (la base vérifie). */
export async function toggleConfidence(matchId, on, matchesSameDay = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  if (on) {
    // libère d'abord l'éventuelle confiance déjà posée sur un match du même jour
    for (const otherId of matchesSameDay) {
      if (otherId !== matchId) await supabase.from("predictions").update({ confidence: false }).eq("user_id", user.id).eq("match_id", otherId);
    }
  }
  const { error } = await supabase.from("predictions").update({ confidence: on }).eq("user_id", user.id).eq("match_id", matchId);
  return { error: error ? error.message : null };
}

/* Réactions emoji sur les pronos (après kickoff). */
export async function fetchReactions(matchId) {
  const { data, error } = await supabase
    .from("reactions").select("target_user, author, emoji").eq("match_id", matchId);
  if (error) throw error;
  return data || [];
}
export async function setReaction(matchId, targetUser, emoji) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  if (!emoji) {
    const { error } = await supabase.from("reactions").delete()
      .eq("match_id", matchId).eq("target_user", targetUser).eq("author", user.id);
    return { error: error ? error.message : null };
  }
  const { error } = await supabase.from("reactions").upsert(
    { match_id: matchId, target_user: targetUser, author: user.id, emoji },
    { onConflict: "match_id,target_user,author" });
  return { error: error ? error.message : null };
}

/* ADMIN : avancement des pronos (compteurs, pas le contenu). */
export async function fetchPredProgress() {
  const { data, error } = await supabase.from("pred_progress").select("*").order("today_done", { ascending: true });
  if (error) throw error;
  return data || [];
}

/* Enregistre / met à jour un prono (la base refuse après le coup d'envoi). */
export async function savePrediction(matchId, pred) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  const [a, b] = pred;
  const row = {
    user_id: user.id,
    match_id: matchId,
    pred_home: a,
    pred_away: b,
    updated_at: new Date().toISOString(),
  };
  // prono qui n'est plus un nul → le choix tirs au but n'a plus de sens
  if (a !== b) row.pred_pen_winner = null;
  const { error } = await supabase.from("predictions").upsert(row, { onConflict: "user_id,match_id" });
  return { error: error ? error.message : null };
}

/* Classement commun (vue agrégée), trié, avec position.
   Départage d'égalité : points > scores exacts > inscrit le plus tôt. */
export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("pts", { ascending: false })
    .order("exacts", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  const list = (data || []).map((u, i) => ({
    id: u.user_id,
    pseudo: u.pseudo,
    avatar: u.avatar,
    pts: u.pts || 0,
    exacts: u.exacts || 0,
    bons: u.bons || 0,
    joues: u.joues || 0,
    serie: 0,
    position: i + 1,
  }));
  // Ex æquo : mêmes points ET mêmes exacts → même rang affiché (1,2,3,3,5…).
  for (let i = 1; i < list.length; i++) {
    if (list[i].pts === list[i - 1].pts && list[i].exacts === list[i - 1].exacts) {
      list[i].position = list[i - 1].position;
      list[i].tie = true; list[i - 1].tie = true;
    }
  }
  return list;
}

/* Profil + identité du joueur connecté. */
export async function fetchMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, pseudo, avatar, fav, is_admin, notify_results")
    .eq("id", user.id)
    .single();
  return data ? { ...data, email: user.email } : { id: user.id, email: user.email };
}

/* ---------- Notifications push ---------- */
/* Mémorise le choix "notif après chaque résultat ?" (null = pas encore demandé). */
export async function setNotifyResults(on) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  const { error } = await supabase.from("profiles").update({ notify_results: on }).eq("id", user.id);
  return { error: error ? error.message : null };
}

/* Enregistre l'abonnement push de CET appareil. */
export async function savePushSub(sub) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  const { error } = await supabase.from("push_subs").upsert(
    { user_id: user.id, endpoint: sub.endpoint, sub },
    { onConflict: "endpoint" }
  );
  return { error: error ? error.message : null };
}

/* ADMIN : enregistre le score final d'un match (déclenche le calcul des points).
   Sur un nul en phase finale : winnerCode = vainqueur aux tirs au but,
   pens = [tirs marqués domicile, extérieur] (optionnel, pour l'affichage). */
export async function saveScore(matchId, sh, sa, winnerCode, pens) {
  const patch = {
    score_home: sh,
    score_away: sa,
    status: "fini",
    winner: winnerCode || null,
    updated_at: new Date().toISOString(),
  };
  if (pens && pens[0] != null && pens[1] != null) {
    patch.pens_home = pens[0]; patch.pens_away = pens[1];
  } else {
    patch.pens_home = null; patch.pens_away = null;
  }
  const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
  return { error: error ? error.message : null };
}

/* ADMIN : rouvre un match (annule le score). */
export async function clearScore(matchId) {
  const { error } = await supabase
    .from("matches")
    .update({ score_home: null, score_away: null, status: "a_venir", winner: null, pens_home: null, pens_away: null })
    .eq("id", matchId);
  return { error: error ? error.message : null };
}

/* Pronos de TOUTE la ligue sur un match (lisibles seulement après le coup d'envoi, RLS). */
export async function fetchMatchPredictions(matchId) {
  const { data: preds, error } = await supabase
    .from("predictions")
    .select("user_id, pred_home, pred_away, points, confidence, pred_pen_winner")
    .eq("match_id", matchId);
  if (error) throw error;
  if (!preds || !preds.length) return [];
  const ids = preds.map((p) => p.user_id);
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, pseudo, avatar, banned")
    .in("id", ids);
  const byId = {};
  (profs || []).forEach((p) => (byId[p.id] = p));
  return preds
    .filter((p) => byId[p.user_id] && !byId[p.user_id].banned)
    .map((p) => ({ ...p, pseudo: byId[p.user_id].pseudo, avatar: byId[p.user_id].avatar }));
}

/* Cotes de la ligue (vue agrégée match_cotes : % victoire/nul/victoire,
   visible AVANT le match — ne révèle jamais les scores exacts des autres). */
export async function fetchCotes() {
  const { data, error } = await supabase.from("match_cotes").select("*");
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => {
    const tot = Number(r.tot);
    if (!tot) return;
    const h = Math.round((Number(r.h) / tot) * 100);
    const a = Math.round((Number(r.a) / tot) * 100);
    map[r.match_id] = { h, a, n: Math.max(0, 100 - h - a), tot };
  });
  return map;
}

/* Tous les pronos verrouillés (pour la page Stats). */
export async function fetchAllLockedPredictions() {
  const { data, error } = await supabase
    .from("predictions")
    .select("user_id, match_id, pred_home, pred_away, points");
  if (error) throw error;
  const { data: profs } = await supabase.from("profiles").select("id, pseudo, avatar, banned");
  const byId = {};
  (profs || []).forEach((p) => (byId[p.id] = p));
  return (data || [])
    .filter((p) => byId[p.user_id] && !byId[p.user_id].banned)
    .map((p) => ({ ...p, pseudo: byId[p.user_id].pseudo, avatar: byId[p.user_id].avatar }));
}

/* Sauvegarde les infos de profil (pseudo, avatar, équipe de cœur). */
export async function updateProfile({ pseudo, avatar, fav }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  const { error } = await supabase
    .from("profiles")
    .update({ pseudo, avatar, fav })
    .eq("id", user.id);
  return { error: error ? error.message : null };
}

/* ADMIN : liste complète des joueurs (y compris bannis). */
export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, pseudo, avatar, is_admin, banned, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ADMIN : bannit / débannit un joueur. */
export async function setBanned(userId, banned) {
  const { error } = await supabase
    .from("profiles")
    .update({ banned })
    .eq("id", userId);
  return { error: error ? error.message : null };
}
