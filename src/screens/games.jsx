/* games.jsx — Mini-jeux foot. 1 essai par jour et par jeu (verrou serveur),
   défi réussi = +1 au classement Jeux. Le 1er avant les quarts gagne +10
   au classement général. */
import { useState, useEffect, useRef } from "react";
import { WC } from "../lib/wc.js";
import { hasSupabase } from "../lib/supabase.js";
import { fetchMyGamesToday, saveGameScore, fetchGameRecords, todayFR } from "../lib/league.js";
import { Btn, SectionTitle, teamName, Confetti } from "../components/ui.jsx";
import { t } from "../lib/i18n.js";
import { daySeed, seededShuffle, flagEmoji, FLAG_POOL, ARBITRE } from "../lib/gamesData.js";

const GAMES = [
  { id: "penalty", icon: "🥅", name: "Tirs au but", goal: "4 buts sur 5" },
  { id: "jongles", icon: "⚽", name: "Jongles", goal: "20 jongles" },
  { id: "arbitre", icon: "⏱️", name: "Réflexe arbitre", goal: "série de 10" },
  { id: "casse", icon: "🧱", name: "Casse-brique foot", goal: "casse toute la forme" },
  { id: "drapeau", icon: "🚩", name: "Devine le drapeau", goal: "8 sur 10" },
];

/* =================== JEUX =================== */

/* ---- 🥅 Tirs au but ----
   ADRESSE (zéro hasard) : le gardien couvre un tiers (zone rouge) ET un viseur
   balaie le but. Appuie TIRER quand le viseur est sur une zone LIBRE.
   Bords = à côté. Plus tu marques, plus le viseur va vite. 5 tirs, 4 = défi. */
function rndSide() { return ["g", "c", "d"][Math.floor(Math.random() * 3)]; }
function Penalty({ onEnd }) {
  const [hist, setHist] = useState([]);
  const [keeper, setKeeper] = useState(rndSide);
  const [anim, setAnim] = useState(null);     // { x, zone, goal }
  const cursor = useRef(null);                 // élément viseur
  const stx = useRef({ x: 50, dir: 1, raf: 0, dead: false });
  const busy = useRef(false);
  const shotsRef = useRef(0);

  // viseur qui balaie (vitesse croît avec le nombre de buts)
  useEffect(() => {
    const goals = hist.filter(Boolean).length;
    const speed = 0.9 + goals * 0.22;
    let last = performance.now();
    stx.current.dead = false;
    const loop = (now) => {
      const s = stx.current;
      if (s.dead) return;
      const dt = Math.min((now - last) / 16.7, 3); last = now;
      if (!busy.current) {
        s.x += s.dir * speed * dt;
        if (s.x >= 100) { s.x = 100; s.dir = -1; }
        if (s.x <= 0) { s.x = 0; s.dir = 1; }
        if (cursor.current) cursor.current.style.left = s.x + "%";
      }
      s.raf = requestAnimationFrame(loop);
    };
    s_start();
    function s_start() { stx.current.raf = requestAnimationFrame(loop); }
    return () => { stx.current.dead = true; cancelAnimationFrame(stx.current.raf); };
  }, [hist]);

  function zoneOf(x) {
    if (x < 8 || x > 92) return "out";       // à côté
    return x < 37 ? "g" : x > 63 ? "d" : "c";
  }

  function shoot() {
    if (busy.current || hist.length >= 5) return;
    busy.current = true;
    const x = stx.current.x;
    const zone = zoneOf(x);
    const goal = zone !== "out" && zone !== keeper;
    setAnim({ x, zone, goal });
    setTimeout(() => {
      const nh = [...hist, goal];
      busy.current = false; setAnim(null);
      if (nh.length >= 5) { const b = nh.filter(Boolean).length; setHist(nh); onEnd(b, b >= 4); }
      else { setKeeper(rndSide()); setHist(nh); }
    }, 1050);
  }

  const kz = { g: "8%", c: "37%", d: "63%" };  // position zone gardien (gauche du tiers)
  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ marginBottom: 8, fontSize: 13 }}>
        {t("Tir")} {Math.min(hist.length + 1, 5)}/5 — 🧤 {t("vise une zone LIBRE (pas le rouge) et appuie au bon moment !")}
      </div>
      <div className="goalbox">
        <div className="goal-net" />
        <div className="keeperzone" style={{ left: kz[keeper], width: "29%" }} />
        <div className="aimline" ref={cursor} style={{ left: "50%" }} />
        <div className="keeper2" style={{ left: { g: "22%", c: "50%", d: "78%" }[keeper] }}>🧤</div>
        {anim && <div className="shotball" style={{ left: anim.x + "%", top: "60%" }}>⚽</div>}
        {anim && <div className={"verdict " + (anim.goal ? "v-goal" : "v-save")}>{anim.goal ? t("BUT !") : anim.zone === "out" ? t("À CÔTÉ !") : t("ARRÊT !")}</div>}
      </div>
      <button className="penzone" style={{ marginTop: 14, minWidth: 200 }} disabled={!!anim || hist.length >= 5} onClick={shoot}>⚽ {t("TIRER")}</button>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, fontSize: 22 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i}>{i < hist.length ? (hist[i] ? "⚽" : "🧤") : i === hist.length ? "👟" : "·"}</span>
        ))}
      </div>
    </div>
  );
}

/* ---- ⚽ Jongles ---- */
function Jongles({ onEnd, record }) {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const box = useRef(null), ball = useRef(null), st = useRef(null);

  function start() {
    setCount(0); setRunning(true);
    const W = box.current.clientWidth, H = box.current.clientHeight;
    // départ haut + ballon qui MONTE d'abord → on a le temps avant le 1er contact
    st.current = { x: W / 2, y: H * 0.30, vx: 0, vy: -3, W, H, n: 0, dead: false };
    let last = performance.now();
    const loop = (now) => {
      const s = st.current;
      if (!s || s.dead) return;
      const dt = Math.min((now - last) / 16.7, 3); last = now;
      s.vy += 0.26 * dt * (1 + s.n * 0.008);  // gravité douce, monte lentement avec la série
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 26) { s.x = 26; s.vx = Math.abs(s.vx) * 0.85; }
      if (s.x > s.W - 26) { s.x = s.W - 26; s.vx = -Math.abs(s.vx) * 0.85; }
      if (s.y > s.H - 26) { s.dead = true; setRunning(false); onEnd(s.n, s.n >= 20); return; }
      if (s.y < 26) { s.y = 26; s.vy = Math.abs(s.vy) * 0.5; }
      if (ball.current) ball.current.style.transform = `translate(${s.x - 26}px, ${s.y - 26}px) rotate(${s.n * 40 + s.x}deg)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function tap(e) {
    const s = st.current;
    if (!s || s.dead || !running) return;
    const r = box.current.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    if (Math.hypot(cx - s.x, cy - s.y) < 78) {   // zone de frappe plus large
      s.vy = -(7.5 + Math.min(s.n * 0.06, 3));   // rebond maîtrisé
      s.vx += (s.x - cx) * 0.18;                 // tape sur le côté → le ballon part
      s.x += (s.x - cx) * 0.02;
      s.n++; setCount(s.n);
    }
  }

  useEffect(() => () => { if (st.current) st.current.dead = true; }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div className={"poster jcount" + (count > 0 && count % 10 === 0 ? " pop" : "")} key={count} style={{ fontSize: 44, marginBottom: 4, color: count >= 20 ? "var(--win)" : "var(--ink)" }}>{count}</div>
      <div className="mono muted" style={{ fontSize: 11.5, marginBottom: 6 }}>
        {t("Objectif")} : 20 {record ? ` · 🏅 ${t("Record")} : ${record.pseudo} (${record.score})` : ""}
      </div>
      <div ref={box} className="jugglebox" onPointerDown={tap}>
        {!running && <Btn variant="accent" onClick={(e) => { e.stopPropagation(); start(); }} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 2 }}>⚽ {t("Lancer le ballon")}</Btn>}
        <div ref={ball} className="juggleball">⚽</div>
        <div className="juggle-floor" />
      </div>
      <div className="mono muted" style={{ fontSize: 12, marginTop: 8 }}>{t("Tape le ballon pour le garder en l'air. 20 = défi réussi !")}</div>
    </div>
  );
}

/* ---- ⏱️ Réflexe arbitre ---- */
function Arbitre({ onEnd }) {
  const [deck] = useState(() => seededShuffle(ARBITRE, daySeed(todayFR()) ^ 99).concat(seededShuffle(ARBITRE, daySeed(todayFR()) ^ 7)));
  const [i, setI] = useState(0);
  const [serie, setSerie] = useState(0);
  const [fb, setFb] = useState(null);      // 'good' | 'bad' : flash de feedback
  const timer = useRef(null);
  const deadline = Math.max(3200 - serie * 110, 1400); // large au début, on a le temps de lire

  useEffect(() => {
    if (fb) return;
    timer.current = setTimeout(() => { setFb("bad"); setTimeout(() => onEnd(serie, serie >= 10), 450); }, deadline);
    return () => clearTimeout(timer.current);
  }, [i, fb]);

  function answer(a) {
    if (fb) return;
    clearTimeout(timer.current);
    const ok = a === deck[i][1];
    setFb(ok ? "good" : "bad");
    setTimeout(() => {
      if (ok) { setSerie(serie + 1); setI(i + 1); setFb(null); }
      else onEnd(serie, serie >= 10);
    }, ok ? 220 : 600);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ fontSize: 13 }}>{t("Série")} : <b style={{ color: "var(--ink)" }}>{serie}</b> / 10 — {t("de plus en plus vite !")}</div>
      <div className="timerbar"><span key={i + (fb || "")} style={{ animationDuration: deadline + "ms", animationPlayState: fb ? "paused" : "running" }} /></div>
      <div className={"card pad-lg fbcard" + (fb ? " fb-" + fb : "")} style={{ margin: "10px 0 14px", minHeight: 84, display: "grid", placeItems: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{deck[i][0]}</div>
        {fb === "bad" && <div className="mono" style={{ fontSize: 12, color: "var(--lose)" }}>
          {t("Bonne décision :")} {deck[i][1] === "ok" ? "✅" : deck[i][1] === "j" ? "🟨" : "🟥"}
        </div>}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="refbtn" onClick={() => answer("ok")}>✅<br />{t("Laisser jouer")}</button>
        <button className="refbtn" onClick={() => answer("j")}>🟨<br />{t("Jaune")}</button>
        <button className="refbtn" onClick={() => answer("r")}>🟥<br />{t("Rouge")}</button>
      </div>
    </div>
  );
}

/* ---- 🧱 Casse-brique foot ----
   Mur GÉNÉRÉ CHAQUE JOUR (graine = date, le même pour toute la ligue).
   Bonus 🧴 banc large · ❤️ vie · 🐢 balle lente. Malus 💣 banc rétréci · 🔥 balle rapide. */
const BRICK = {
  norm:  { ico: "👕", bg: null },
  wide:  { ico: "🧴", bg: "#39b6d8" },  // bonus : banc large 8s
  heart: { ico: "❤️", bg: "#1f8a4c" },  // bonus : +1 vie
  slow:  { ico: "🐢", bg: "#0ea5b7" },  // bonus : balle lente 6s
  bomb:  { ico: "💣", bg: "#7a1d16" },  // malus : banc rétréci 8s
  fast:  { ico: "🔥", bg: "#e36414" },  // malus : balle rapide 6s
};
/* Pochoirs (9 colonnes × 7 lignes). '#' = brique. Une forme tirée chaque jour. */
const SHAPES = [
  { nom: "Rectangle", g: ["#########", "#########", "#########", "#########", "#########", "#########", "#########"] },
  { nom: "Losange",   g: ["....#....", "...###...", "..#####..", "#########", "..#####..", "...###...", "....#...."] },
  { nom: "Cœur",      g: [".##...##.", "#########", "#########", "#########", ".#######.", "..#####..", "...###..."] },
  { nom: "Trophée",   g: ["#.#####.#", "#.#####.#", ".#######.", "..#####..", "...###...", "...###...", ".#######."] },
  { nom: "Rond",      g: ["..#####..", ".#######.", "#########", "#########", "#########", ".#######.", "..#####.."] },
  { nom: "Pyramide",  g: ["....#....", "...###...", "..#####..", ".#######.", "#########", "#########", "#########"] },
  { nom: "Croix",     g: ["...###...", "...###...", "#########", "#########", "#########", "...###...", "...###..."] },
  { nom: "Flèche",    g: ["....#....", "...###...", "..#####..", ".#######.", "#########", "...###...", "...###..."] },
  { nom: "Ballon",    g: ["..#####..", ".##.#.##.", "##.###.##", "#########", "##.###.##", ".##.#.##.", "..#####.."] },
  { nom: "Sourire",   g: ["#########", "#.#...#.#", "#.#...#.#", "#########", "#.#####.#", "##.....##", ".#######."] },
];
function CasseBrique({ onEnd }) {
  const cv = useRef(null);
  const [info, setInfo] = useState({ broken: 0, lives: 3, fx: "" });
  const shape = SHAPES[daySeed(todayFR()) % SHAPES.length];   // forme du jour
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const c = cv.current, ctx = c.getContext("2d");
    const W = 340, H = 440;
    const COLS = 9, ROWS = 7, BW = 34, BH = 15, TOP = 34, GAP = 3;
    const GW = COLS * BW + (COLS - 1) * GAP;          // largeur du mur
    const OX = Math.round((W - GW) / 2);              // centrage horizontal
    // RNG du jour → mur identique pour tous, différent chaque jour
    let seed = (daySeed(todayFR()) ^ 0x9e3b) >>> 0;
    const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
    const pickKind = () => {
      const r = rng();
      if (r < 0.06) return "heart";
      if (r < 0.15) return "wide";
      if (r < 0.22) return "slow";
      if (r < 0.32) return "bomb";
      if (r < 0.42) return "fast";
      return "norm";
    };
    // ne pose des briques que sur les cases '#' du pochoir du jour
    const bricks = [];
    for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
      if (shape.g[r] && shape.g[r][q] === "#")
        bricks.push({ x: OX + q * (BW + GAP), y: TOP + r * (BH + GAP), kind: pickKind(), row: r, on: true });
    }
    const TOTAL = bricks.length;
    setTotal(TOTAL);

    let paddleX = W / 2, wideUntil = 0, narrowUntil = 0, slowUntil = 0, fastUntil = 0;
    let ball = { x: W / 2, y: H - 34, vx: 0, vy: 0, stuck: true };
    let lives = 3, broken = 0, dead = false, fx = "", fxUntil = 0;
    const rowColors = ["#d52b1e", "#e36414", "#1f8a4c", "#2a5bd7", "#7a5ae0"];
    const flash = (txt, now) => { fx = txt; fxUntil = now + 1100; setInfo({ broken, lives, fx: txt }); };

    function move(e) { const r = c.getBoundingClientRect(); paddleX = ((e.clientX - r.left) / r.width) * W; }
    function launch() { if (ball.stuck) { ball.stuck = false; ball.vx = (rng() - 0.5) * 3; ball.vy = -3.6; } }
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerdown", (e) => { move(e); launch(); });

    function loop(now) {
      if (dead) return;
      const paddleW = now < narrowUntil ? 44 : now < wideUntil ? 104 : 68;  // malus prioritaire
      const mul = now < fastUntil ? 1.45 : now < slowUntil ? 0.6 : 1;
      const px = Math.max(paddleW / 2, Math.min(W - paddleW / 2, paddleX));
      if (now > fxUntil) fx = "";
      if (ball.stuck) { ball.x = px; ball.y = H - 34; }
      else {
        ball.x += ball.vx * mul; ball.y += ball.vy * mul;
        if (ball.x < 8 || ball.x > W - 8) ball.vx *= -1;
        if (ball.y < 8) ball.vy *= -1;
        if (ball.y > H - 26 && ball.y < H - 14 && Math.abs(ball.x - px) < paddleW / 2 + 4 && ball.vy > 0) {
          ball.vy = -Math.abs(ball.vy);
          ball.vx += (ball.x - px) * 0.07;
        }
        if (ball.y > H + 10) {
          lives--; setInfo({ broken, lives, fx });
          if (lives <= 0) { dead = true; onEnd(broken, broken >= TOTAL); return; }
          ball = { x: px, y: H - 34, vx: 0, vy: 0, stuck: true };
        }
        for (const b of bricks) {
          if (!b.on) continue;
          if (ball.x > b.x - 6 && ball.x < b.x + BW + 6 && ball.y > b.y - 6 && ball.y < b.y + BH + 6) {
            b.on = false; broken++; ball.vy *= -1;
            if (b.kind === "wide") { wideUntil = now + 8000; narrowUntil = 0; flash("🧴 " + t("Banc large !"), now); }
            else if (b.kind === "bomb") { narrowUntil = now + 8000; wideUntil = 0; flash("💣 " + t("Banc rétréci !"), now); }
            else if (b.kind === "slow") { slowUntil = now + 6000; fastUntil = 0; flash("🐢 " + t("Balle lente"), now); }
            else if (b.kind === "fast") { fastUntil = now + 6000; slowUntil = 0; flash("🔥 " + t("Balle rapide !"), now); }
            else if (b.kind === "heart") { lives = Math.min(5, lives + 1); flash("❤️ " + t("Vie +1 !"), now); }
            else setInfo({ broken, lives, fx });
            break;
          }
        }
        if (broken >= TOTAL) { dead = true; onEnd(broken, true); return; }
      }
      // dessin
      ctx.fillStyle = "#10301c"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.strokeRect(4, 4, W - 8, H - 8);
      for (const b of bricks) {
        if (!b.on) continue;
        ctx.fillStyle = BRICK[b.kind].bg || rowColors[b.row];
        ctx.fillRect(b.x, b.y, BW, BH);
        ctx.font = "11px sans-serif"; ctx.fillText(BRICK[b.kind].ico, b.x + BW / 2 - 7, b.y + BH - 4);
      }
      ctx.fillStyle = now < narrowUntil ? "#e36414" : now < wideUntil ? "#39b6d8" : "#f3ede2";
      ctx.fillRect(px - paddleW / 2, H - 20, paddleW, 8);
      ctx.font = "16px sans-serif"; ctx.fillText("⚽", ball.x - 8, ball.y + 6);
      if (fx) { ctx.fillStyle = "#fff"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center"; ctx.fillText(fx, W / 2, 26); ctx.textAlign = "left"; }
      if (ball.stuck) { ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.fillText(t("Tape pour lancer !"), W / 2, H / 2); ctx.textAlign = "left"; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return () => { dead = true; c.removeEventListener("pointermove", move); };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ fontSize: 13, marginBottom: 6 }}>
        🧱 {t("Forme du jour")} : <b style={{ color: "var(--ink)" }}>{t(shape.nom)}</b> · 👕 {info.broken}/{total || "…"} · {"❤️".repeat(Math.max(0, info.lives))}
      </div>
      <div className="mono muted" style={{ fontSize: 10.5, marginBottom: 8 }}>
        🧴 {t("banc large")} · ❤️ {t("vie")} · 🐢 {t("balle lente")} · 💣 {t("banc rétréci")} · 🔥 {t("balle rapide")}
      </div>
      <canvas ref={cv} width="340" height="440" className="brickcanvas" />
    </div>
  );
}

/* ---- 🚩 Devine le drapeau ---- */
function Drapeaux({ onEnd }) {
  const seed = daySeed(todayFR());
  const [rounds] = useState(() => {
    const pool = seededShuffle(FLAG_POOL, seed);
    return pool.slice(0, 10).map((code, i) => {
      const others = seededShuffle(pool.filter((c) => c !== code), seed + i * 13).slice(0, 3);
      return { code, choices: seededShuffle([code, ...others], seed + i * 31) };
    });
  });
  const [i, setI] = useState(0);
  const [bonnes, setBonnes] = useState(0);
  const [left, setLeft] = useState(30.0);
  const [fb, setFb] = useState(null); // { pick } : montre vert/rouge un instant
  const done = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => {
      if (l <= 0.1) { clearInterval(id); if (!done.current) { done.current = true; setTimeout(() => onEnd(bonnes, bonnes >= 8), 0); } return 0; }
      return +(l - 0.1).toFixed(1);
    }), 100);
    return () => clearInterval(id);
  }, [bonnes]);

  function pick(c) {
    if (done.current || fb) return;
    setFb({ pick: c });
    const ok = c === rounds[i].code;
    setTimeout(() => {
      const b = bonnes + (ok ? 1 : 0);
      setBonnes(b); setFb(null);
      if (i + 1 >= 10) { done.current = true; onEnd(b + Math.round(left), b >= 8); }
      else setI(i + 1);
    }, ok ? 180 : 550);
  }

  const nm = (c) => teamName(c, WC.T[c] ? WC.T[c].name : c);
  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono muted" style={{ fontSize: 13 }}>{i + 1}/10 · ✅ {bonnes} · ⏱️ <b style={{ color: left < 8 ? "var(--lose)" : "var(--ink)" }}>{left.toFixed(0)}s</b></div>
      <div style={{ fontSize: 96, lineHeight: 1.2, margin: "10px 0" }}>{flagEmoji(rounds[i].code)}</div>
      <div className="choicegrid">
        {rounds[i].choices.map((c) => (
          <button key={c} onClick={() => pick(c)}
            className={"choicebtn" + (fb ? (c === rounds[i].code ? " good" : c === fb.pick ? " bad" : "") : "")}>
            {nm(c)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =================== HUB =================== */
const COMPONENTS = { penalty: Penalty, jongles: Jongles, arbitre: Arbitre, casse: CasseBrique, drapeau: Drapeaux };

function GameCard({ g, today, record, onPlay, isAdmin }) {
  const played = today[g.id];
  return (
    <div className="card pad gamecard rise">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 34 }}>{g.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>{t(g.name)}</div>
          {record
            ? <div className="mono muted" style={{ fontSize: 11 }}>🏅 {t("Record")} : {record.pseudo} ({record.score})</div>
            : <div className="mono muted" style={{ fontSize: 11 }}>{t("Pas encore de record — bats-le !")}</div>}
        </div>
        {played
          ? <span style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <span className="pill" style={{ fontSize: 12 }}>{t("ton score")} : {played.score}</span>
              <Btn variant="ghost" onClick={() => onPlay(g, true)} style={{ padding: "5px 10px", fontSize: 11.5 }}>🔁 {t("Rejouer")}</Btn>
            </span>
          : <Btn variant="accent" onClick={() => onPlay(g, false)} style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>{t("Jouer")}</Btn>}
      </div>
    </div>
  );
}

export function GamesScreen({ profile }) {
  const [section, setSection] = useState("jeux"); // jeux | classement
  const [today, setToday] = useState({});
  const [records, setRecords] = useState({});
  const [active, setActive] = useState(null);     // { g, test } : jeu en cours
  const [result, setResult] = useState(null);     // { g, score, isRecord, saveErr, test }

  async function load() {
    if (!hasSupabase) return;
    try {
      const [td, rec] = await Promise.all([fetchMyGamesToday(), fetchGameRecords()]);
      setToday(td); setRecords(rec);
    } catch (e) { console.error("jeux:", e); }
  }
  useEffect(() => { load(); }, []);

  async function finish(g, score, won, test) {
    let saveErr = null, isRecord = false;
    const prev = records[g.id];
    if (!test) {
      isRecord = !prev || score > prev.score;       // nouveau record de la ligue ?
      if (hasSupabase) { const r = await saveGameScore(g.id, score, false); saveErr = r.error; }
    }
    setActive(null);
    setResult({ g, score, isRecord, saveErr, test });
    if (!test) load();
  }

  /* --- partie en cours --- */
  if (active) {
    const g = active.g;
    const Comp = COMPONENTS[g.id];
    return (
      <div className="content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 className="poster" style={{ margin: 0, fontSize: 24 }}>{g.icon} {t(g.name)}{active.test ? " 🧪" : ""}</h2>
          <Btn variant="ghost" onClick={() => setActive(null)} style={{ padding: "7px 12px", fontSize: 12.5 }}>{t("Abandonner")}</Btn>
        </div>
        {active.test && <div className="mono muted" style={{ fontSize: 11.5, marginBottom: 10 }}>🔁 {t("Entraînement — score non enregistré.")}</div>}
        <div className="card pad-lg">
          <Comp onEnd={(score, won) => finish(g, score, won, active.test)} record={records[g.id]} />
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {result && result.isRecord && <Confetti onDone={() => {}} />}
      <SectionTitle kicker={t("Joue pour le fun · bats les records")} title={t("Mini-jeux") + " 🎮"}
        right={<div className="seg">
          <button className={section === "jeux" ? "on" : ""} onClick={() => setSection("jeux")}>{t("Jeux")}</button>
          <button className={section === "records" ? "on" : ""} onClick={() => setSection("records")}>🏅 {t("Records")}</button>
        </div>} />

      {result && (
        <div className={"card pad-lg rise"} style={{ marginBottom: 16, textAlign: "center", borderColor: result.isRecord ? "var(--gold)" : "var(--line)" }}>
          <div style={{ fontSize: 40 }}>{result.test ? "🧪" : result.isRecord ? "🏅" : "👏"}</div>
          <div className="poster" style={{ fontSize: 22 }}>
            {result.g.icon} {t(result.g.name)} — {t("score")} {result.score}
          </div>
          <div style={{ fontWeight: 700, color: result.isRecord ? "var(--gold)" : "var(--ink-soft)", margin: "4px 0 10px" }}>
            {result.test
              ? t("Partie d'entraînement — non enregistrée.")
              : result.isRecord ? t("🏅 Nouveau record de la ligue !") : t("Bien joué ! Rejoue pour battre le record.")}
          </div>
          {result.saveErr && <div className="mono" style={{ fontSize: 11.5, color: "var(--lose)" }}>⚠️ {result.saveErr}</div>}
          <Btn variant="ghost" onClick={() => setResult(null)} style={{ padding: "7px 14px", fontSize: 12.5 }}>OK</Btn>
        </div>
      )}

      {section === "jeux" && (
        <>
          <div className="card pad rise" style={{ marginBottom: 16 }}>
            <span className="muted" style={{ fontSize: 13.5 }}>
              🎮 {t("Les mini-jeux sont là juste pour le fun : pas de points au classement, mais essaie de battre le record de la ligue !")}
            </span>
          </div>
          <div className="grid g-2">
            {GAMES.map((g) => <GameCard key={g.id} g={g} today={today} record={records[g.id]}
              onPlay={(game, test) => setActive({ g: game, test })} />)}
          </div>
        </>
      )}

      {section === "records" && (
        <div className="card pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>🏅 {t("Records de la ligue")}</div>
          {GAMES.map((g) => {
            const r = records[g.id];
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <span style={{ fontSize: 24 }}>{g.icon}</span>
                <b style={{ flex: 1 }}>{t(g.name)}</b>
                {r
                  ? <span className="mono"><span style={{ marginRight: 6 }}>{r.avatar}</span>{r.pseudo} · <b>{r.score}</b></span>
                  : <span className="mono muted">{t("aucun record")}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
