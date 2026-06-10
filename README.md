# ⚽ Pronos CDM 2026

Jeu de pronostics entre potes pour la Coupe du Monde 2026.
Chacun crée un compte, pronostique les scores, et un classement commun
désigne le champion (et la cuillère de bois 🥄).

- **Site** : React + Vite, hébergé gratuitement sur **GitHub Pages**
- **Cerveau** (comptes, pronos, classement) : **Supabase** (gratuit)
- **Scores automatiques** : **GitHub Actions** + API football-data.org

---

## 🟢 Démarrer en local (sur ton ordi)

```bash
npm install
npm run dev
```

Sans clés Supabase, le site tourne en **mode démo** (données simulées).
Pour le vrai multijoueur, suis le guide ci-dessous.

---

## 🛠️ Mise en place complète (≈ 20 min, une seule fois)

### 1. Supabase — le cerveau
1. Crée un compte gratuit sur https://supabase.com → **New project**.
2. Une fois créé : menu **SQL Editor** → **New query** → copie tout le
   contenu de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. Menu **Project Settings → API**, récupère :
   - **Project URL**  → c'est `VITE_SUPABASE_URL` / `SUPABASE_URL`
   - **anon public**  → c'est `VITE_SUPABASE_ANON_KEY`
   - **service_role** → c'est `SUPABASE_SERVICE_ROLE` (⚠️ SECRÈTE)

> Pour tester en local : copie `.env.example` en `.env.local` et colle
> l'URL + la clé `anon`. Relance `npm run dev`.

### 2. Clé API football (scores auto)
1. Crée un compte gratuit sur https://www.football-data.org → tu reçois
   une **clé** (X-Auth-Token).
2. Garde-la : c'est `FOOTBALL_API_KEY`.

### 3. GitHub — publier le site
1. Crée un dépôt (repo) GitHub et pousse ce dossier dedans.
2. **Settings → Secrets and variables → Actions → New repository secret**,
   ajoute :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`
   - `FOOTBALL_API_KEY`
3. **Settings → Pages → Source : GitHub Actions**.
4. À chaque `git push` sur `main`, le site se republie tout seul.
   L'adresse s'affiche dans **Actions → Déploiement GitHub Pages**.

### 4. Importer le calendrier des matchs
- Onglet **Actions → Scores automatiques → Run workflow** (bouton à droite).
  Ça remplit la base avec les matchs, puis tourne tout seul toutes les 20 min.
- En local : `SUPABASE_URL=... SUPABASE_SERVICE_ROLE=... FOOTBALL_API_KEY=... npm run fetch-results`

### 5. Te nommer admin (optionnel)
Dans Supabase → **Table editor → profiles**, mets `is_admin = true` sur
ta ligne pour pouvoir corriger un score à la main si besoin.

---

## 🗂️ Structure

```
src/
  App.jsx              navigation + connexion (démo ou Supabase)
  lib/wc.js            données démo + barème + helpers d'affichage
  lib/supabase.js      connexion Supabase
  components/ui.jsx    briques d'interface (roundel, boutons, badges…)
  screens/             Auth, Dashboard, Matchs, Tableau, Classement, Profil, Règles
supabase/schema.sql    tables + sécurité (RLS) + calcul des points
scripts/fetch-results.mjs   import calendrier + scores depuis l'API
.github/workflows/     publication auto + scores auto
```

## 🧮 Barème
| Cas | Points |
|---|---|
| Score exact | 5 |
| Bon vainqueur + bon écart de buts | 4 |
| Bon vainqueur (ou nul) | 3 |
| Mauvais résultat | 0 |
