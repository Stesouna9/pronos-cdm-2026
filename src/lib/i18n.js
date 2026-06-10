/* ============================================================
   i18n.js — bilingue Français / Japonais.
   t("texte français") -> japonais si langue = ja, sinon le FR.
   La langue est globale (module) + notifie l'app pour re-render.
   ============================================================ */

let _lang = "fr";
try { _lang = localStorage.getItem("pronos2026:lang") || "fr"; } catch (e) {}

const listeners = new Set();
export function subscribeLang(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getLang() { return _lang; }
export function setLang(l) {
  _lang = l === "ja" ? "ja" : "fr";
  try { localStorage.setItem("pronos2026:lang", _lang); } catch (e) {}
  document.documentElement.lang = _lang;
  listeners.forEach((f) => f());
}

// Dictionnaire FR -> JA. Toute chaîne absente retombe sur le français.
const JA = {
  // Navigation
  "Accueil": "ホーム", "Matchs": "試合", "Tableau": "トーナメント表",
  "Classement": "ランキング", "Profil": "プロフィール", "Règles": "ルール", "Admin": "管理",
  "Coupe du Monde 2026": "2026 ワールドカップ", "CDM DE GABRIEL": "ガブリエルのW杯",
  // Auth
  "Créer un compte": "アカウント作成", "Se connecter": "ログイン",
  "Rejoins la ligue": "リーグに参加", "Content de te revoir": "おかえりなさい",
  "Inscription par email — 30 secondes.": "メールで登録 — 30秒。",
  "Reprends tes pronos là où tu les as laissés.": "予想の続きをしよう。",
  "Adresse email": "メールアドレス", "Pseudo (visible au classement)": "ニックネーム（ランキングに表示）",
  "Mot de passe": "パスワード", "Choisis ton avatar": "アバターを選ぶ",
  "Créer mon compte →": "アカウントを作成 →", "Se connecter →": "ログイン →",
  "LA LIGUE PRIVÉE DE GABRIEL & SES POTES": "ガブリエルと仲間たちのプライベートリーグ",
  "PRONOSTIQUE.": "予想しよう。", "RAFLE LE PODIUM. 🏆": "表彰台を狙え。🏆",
  "CE QUE TU PEUX GAGNER": "もらえる賞品",
  "Une journée + resto avec Gabriel": "ガブリエルと1日デート＋食事",
  "Un McDo offert par Gabriel": "ガブリエルおごりのマック",
  "Un sex toy": "大人のおもちゃ",
  "🥄 Et le dernier du classement… paie le McDo de Gabriel.": "🥄 最下位は…ガブリエルのマック代を払う。",
  "En t'inscrivant tu acceptes de chambrer dans le respect.": "登録すると、リスペクトを持ってイジり合うことに同意したことになります。",
  "Mot de passe oublié ? Demande à l'admin de la ligue.": "パスワードを忘れた？リーグの管理者に聞いてね。",
  "équipes": "チーム", "matchs": "試合", "jours": "日間",
  // Tableau de bord
  "Faire mes pronos": "予想する", "⚡ Faire mes pronos": "⚡ 予想する",
  "Prochain coup d'envoi": "次のキックオフ", "Pronostiquer →": "予想する →",
  "Le podium & les lots": "表彰台と賞品", "À la fin du tournoi": "大会終了時",
  "Voir le classement →": "ランキングを見る →", "Tout voir →": "すべて見る →",
  "À pronostiquer maintenant": "今すぐ予想", "PRONOS À VENIR SAISIS": "予想済み（今後の試合）",
  "Le Champion": "優勝", "Le Dauphin": "準優勝", "Le Podium": "3位", "La Cuillère de bois": "最下位賞",
  "Classement": "ランキング", "Total": "合計", "Scores exacts": "完全的中",
  "Bons résultats": "結果的中", "PTS": "点", "SÉRIE EN COURS": "連続的中",
  "SCORES EXACTS": "完全的中",
  // Matchs
  "Les matchs": "試合一覧", "Tous": "すべて", "À pronostiquer": "予想する", "Terminés": "終了",
  "Groupes": "グループ", "Finale": "決勝",
  "Ton prono ?": "あなたの予想は？", "Ton prono :": "あなたの予想：",
  "Ajuste puis c'est sauvé": "調整すると自動保存", "non joué": "未予想",
  "Pronostic ouvert dès que les qualifiés sont connus.": "出場チームが決まり次第、予想できます。",
  "🔒 Pronos fermés (coup d'envoi passé)": "🔒 締切（キックオフ済み）",
  "À déterminer": "未定", "Terminé": "終了", "Bientôt": "まもなく", "À venir": "予定",
  "En cours": "進行中",
  // Détail
  "← Tous les matchs": "← 試合一覧へ", "Ton pronostic": "あなたの予想",
  "Aperçu": "概要", "Compos probables": "予想スタメン", "Forme & face-à-face": "調子・対戦成績",
  "Contexte groupe": "グループ状況", "Confrontation": "対戦", "Infos match": "試合情報",
  // Règles
  "Comment on marque des points": "得点の仕組み", "Règles & barème": "ルールと配点",
  "Le barème": "配点", "Score exact": "完全的中", "Bon résultat": "結果的中",
  "Mauvais résultat": "不的中", "Exemples concrets": "具体例", "Format du tournoi": "大会方式",
  "Les lots": "賞品", "🎁 Bonus": "🎁 ボーナス",
  // Classement
  "Joueur": "プレイヤー", "Exacts": "完全", "Bons": "結果", "Série": "連続", "Points": "得点",
  "Général": "総合", "Cette semaine": "今週", "🏆 CHAMPION": "🏆 優勝", "Champion": "優勝",
  // Profil
  "Ton compte": "アカウント", "Personnaliser": "カスタマイズ", "Pseudo": "ニックネーム",
  "Email": "メール", "Avatar": "アバター", "Équipe de cœur": "推しチーム",
  "Enregistrer": "保存", "Préférences": "設定", "Badges": "バッジ",
  // Admin
  "Réservé à toi (admin)": "管理者専用", "Saisie des scores": "スコア入力",
  "À saisir": "入力待ち", "Valider": "確定", "Corriger": "修正", "Rouvrir": "再開",
  // Divers
  "Déconnexion": "ログアウト", "VS": "対", "Vainqueur": "勝者",
  // Lots (tableau de bord / règles)
  "🏆 Une journée en tête-à-tête avec Gabriel + resto": "🏆 ガブリエルと1日デート＋食事",
  "🍔 Un McDo offert par Gabriel": "🍔 ガブリエルおごりのマック",
  "🔞 Un sex toy": "🔞 大人のおもちゃ",
  "🍟 Tu paies le McDo de Gabriel": "🍟 ガブリエルのマック代を払う",
  "🥄 Cuillère de bois : le dernier du classement paie la première tournée.": "🥄 最下位賞：最下位はガブリエルにおごる。",
  // Hero / stats
  "PTS": "点", "SCORES EXACTS": "完全的中", "SÉRIE EN COURS": "連続的中", "pts": "点",
  // Classement / profil / règles / admin (titres + libellés)
  "Classement": "ランキング", "Profil": "プロフィール", "Le tableau": "トーナメント表",
  "Comment on marque des points": "得点の仕組み", "Règles & barème": "ルールと配点",
  "Ton compte": "アカウント", "Réservé à toi (admin)": "管理者専用", "Saisie des scores": "スコア入力",
  "Tape le score final d'un match et clique": "試合の最終スコアを入力して押す",
  "Aucun match dans ce filtre. Les matchs deviennent saisissables une fois le coup d'envoi passé.": "この絞り込みに試合はありません。キックオフ後に入力可能になります。",
  "Le tableau": "トーナメント表", "12 groupes": "12グループ", "Phase finale": "決勝トーナメント",
  "🏆 Phase finale à venir": "🏆 決勝トーナメントは近日",
  "Voir les matchs →": "試合を見る →", "Qualifié": "突破", "Repêchable": "敗者復活",
};

// Noms d'équipes en japonais (code FIFA -> JA).
export const JA_TEAMS = {
  MEX: "メキシコ", RSA: "南アフリカ", KOR: "韓国", CZE: "チェコ", CAN: "カナダ",
  BIH: "ボスニア・ヘルツェゴビナ", QAT: "カタール", SUI: "スイス", BRA: "ブラジル",
  MAR: "モロッコ", HAI: "ハイチ", SCO: "スコットランド", USA: "アメリカ", PAR: "パラグアイ",
  AUS: "オーストラリア", TUR: "トルコ", GER: "ドイツ", CUW: "キュラソー", CIV: "コートジボワール",
  ECU: "エクアドル", NED: "オランダ", JPN: "日本", SWE: "スウェーデン", TUN: "チュニジア",
  BEL: "ベルギー", EGY: "エジプト", IRN: "イラン", NZL: "ニュージーランド", ESP: "スペイン",
  CPV: "カーボベルデ", KSA: "サウジアラビア", URU: "ウルグアイ", FRA: "フランス", SEN: "セネガル",
  IRQ: "イラク", NOR: "ノルウェー", ARG: "アルゼンチン", ALG: "アルジェリア", AUT: "オーストリア",
  JOR: "ヨルダン", POR: "ポルトガル", COD: "コンゴ民主共和国", UZB: "ウズベキスタン", COL: "コロンビア",
  ENG: "イングランド", CRO: "クロアチア", GHA: "ガーナ", PAN: "パナマ",
  DEN: "デンマーク", POL: "ポーランド", HON: "ホンジュラス", CRC: "コスタリカ",
};

export function t(s) {
  if (_lang !== "ja") return s;
  return JA[s] != null ? JA[s] : s;
}

// Traduit un nom de phase de match (gère "Groupe A", etc.).
export function tPhase(phase) {
  if (_lang !== "ja" || !phase) return phase;
  if (JA[phase]) return JA[phase];
  const g = phase.match(/^Groupe (.+)$/);
  if (g) return "グループ " + g[1];
  const map = {
    "16es de finale": "ラウンド32", "8es de finale": "ラウンド16",
    "Quarts de finale": "準々決勝", "Demi-finales": "準決勝",
    "Petite finale": "3位決定戦", "Finale": "決勝",
  };
  return map[phase] || phase;
}
