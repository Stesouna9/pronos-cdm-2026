/* gamesData.js — contenus des mini-jeux (FR).
   Le tirage du jour est le même pour toute la ligue (graine = date). */

/* Graine du jour + tirage déterministe (tout le monde a les mêmes énigmes). */
export function daySeed(dayStr) {
  let s = 7;
  for (const c of dayStr) s = ((s * 31 + c.charCodeAt(0)) >>> 0);
  return s;
}
export function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Drapeaux emoji : code FIFA -> emoji (équipes CDM + quelques pièges). */
const ISO = {
  MEX: "MX", RSA: "ZA", KOR: "KR", CZE: "CZ", CAN: "CA", BIH: "BA", QAT: "QA",
  SUI: "CH", BRA: "BR", MAR: "MA", HAI: "HT", USA: "US", PAR: "PY", AUS: "AU",
  TUR: "TR", GER: "DE", CUW: "CW", CIV: "CI", ECU: "EC", NED: "NL", JPN: "JP",
  SWE: "SE", TUN: "TN", BEL: "BE", EGY: "EG", IRN: "IR", NZL: "NZ", ESP: "ES",
  CPV: "CV", KSA: "SA", URU: "UY", FRA: "FR", SEN: "SN", IRQ: "IQ", NOR: "NO",
  ARG: "AR", ALG: "DZ", AUT: "AT", JOR: "JO", POR: "PT", COD: "CD", UZB: "UZ",
  COL: "CO", CRO: "HR", GHA: "GH", PAN: "PA",
};
export function flagEmoji(fifa) {
  if (fifa === "ENG") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (fifa === "SCO") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  const iso = ISO[fifa];
  if (!iso) return "🏳️";
  return [...iso].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("");
}
export const FLAG_POOL = Object.keys(ISO).concat(["ENG", "SCO"]);

/* Réflexe arbitre : action -> bonne décision (j = jaune, r = rouge, ok = laisser jouer). */
export const ARBITRE = [
  ["Tacle par derrière, semelle en avant", "r"],
  ["Simulation grossière dans la surface", "j"],
  ["Petit pont magnifique", "ok"],
  ["Main volontaire qui stoppe un but tout fait", "r"],
  ["Maillot tiré à 60 mètres du but", "j"],
  ["Contrôle de la poitrine, rien à signaler", "ok"],
  ["Insulte l'arbitre copieusement", "r"],
  ["Retire son maillot pour célébrer", "j"],
  ["Talonnade géniale au milieu", "ok"],
  ["Coup de coude volontaire au visage", "r"],
  ["Gagne son duel à l'épaule, propre", "ok"],
  ["Fauche l'attaquant, dernier défenseur", "r"],
  ["Râle sur une touche, gentiment", "ok"],
  ["Tacle en retard, prend la cheville", "j"],
  ["Crampons en avant à hauteur du genou", "r"],
  ["Une-deux superbe dans la surface", "ok"],
  ["Perd du temps sur un six mètres", "j"],
  ["Frappe enroulée sur la barre", "ok"],
  ["Crache vers un adversaire", "r"],
  ["Bloque la relance rapide avec la main", "j"],
  ["Grand pont plein axe", "ok"],
  ["Deuxième tacle imprudent (déjà averti)", "r"],
  ["Discute calmement avec le capitaine", "ok"],
  ["Casse les lunettes du 4e arbitre en shootant le ballon", "j"],
];

/* ---------- Coin coquin 🔞 (humour & culture, jamais explicite) ---------- */

/* Quiz coquin : [question, choix x4, index bonne réponse]. */
export const QUIZ18 = [
  ["Selon les études, combien dure en moyenne un rapport (préliminaires inclus) ?", ["5 minutes", "19 minutes", "45 minutes", "1 heure"], 1],
  ["Quel pays a déjà distribué des préservatifs par la poste pendant un confinement ?", ["La France", "Le Japon", "La Belgique", "Le Brésil"], 2],
  ["Le « point G » doit son nom à…", ["Un docteur allemand", "Une chanson", "Un magazine", "Une rue de Paris"], 0],
  ["Combien de calories brûle en moyenne une partie de jambes en l'air ?", ["10", "100", "500", "1000"], 1],
  ["Quel animal a le record du rapport le plus court (environ 1 seconde) ?", ["Le lapin", "Le chimpanzé", "Le moustique", "Le hamster"], 1],
  ["En France, la fessée entre adultes consentants est…", ["Interdite", "Légale", "Taxée", "Réservée au mariage"], 1],
  ["Le mot « libertin » désignait à l'origine…", ["Un esprit libre en religion", "Un danseur", "Un parfum", "Un fromage"], 0],
  ["Quel pourcentage des Français dort nu, selon les sondages ?", ["2 %", "10 %", "25 %", "60 %"], 2],
  ["La capitale mondiale autoproclamée de l'amour est…", ["Rome", "Paris", "Venise", "Tokyo"], 1],
  ["Le « French kiss » s'appelle au Japon…", ["Kissu", "Bisou", "Le baiser de Paris", "Seppun"], 3],
  ["Quelle invention est arrivée en premier ?", ["Le préservatif", "La brosse à dents", "Le soutien-gorge", "Le bikini"], 0],
  ["Combien de muscles travaillent pendant un baiser langoureux ?", ["2", "12", "34", "146"], 2],
  ["Saint-Valentin était à l'origine…", ["Un prêtre romain", "Un chocolatier", "Un poète", "Un empereur"], 0],
  ["Le record du plus long baiser dépasse…", ["58 minutes", "8 heures", "58 heures", "5 jours"], 2],
  ["Quel pays consomme le plus de sites de rencontre par habitant ?", ["USA", "France", "Islande", "Inde"], 0],
];

/* Décode les emojis : [emojis, choix x4, index bonne réponse]. */
export const EMOJI18 = [
  ["🍑👋", ["Une fessée", "Cueillir des fruits", "Dire bonjour", "Un smoothie"], 0],
  ["🛏️🤸", ["Une sieste", "Des galipettes", "Du yoga", "Un déménagement"], 1],
  ["🚿🎶", ["Chanter sous la douche", "Un câlin sous la douche", "Laver le chien", "La pluie"], 1],
  ["🍆🍑", ["Une ratatouille", "Un marché", "Les choses sérieuses", "Un régime"], 2],
  ["👄💋👄", ["Un bisou de mamie", "Un French kiss", "Du rouge à lèvres", "Une chorale"], 1],
  ["🔥🧊", ["Chaud-froid", "La douche écossaise", "Un dessert", "Jeux de température"], 3],
  ["🐦⏰", ["Se lever tôt", "Un coup du matin", "Le réveil chante", "Un oiseau ponctuel"], 1],
  ["🎂🍒", ["Un dessert", "La cerise sur le gâteau", "Un anniversaire", "Une recette"], 1],
  ["🧤⚽", ["Le gardien", "Prendre des gants", "Un arrêt", "Protégé, c'est mieux"], 3],
  ["🌙🏃", ["Un jogging nocturne", "Une escapade de minuit", "Un cauchemar", "Insomnie"], 1],
  ["📵🛏️", ["Pas de téléphone au lit", "Mode avion", "Une panne", "Dormir tôt"], 0],
  ["🍾🥂🛁", ["Un anniversaire", "Une soirée en amoureux", "Nettoyer la baignoire", "Un naufrage"], 1],
  ["👀🙈", ["Cache-cache", "Je regarde pas, promis", "Un strip-tease", "Une surprise"], 2],
  ["🫦🍓", ["Un dessert sensuel", "Une allergie", "Le marché", "Un rouge à lèvres"], 0],
  ["💪🛏️🏆", ["Champion du monde de sieste", "Une performance", "Faire le lit vite", "Un rêve de victoire"], 1],
  ["🚪🔒🤫", ["Un cambriolage", "Ne pas déranger", "Une réunion secrète", "Fermer à clé en partant"], 1],
];

/* Pendu coquin : [mot, indice]. Lettres A-Z, pas d'accents ni espaces. */
export const PENDU18 = [
  ["GALIPETTES", "Acrobaties horizontales"],
  ["POLISSON", "Adjectif pour un esprit mal tourné"],
  ["LIBERTIN", "Esprit (très) libre du 18e siècle"],
  ["APHRODISIAQUE", "Censé donner envie (huîtres, gingembre…)"],
  ["TENTATION", "Difficile d'y résister"],
  ["FRIVOLE", "Léger, léger…"],
  ["SENSUEL", "Qui éveille les sens"],
  ["COQUIN", "Le thème de cette section"],
  ["SEDUCTION", "L'art de plaire"],
  ["CRAQUANT", "Impossible de dire non"],
  ["FANTASME", "Il reste souvent dans la tête"],
  ["STRIPTEASE", "Effeuillage artistique"],
  ["CALIN", "Le plus doux des moments"],
  ["DESHABILLE", "Tenue légère du soir"],
  ["VOLUPTE", "Plaisir raffiné des sens"],
  ["BAGATELLE", "Synonyme désuet de la chose"],
];

/* Plus haut / plus bas 🔞 : [affirmation, % approximatif (sondages publiés)]. */
export const HILO18 = [
  ["…avouent l'avoir déjà fait au bureau", 11],
  ["…avouent l'avoir déjà fait dans une voiture", 49],
  ["…dorment nus toute l'année", 25],
  ["…ont déjà envoyé un message coquin au mauvais destinataire", 14],
  ["…ont déjà simulé (au moins une fois)", 60],
  ["…regardent leur téléphone juste après l'amour", 33],
  ["…se disent satisfaits de leur vie intime", 70],
  ["…ont déjà embrassé un(e) collègue", 17],
  ["…l'ont déjà fait le matin avant le travail", 40],
  ["…ont déjà menti sur leur nombre de partenaires", 30],
  ["…trouvent les accents étrangers irrésistibles", 55],
  ["…ont rencontré leur moitié sur une appli", 22],
  ["…préfèrent un câlin à une grasse matinée", 45],
  ["…ont déjà été surpris par leurs enfants ou colocs", 20],
  ["…gardent leurs chaussettes (au moins parfois)", 28],
  ["…ont déjà fait semblant de dormir pour éviter un câlin", 35],
  ["…pensent à autre chose pendant (avoue !)", 46],
  ["…ont un surnom secret pour leur partenaire", 65],
];

/* Géo coquine : [loi/coutume (vraie ou célèbre légende urbaine), code FIFA du pays]. */
export const GEO18 = [
  ["Une ville y interdit de mourir… et l'amour aux heures de bureau dans la mairie (légende locale tenace)", "NOR"],
  ["Pays du « shunga », estampes érotiques classées trésors d'art", "JPN"],
  ["On y vend plus de préservatifs pendant le Carnaval que tout le reste de l'année", "BRA"],
  ["Le « french kiss » porte le nom de ce pays dans le monde entier", "FRA"],
  ["Berceau du tango, la danse la plus sensuelle du monde", "ARG"],
  ["Une loi y interdisait d'embrasser sur les quais de gare (pour éviter les retards de trains !)", "ENG"],
  ["Pays de la Saint-Valentin inversée : ce sont les femmes qui offrent le chocolat", "JPN"],
  ["L'État y subventionne des sites de rencontre pour relancer la natalité", "KOR"],
  ["On y trouve un musée entier consacré à l'amour… dans sa capitale très froide", "CAN"],
  ["La capitale de ce pays héberge le quartier rouge le plus célèbre du monde", "NED"],
  ["Premier pays à avoir élu une « capitale du flirt » officielle (concours local)", "AUS"],
  ["Sa loi impose la discrétion absolue : pas de bisous appuyés en public", "QAT"],
];
