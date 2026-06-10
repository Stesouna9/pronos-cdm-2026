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
    .select("match_id, pred_home, pred_away");
  if (error) throw error;
  const m = {};
  (data || []).forEach((p) => (m[p.match_id] = [p.pred_home, p.pred_away]));
  return m;
}

/* Enregistre / met à jour un prono (la base refuse après le coup d'envoi). */
export async function savePrediction(matchId, pred) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "non connecté" };
  const [a, b] = pred;
  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      pred_home: a,
      pred_away: b,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" }
  );
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
  return (data || []).map((u, i) => ({
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
}

/* Profil + identité du joueur connecté. */
export async function fetchMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, pseudo, avatar, fav, is_admin")
    .eq("id", user.id)
    .single();
  return data ? { ...data, email: user.email } : { id: user.id, email: user.email };
}

/* ADMIN : enregistre le score final d'un match (déclenche le calcul des points). */
export async function saveScore(matchId, sh, sa, winnerCode) {
  const { error } = await supabase
    .from("matches")
    .update({
      score_home: sh,
      score_away: sa,
      status: "fini",
      winner: winnerCode || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);
  return { error: error ? error.message : null };
}

/* ADMIN : rouvre un match (annule le score). */
export async function clearScore(matchId) {
  const { error } = await supabase
    .from("matches")
    .update({ score_home: null, score_away: null, status: "a_venir", winner: null })
    .eq("id", matchId);
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
