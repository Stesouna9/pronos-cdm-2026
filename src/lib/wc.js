/* ============================================================
   Pronos CDM 2026 — moteur de données (version DÉMO)
   --------------------------------------------------------
   Ce module fournit des données représentatives pour faire
   tourner l'interface AVANT le branchement Supabase + API foot.
   Les vraies équipes / vrais matchs / vrais résultats viendront
   de Supabase (alimenté par l'API football). Ici on garde :
     - TEAMS / GROUPS / VENUES        : identité visuelle + repères
     - BAREME / points()              : règles de score (RESTENT côté client)
     - fmtDate / fmtHeure / team()    : helpers d'affichage
     - un jeu de matchs/joueurs SIMULÉ : pour la démo locale
   ============================================================ */

// --- RNG déterministe (mulberry32) pour des scores stables ---
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- DATE SIMULÉE du jour (tournoi "en cours" pour la démo) ---
const NOW = new Date("2026-06-30T12:00:00");

// --- 48 équipes (nom FR, code FIFA, confédération, rang, couleurs) ---
const T = {
  MEX: { name: "Mexique", conf: "CONCACAF", rank: 14, colors: ["#006847", "#ffffff", "#ce1126"] },
  RSA: { name: "Afrique du Sud", conf: "CAF", rank: 61, colors: ["#007a4d", "#ffb915", "#000000"] },
  KOR: { name: "Corée du Sud", conf: "AFC", rank: 23, colors: ["#ffffff", "#cd2e3a", "#0047a0"] },
  NOR: { name: "Norvège", conf: "UEFA", rank: 30, colors: ["#ba0c2f", "#ffffff", "#00205b"] },
  CAN: { name: "Canada", conf: "CONCACAF", rank: 31, colors: ["#d52b1e", "#ffffff", "#d52b1e"] },
  BIH: { name: "Bosnie-Herz.", conf: "UEFA", rank: 37, colors: ["#002395", "#fecb00", "#ffffff"] },
  QAT: { name: "Qatar", conf: "AFC", rank: 51, colors: ["#8a1538", "#ffffff", "#8a1538"] },
  SUI: { name: "Suisse", conf: "UEFA", rank: 19, colors: ["#d52b1e", "#ffffff", "#d52b1e"] },
  ESP: { name: "Espagne", conf: "UEFA", rank: 1, colors: ["#aa151b", "#f1bf00", "#aa151b"] },
  EGY: { name: "Égypte", conf: "CAF", rank: 33, colors: ["#ce1126", "#ffffff", "#000000"] },
  CUW: { name: "Curaçao", conf: "CONCACAF", rank: 82, colors: ["#002b7f", "#f9d616", "#002b7f"] },
  SCO: { name: "Écosse", conf: "UEFA", rank: 42, colors: ["#0065bd", "#ffffff", "#0065bd"] },
  USA: { name: "États-Unis", conf: "CONCACAF", rank: 16, colors: ["#0a3161", "#ffffff", "#b31942"] },
  PAR: { name: "Paraguay", conf: "CONMEBOL", rank: 40, colors: ["#d52b1e", "#ffffff", "#0038a8"] },
  AUS: { name: "Australie", conf: "AFC", rank: 26, colors: ["#00843d", "#ffcd00", "#00843d"] },
  TUR: { name: "Türkiye", conf: "UEFA", rank: 27, colors: ["#e30a17", "#ffffff", "#e30a17"] },
  ARG: { name: "Argentine", conf: "CONMEBOL", rank: 2, colors: ["#75aadb", "#ffffff", "#75aadb"] },
  IRN: { name: "Iran", conf: "AFC", rank: 21, colors: ["#239f40", "#ffffff", "#da0000"] },
  CPV: { name: "Cap-Vert", conf: "CAF", rank: 70, colors: ["#003893", "#ffffff", "#cf2027"] },
  AUT: { name: "Autriche", conf: "UEFA", rank: 22, colors: ["#ed2939", "#ffffff", "#ed2939"] },
  FRA: { name: "France", conf: "UEFA", rank: 3, colors: ["#002395", "#ffffff", "#ed2939"] },
  SEN: { name: "Sénégal", conf: "CAF", rank: 18, colors: ["#00853f", "#fdef42", "#e31b23"] },
  UZB: { name: "Ouzbékistan", conf: "AFC", rank: 57, colors: ["#1eb53a", "#ffffff", "#0099b5"] },
  PAN: { name: "Panama", conf: "CONCACAF", rank: 41, colors: ["#005293", "#ffffff", "#d21034"] },
  BRA: { name: "Brésil", conf: "CONMEBOL", rank: 5, colors: ["#009b3a", "#ffdf00", "#002776"] },
  MAR: { name: "Maroc", conf: "CAF", rank: 12, colors: ["#c1272d", "#006233", "#c1272d"] },
  JPN: { name: "Japon", conf: "AFC", rank: 17, colors: ["#ffffff", "#bc002d", "#ffffff"] },
  CIV: { name: "Côte d'Ivoire", conf: "CAF", rank: 39, colors: ["#f77f00", "#ffffff", "#009e60"] },
  ENG: { name: "Angleterre", conf: "UEFA", rank: 4, colors: ["#ffffff", "#ce1124", "#ffffff"] },
  CRO: { name: "Croatie", conf: "UEFA", rank: 10, colors: ["#ff0000", "#ffffff", "#171796"] },
  GHA: { name: "Ghana", conf: "CAF", rank: 72, colors: ["#ce1126", "#fcd116", "#006b3f"] },
  NZL: { name: "Nouvelle-Zélande", conf: "OFC", rank: 86, colors: ["#00247d", "#ffffff", "#cc142b"] },
  POR: { name: "Portugal", conf: "UEFA", rank: 6, colors: ["#006600", "#ff0000", "#006600"] },
  URU: { name: "Uruguay", conf: "CONMEBOL", rank: 15, colors: ["#7bafd4", "#ffffff", "#7bafd4"] },
  JOR: { name: "Jordanie", conf: "AFC", rank: 64, colors: ["#000000", "#ffffff", "#007a3d"] },
  HAI: { name: "Haïti", conf: "CONCACAF", rank: 84, colors: ["#00209f", "#ffffff", "#d21034"] },
  NED: { name: "Pays-Bas", conf: "UEFA", rank: 7, colors: ["#ae1c28", "#ffffff", "#21468b"] },
  COL: { name: "Colombie", conf: "CONMEBOL", rank: 13, colors: ["#fcd116", "#003893", "#ce1126"] },
  TUN: { name: "Tunisie", conf: "CAF", rank: 49, colors: ["#e70013", "#ffffff", "#e70013"] },
  KSA: { name: "Arabie saoudite", conf: "AFC", rank: 58, colors: ["#006c35", "#ffffff", "#006c35"] },
  GER: { name: "Allemagne", conf: "UEFA", rank: 9, colors: ["#000000", "#dd0000", "#ffce00"] },
  ECU: { name: "Équateur", conf: "CONMEBOL", rank: 24, colors: ["#ffdd00", "#0033a0", "#ef3340"] },
  ALG: { name: "Algérie", conf: "CAF", rank: 38, colors: ["#006233", "#ffffff", "#d21034"] },
  CRC: { name: "Costa Rica", conf: "CONCACAF", rank: 47, colors: ["#002b7f", "#ffffff", "#ce1126"] },
  BEL: { name: "Belgique", conf: "UEFA", rank: 8, colors: ["#000000", "#fae042", "#ed2939"] },
  DEN: { name: "Danemark", conf: "UEFA", rank: 20, colors: ["#c8102e", "#ffffff", "#c8102e"] },
  HON: { name: "Honduras", conf: "CONCACAF", rank: 78, colors: ["#0073cf", "#ffffff", "#0073cf"] },
  POL: { name: "Pologne", conf: "UEFA", rank: 28, colors: ["#ffffff", "#dc143c", "#ffffff"] },
};

// --- 12 groupes A..L ---
const GROUPS = {
  A: ["MEX", "RSA", "KOR", "NOR"], B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["ESP", "EGY", "CUW", "SCO"], D: ["USA", "PAR", "AUS", "TUR"],
  E: ["ARG", "IRN", "CPV", "AUT"], F: ["FRA", "SEN", "UZB", "PAN"],
  G: ["BRA", "MAR", "JPN", "CIV"], H: ["ENG", "CRO", "GHA", "NZL"],
  I: ["POR", "URU", "JOR", "HAI"], J: ["NED", "COL", "TUN", "KSA"],
  K: ["GER", "ECU", "ALG", "CRC"], L: ["BEL", "DEN", "HON", "POL"],
};

const VENUES = [
  { city: "Mexico", stade: "Estadio Azteca", pays: "MEX" },
  { city: "Guadalajara", stade: "Estadio Akron", pays: "MEX" },
  { city: "Monterrey", stade: "Estadio BBVA", pays: "MEX" },
  { city: "Toronto", stade: "Toronto Stadium", pays: "CAN" },
  { city: "Vancouver", stade: "BC Place", pays: "CAN" },
  { city: "Los Angeles", stade: "SoFi Stadium", pays: "USA" },
  { city: "New York / NJ", stade: "MetLife Stadium", pays: "USA" },
  { city: "Dallas", stade: "AT&T Stadium", pays: "USA" },
  { city: "Atlanta", stade: "Mercedes-Benz Stadium", pays: "USA" },
  { city: "Miami", stade: "Hard Rock Stadium", pays: "USA" },
  { city: "Kansas City", stade: "Arrowhead Stadium", pays: "USA" },
  { city: "Boston", stade: "Boston Stadium", pays: "USA" },
  { city: "Philadelphie", stade: "Lincoln Financial Field", pays: "USA" },
  { city: "Houston", stade: "NRG Stadium", pays: "USA" },
  { city: "Seattle", stade: "Lumen Field", pays: "USA" },
  { city: "San Francisco", stade: "Levi's Stadium", pays: "USA" },
];

const r = rng(20260611);
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function dateAt(month, day, hour) { return new Date(`2026-${pad(month)}-${pad(day)}T${pad(hour)}:00:00`); }

function genScore(ra, rb) {
  const edge = (rb - ra) / 100;
  const base = () => {
    const x = r();
    if (x < 0.30) return 0; if (x < 0.62) return 1; if (x < 0.85) return 2; if (x < 0.95) return 3; return 4;
  };
  let a = base(), b = base();
  if (edge > 0.15 && r() < 0.5) a += 1;
  if (edge < -0.15 && r() < 0.5) b += 1;
  return [a, b];
}

const matches = [];
let mid = 1;
const groupLetters = Object.keys(GROUPS);
groupLetters.forEach((g, gi) => {
  const tm = GROUPS[g];
  const fixtures = [[0, 1], [2, 3], [0, 2], [3, 1], [0, 3], [1, 2]];
  fixtures.forEach((f, fi) => {
    const md = Math.floor(fi / 2);
    const day = 11 + md * 6 + (gi % 6);
    const hour = 15 + (fi % 3) * 3;
    const home = tm[f[0]], away = tm[f[1]];
    const sc = genScore(T[home].rank, T[away].rank);
    const venue = VENUES[(gi + fi) % VENUES.length];
    matches.push({
      id: "M" + pad(mid++), phase: "Groupe " + g, group: g, round: "group",
      date: dateAt(6, day, hour), venue, home, away, score: sc, status: "fini",
    });
  });
});

function standings(g) {
  const rows = {};
  GROUPS[g].forEach((c) => (rows[c] = { code: c, pts: 0, j: 0, g: 0, p: 0, n: 0, bp: 0, bc: 0, diff: 0 }));
  matches.filter((m) => m.group === g && m.status === "fini").forEach((m) => {
    const [a, b] = m.score;
    const H = rows[m.home], A = rows[m.away];
    H.j++; A.j++; H.bp += a; H.bc += b; A.bp += b; A.bc += a;
    if (a > b) { H.pts += 3; H.g++; A.p++; }
    else if (a < b) { A.pts += 3; A.g++; H.p++; }
    else { H.pts++; A.pts++; H.n++; A.n++; }
  });
  return Object.values(rows)
    .map((x) => ({ ...x, diff: x.bp - x.bc }))
    .sort((x, y) => y.pts - x.pts || y.diff - x.diff || y.bp - x.bp || T[x.code].rank - T[y.code].rank);
}

const STANDINGS = {};
groupLetters.forEach((g) => (STANDINGS[g] = standings(g)));

const firsts = [], seconds = [], thirdsAll = [];
groupLetters.forEach((g) => {
  const s = STANDINGS[g];
  firsts.push({ ...s[0], from: "1" + g });
  seconds.push({ ...s[1], from: "2" + g });
  thirdsAll.push({ ...s[2], from: "3" + g });
});
const thirds = [...thirdsAll]
  .sort((x, y) => y.pts - x.pts || y.diff - x.diff || y.bp - x.bp || T[x.code].rank - T[y.code].rank)
  .slice(0, 8);

const secondsSorted = [...seconds].sort((x, y) => y.pts - x.pts || y.diff - x.diff);
const high = [...firsts, ...secondsSorted.slice(0, 4)];
const low = [...secondsSorted.slice(4), ...thirds];

function knockoutDate(idx, startM, startD, perDay) {
  const day = startD + Math.floor(idx / perDay);
  const hour = 15 + (idx % perDay) * 3;
  return dateAt(startM, day, hour);
}

function ko(stage, home, away, date, venue, played) {
  const m = { id: "K" + pad(mid++), phase: stage, round: "ko", stage, date, venue, home, away, status: played ? "fini" : "à venir" };
  if (played && home && away) {
    let sc = genScore(T[home].rank, T[away].rank);
    let pens = null;
    if (sc[0] === sc[1]) {
      const pa = 3 + Math.floor(r() * 3), pb = pa === 3 ? 4 : 3 + Math.floor(r() * 3);
      pens = pa === pb ? [pa + 1, pb] : [pa, pb];
    }
    m.score = sc; m.pens = pens;
    m.winner = sc[0] > sc[1] ? home : sc[0] < sc[1] ? away : (pens[0] > pens[1] ? home : away);
  }
  return m;
}

const r32 = [];
for (let i = 0; i < 16; i++) {
  const date = knockoutDate(i, 6, 28, 4);
  const played = date < NOW;
  r32.push(ko("32es de finale", high[i].code, low[i].code, date, VENUES[i % VENUES.length], played));
}

function winnerOf(m) { return m.status === "fini" ? m.winner : null; }
function buildRound(prev, stage, startM, startD, perDay, venuesPick) {
  const out = [];
  for (let i = 0; i < prev.length / 2; i++) {
    const a = prev[2 * i], b = prev[2 * i + 1];
    const date = knockoutDate(i, startM, startD, perDay);
    const ha = winnerOf(a), hb = winnerOf(b);
    const played = date < NOW && ha && hb;
    const m = ko(stage, ha, hb, date, VENUES[venuesPick % VENUES.length], played);
    m.fromA = a.id; m.fromB = b.id;
    venuesPick++;
    out.push(m);
  }
  return out;
}
const r16 = buildRound(r32, "8es de finale", 7, 4, 4, 5);
const qf = buildRound(r16, "Quarts de finale", 7, 9, 2, 8);
const sf = buildRound(qf, "Demi-finales", 7, 14, 1, 8);
const final = buildRound(sf, "Finale", 7, 19, 1, 6);
const third = (function () {
  const a = sf[0], b = sf[1];
  const date = dateAt(7, 18, 16);
  const m = ko("Match pour la 3e place", winnerOf(a) ? a.loser : null, null, date, VENUES[9], false);
  m.fromA = a.id; m.fromB = b.id; m.isThird = true;
  return m;
})();

const KO = { r32, r16, qf, sf, third, final: final[0] };
const ALL_KO = [...r32, ...r16, ...qf, ...sf, third, final[0]];
const ALL_MATCHES = [...matches, ...ALL_KO];

const PRIZES = [
  { rang: 1, titre: "Le Champion", lot: "🏆 Une journée en tête-à-tête avec Gabriel + resto", desc: "Le grand gagnant passe une journée avec le boss." },
  { rang: 2, titre: "Le Dauphin", lot: "🍔 Un McDo offert par Gabriel", desc: "Si t'as bon, Gabriel te paie le McDo." },
  { rang: 3, titre: "Le Podium", lot: "🔞 Un sex toy", desc: "Pour bien finir le tournoi." },
  { rang: "Lanterne", titre: "La Cuillère de bois", lot: "🍟 Tu paies le McDo de Gabriel", desc: "Le dernier de la ligue régale le boss." },
];

const AVATARS = ["⚽", "🦁", "🐉", "🔥", "🚀", "👑", "🎯", "🐺", "🦅", "🧤", "🥅", "⭐"];
const PSEUDOS = ["MaxiFoot", "La_Pulga", "TontonZizou", "Karim_B", "Sofia.G", "DjibrilP", "Le_Boss",
  "Manou", "Riad", "ElenaK", "TheoM", "PapaPronos", "Linette", "Yanis_77", "CaptainCanard",
  "MamieScore", "RemyR", "Nora", "BaptisteV", "GégéLaFrappe", "Sika", "Lucas", "Inès_06"];
function seededUsers() {
  const ur = rng(424242);
  const list = PSEUDOS.map((p, i) => ({
    id: "u" + i, pseudo: p, avatar: AVATARS[i % AVATARS.length],
    pts: Math.floor(40 + ur() * 90), exacts: Math.floor(2 + ur() * 9),
    bons: Math.floor(6 + ur() * 14), serie: Math.floor(ur() * 6), isMe: false,
  }));
  list.unshift({ id: "me", pseudo: "Toi", avatar: "🎯", pts: 96, exacts: 7, bons: 15, serie: 3, isMe: true });
  list.sort((a, b) => b.pts - a.pts || b.exacts - a.exacts);
  list.forEach((u, i) => (u.position = i + 1));
  return list;
}
const USERS = seededUsers();
const ME = USERS.find((u) => u.isMe);

// --- Barème (RÈGLES DE SCORE, partagées avec le calcul serveur) ---
const BAREME = {
  exact: 5, ecart: 4, issue: 3, rate: 0, bonusSerie: 2, bonusKO: 1,
};
function points(pred, real) {
  if (!pred || !real) return null;
  const [pa, pb] = pred, [ra, rb] = real;
  if (pa === ra && pb === rb) return BAREME.exact;
  const outP = Math.sign(pa - pb), outR = Math.sign(ra - rb);
  if (outP === outR) return (pa - pb) === (ra - rb) ? BAREME.ecart : BAREME.issue;
  return BAREME.rate;
}

function seededPredictions() {
  const pr = rng(7777);
  const preds = {};
  ALL_MATCHES.forEach((m) => {
    if (!m.home || !m.away) return;
    if (m.status === "fini") {
      const [ra, rb] = m.score;
      const x = pr();
      if (x < 0.28) preds[m.id] = [ra, rb];
      else if (x < 0.55) preds[m.id] = [Math.max(0, ra + (pr() < .5 ? 1 : -1)), rb];
      else if (x < 0.8) preds[m.id] = [rb, ra];
      else preds[m.id] = null;
    } else if (m.date < new Date("2026-07-08")) {
      if (pr() < 0.45) preds[m.id] = [Math.floor(pr() * 3), Math.floor(pr() * 3)];
    }
  });
  return preds;
}

function fmtDate(d) {
  const j = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"][d.getDay()];
  const mo = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"][d.getMonth()];
  return `${j} ${d.getDate()} ${mo}`;
}
function fmtHeure(d) { return pad(d.getHours()) + "h" + pad(d.getMinutes()); }

export const WC = {
  NOW, T, GROUPS, GROUP_LETTERS: groupLetters, VENUES,
  MATCHES: matches, STANDINGS, KO, ALL_KO, ALL_MATCHES,
  firsts, seconds, thirds, PRIZES, USERS, ME, BAREME, points,
  PREDICTIONS: seededPredictions(),
  fmtDate, fmtHeure,
  team(code) { return code ? { code, ...T[code] } : null; },
};

export default WC;
