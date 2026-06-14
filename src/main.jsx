import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA : rend le site installable sur l'écran d'accueil.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {});
  });
}

// Mise à jour automatique : si une nouvelle version est déployée, on recharge
// tout seul (évite le souci "l'app affiche l'ancienne version en cache").
if (import.meta.env.PROD) {
  // hash du bundle JS actuellement chargé
  const cur = (() => {
    const s = document.querySelector('script[type="module"][src*="assets/index-"]');
    const m = s && s.src.match(/assets\/(index-[\w-]+\.js)/);
    return m ? m[1] : null;
  })();
  async function checkUpdate() {
    if (!cur || document.hidden) return;
    try {
      const html = await fetch(import.meta.env.BASE_URL + "index.html", { cache: "no-store" }).then((r) => r.text());
      const m = html.match(/assets\/(index-[\w-]+\.js)/);
      if (m && m[1] !== cur && !sessionStorage.getItem("pronos2026:reloaded:" + m[1])) {
        sessionStorage.setItem("pronos2026:reloaded:" + m[1], "1"); // anti-boucle
        location.reload();
      }
    } catch (e) {}
  }
  window.addEventListener("focus", checkUpdate);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkUpdate(); });
  setInterval(checkUpdate, 5 * 60 * 1000);
  setTimeout(checkUpdate, 4000);
}
