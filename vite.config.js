import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" => les chemins sont relatifs, donc le site marche aussi bien
// sur GitHub Pages dans un sous-dossier (https://user.github.io/pronos-cdm-2026/)
// qu'à la racine. Pas besoin de connaître le nom du repo à l'avance.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
