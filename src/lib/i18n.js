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
  "LA CDM DE GABRIEL": "ガブリエルのW杯", "ENTRE POTES": "仲間内リーグ", "GABRIEL": "ガブリエル",
  "Allez les Bleus !": "アレ・レ・ブルー！",
  "Cet email a déjà un compte. Connecte-toi.": "このメールは登録済みです。ログインしてください。",
  "Email ou mot de passe incorrect.": "メールアドレスまたはパスワードが違います。",
  "Confirme d'abord ton email (regarde tes mails).": "先にメールを確認してください。",
  "Mot de passe trop court (6 caractères minimum).": "パスワードが短すぎます（6文字以上）。",
  "Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.": "アカウント作成完了！メールを確認してからログインしてください。",
  "Problème de connexion au serveur. Réessaie.": "サーバーに接続できません。もう一度お試しください。",
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
  "Un cadeau mystère": "ミステリーギフト",
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
  "En cas d'égalité": "同点の場合",
  "À points égaux, c'est le nombre de scores exacts qui départage. Si l'égalité persiste, avantage à celui qui s'est inscrit le plus tôt dans la ligue — les premiers arrivés sont récompensés.": "同点の場合は完全的中数で順位を決めます。それでも同じなら、先にリーグに登録した人が上位になります — 早い者勝ち！",
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
  "Scores": "スコア", "Joueurs": "プレイヤー", "Bannir": "BAN する", "Débannir": "BAN 解除",
  "banni": "BAN 中", "Statut": "登録日",
  "Il disparaîtra du classement et ne pourra plus pronostiquer.": "ランキングから消え、予想もできなくなります。",
  "Un joueur banni disparaît du classement et ne peut plus saisir de pronos. Tu peux le débannir à tout moment.": "BAN されたプレイヤーはランキングから消え、予想もできなくなります。いつでも解除できます。",
  // Divers
  "Déconnexion": "ログアウト", "VS": "対", "Vainqueur": "勝者",
  // Dashboard / divers
  "SALUT": "やあ", "TA POSITION": "現在の順位", "pts": "点", "exacts": "完全的中", "toi": "あなた",
  "pas de prono": "予想なし", "en attente de ton prono": "件が予想待ち",
  "Rien par ici 🎉": "ここには何もない 🎉", "Match introuvable.": "試合が見つかりません。",
  "← Tous les matchs": "← 試合一覧へ", "non joué": "未予想",
  "TON PRONO :": "あなたの予想：", "RÉSULTAT :": "結果：",
  "bon écart": "得失差的中", "Règle les compteurs": "スコアを調整してね",
  // Détail match
  "Classement FIFA": "FIFAランキング", "Confédération": "大陸連盟",
  "Forme (5 derniers)": "直近5試合", "Cote pronostiqueurs": "予想者の支持率",
  "📍 Stade": "📍 スタジアム", "🏙️ Ville": "🏙️ 都市", "📅 Date": "📅 日付",
  "⏰ Coup d'envoi": "⏰ キックオフ", "🏆 Phase": "🏆 ステージ", "🎟️ Affluence": "🎟️ 観客数",
  "Données d'illustration.": "参考データです。", "Compo probable (illustration).": "予想スタメン（参考）。",
  "5 derniers :": "直近5試合：", "Buts marqués": "得点", "Clean sheets": "無失点試合",
  "Face-à-face (historique)": "対戦成績（過去）", "NULS": "引き分け",
  "Pas de classement de groupe ici.": "ここにはグループ順位表はありません。",
  "Voir le tableau →": "トーナメント表を見る →", "classement": "順位表",
  "Équipe": "チーム", "J": "試", "Diff": "差",
  "SCORE EXACT": "完全的中", "BON RÉSULTAT": "結果的中", "RATÉ": "ハズレ",
  // Classement / profil
  "c'est lui qui paie le McDo de Gabriel pour l'instant !": "今のところガブリエルのマック代を払うのはこの人！",
  "Sniper": "スナイパー", "En feu": "絶好調", "Assidu": "皆勤賞", "Globe-trotter": "世界旅行者",
  "scores exacts": "完全的中", "Série de": "連続", "pronos joués": "予想済み",
  "Pronos sur 6 confédérations": "6大陸連盟の試合を予想", "Points": "得点", "Rang": "順位",
  "Profil mis à jour": "プロフィールを更新しました",
  "Rappel email avant chaque coup d'envoi": "キックオフ前にメールでリマインド",
  "Notifs quand quelqu'un me dépasse": "誰かに抜かれたら通知",
  "Profil visible par toute la ligue": "プロフィールをリーグ全員に公開",
  // Règles
  "Le barème": "配点", "Exemples concrets": "具体例", "Format du tournoi": "大会方式",
  "Le Graal : bon vainqueur ET bon score.": "完璧：勝者もスコアも的中。",
  "Bon résultat + bon écart de buts": "結果的中＋得失差的中",
  "Bon vainqueur et la bonne différence (2–1 → 3–2).": "勝者と得失差が的中（2–1 → 3–2）。",
  "Bon vainqueur (ou nul bien vu) mais pas le bon score.": "勝者（または引き分け）は的中、スコアは外れ。",
  "Pas le bon vainqueur. Zéro pointé.": "勝者を外した。0点。",
  "pts par série de 3 bons pronos d'affilée · les matchs de phase finale rapportent davantage.": "点：3連続的中ごとのボーナス · 決勝トーナメントは配点アップ。",
  "Tu pronostiques 2–1, le match finit 2–1": "2–1と予想、結果も2–1",
  "Tu pronostiques 2–1, le match finit 3–2": "2–1と予想、結果は3–2",
  "Tu pronostiques 2–1, le match finit 4–0": "2–1と予想、結果は4–0",
  "Tu pronostiques 1–1, le match finit 2–2": "1–1と予想、結果は2–2",
  "Tu pronostiques 2–1, le match finit 0–2": "2–1と予想、結果は0–2",
  "Bon vainqueur + bon écart (+1)": "勝者＋得失差的中（+1）",
  "Bon vainqueur, écart différent": "勝者的中、得失差は外れ",
  "Match nul bien vu": "引き分けを的中",
  "48 équipes, 12 groupes de 4 (A→L).": "48チーム、4チームずつ12グループ（A→L）。",
  "Les 2 premiers de chaque groupe + les 8 meilleurs 3es se qualifient.": "各グループ上位2チーム＋3位の上位8チームが突破。",
  "Puis élimination directe : 16es → 8es → quarts → demies → finale (+ petite finale).": "その後はノックアウト：ラウンド32 → ラウンド16 → 準々決勝 → 準決勝 → 決勝（＋3位決定戦）。",
  "Le tableau se remplit automatiquement à chaque résultat.": "結果が出るたびに表は自動更新。",
  "Du 11 juin au 19 juillet 2026 · 104 matchs · USA · Canada · Mexique.": "2026年6月11日〜7月19日 · 104試合 · アメリカ · カナダ · メキシコ。",
  "Le grand gagnant passe une journée avec le boss.": "優勝者はボスと1日過ごせる。",
  "Si t'as bon, Gabriel te paie le McDo.": "当てたらガブリエルがマックをおごる。",
  "Pour bien finir le tournoi.": "大会の締めくくりに。",
  "Le dernier de la ligue régale le boss.": "最下位はボスにおごる。",
  // Tableau / admin
  "Mise à jour auto": "自動更新",
  "Dès qu'un résultat tombe, les classements se recalculent automatiquement.": "結果が出ると順位は自動で再計算されます。",
  "Le tableau à élimination directe se remplira automatiquement après la phase de groupes (à partir du 28 juin). En attendant, fais tes pronos !": "ノックアウト表はグループステージ終了後（6月28日以降）に自動で埋まります。それまで予想しよう！",
  "Tape le score final d'un match et clique Valider : les points se calculent automatiquement. Tu peux corriger ou rouvrir un match à tout moment.": "試合の最終スコアを入力して「確定」を押すと、全員の得点が自動計算されます。いつでも修正・再開できます。",
  // Lots (tableau de bord / règles)
  "🏆 Une journée en tête-à-tête avec Gabriel + resto": "🏆 ガブリエルと1日デート＋食事",
  "🍔 Un McDo offert par Gabriel": "🍔 ガブリエルおごりのマック",
  "🎁 Un cadeau mystère": "🎁 ミステリーギフト",
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
  "Groupe": "グループ", "Résultats": "結果", "Score": "スコア", "Date": "日付", "Match": "試合",
  "Tous les résultats": "全試合の結果", "Résultats des matchs": "試合結果", "à venir": "予定",
  "Voir les matchs →": "試合を見る →", "Qualifié": "突破", "Repêchable": "敗者復活",
  "qualifiés": "突破", "repêchable (8 meilleurs 3es)": "敗者復活枠（3位の上位8チーム）",
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
