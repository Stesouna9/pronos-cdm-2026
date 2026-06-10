/* ============================================================
   Connexion Supabase (le "cerveau" en ligne).
   --------------------------------------------------------
   Les 2 clés viennent de variables d'environnement, à mettre
   dans un fichier .env.local (voir .env.example) :
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
   Tant qu'elles ne sont pas remplies, l'appli tourne en
   MODE DÉMO (données simulées du module wc.js, rien n'est
   partagé). Dès que tu colles tes clés, le multijoueur
   réel s'active automatiquement.
   La clé "anon" est PUBLIQUE par conception : elle est faite
   pour vivre dans le navigateur, protégée côté Supabase par
   les règles de sécurité (Row Level Security).
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase ? createClient(url, anonKey) : null;
