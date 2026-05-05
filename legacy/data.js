// Sky Dodger — mock data simulating Postgres + Prisma backend

const NAMES = [
  'PixelPilot', 'CloudHopper', 'SkyflareX', 'NimbusNomad', 'ZephyrZen',
  'AeroAce', 'DriftDodger', 'GlideGuru', 'SoarSensei', 'WingWraith',
  'JetlagJoy', 'AltitudeAxe', 'CirrusCub', 'BoltBeak', 'FeatherFox',
  'StratoSam', 'BreezyBee', 'CometCai', 'HaloHawk', 'MistralMia',
  'TalonTess', 'VortexVal', 'EmberElla', 'GraviGreta', 'PlumePhi',
];

function seedScores(count, maxScore = 220, difficulty) {
  const out = [];
  const diffs = ['easy', 'normal', 'hard', 'insane'];
  for (let i = 0; i < count; i++) {
    const score = Math.max(1, Math.floor(Math.pow(Math.random(), 1.6) * maxScore));
    out.push({
      id: 'sc_' + i + '_' + Math.random().toString(36).slice(2, 7),
      userId: 'u_' + (i % NAMES.length),
      name: NAMES[i % NAMES.length],
      avatarHue: (i * 47) % 360,
      score,
      difficulty: difficulty || diffs[Math.floor(Math.random() * 4)],
      duration: score * 1.2 + Math.random() * 5,
      createdAt: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 90,
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

const ALL_TIME = seedScores(80, 280);
const WEEKLY = seedScores(40, 200);
const MONTHLY = seedScores(60, 240);
const TODAY = seedScores(20, 140);

// Current user's history (last 30 sessions)
const CURRENT_USER = {
  id: 'me',
  name: 'Mira K.',
  email: 'mira.k@gmail.com',
  joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 47,
  avatarHue: 22,
};

function seedHistory() {
  const sessions = [];
  let baseSkill = 8;
  for (let i = 30; i >= 0; i--) {
    baseSkill += (Math.random() - 0.3) * 4;
    baseSkill = Math.max(3, baseSkill);
    const dayScore = Math.floor(baseSkill + Math.random() * 6);
    sessions.push({
      id: 'h_' + i,
      score: dayScore,
      difficulty: ['easy', 'normal', 'hard', 'insane'][Math.floor(Math.random() * 3.5)],
      duration: dayScore * 1.3 + Math.random() * 4,
      createdAt: Date.now() - i * 1000 * 60 * 60 * 24 + Math.random() * 1000 * 60 * 60 * 12,
    });
  }
  return sessions;
}

const MY_HISTORY = seedHistory();
const MY_BEST = Math.max(...MY_HISTORY.map(h => h.score));
const MY_TOTAL_GAMES = MY_HISTORY.length;

// Insert current user into all-time leaderboard at a believable rank
ALL_TIME.splice(11, 0, {
  id: 'sc_me',
  userId: 'me',
  name: CURRENT_USER.name,
  avatarHue: CURRENT_USER.avatarHue,
  score: 142,
  difficulty: 'hard',
  duration: 184.2,
  createdAt: Date.now() - 1000 * 60 * 60 * 26,
  isMe: true,
});
WEEKLY.splice(4, 0, { ...ALL_TIME[12], score: 89, isMe: true });
TODAY.splice(2, 0, { ...ALL_TIME[12], score: 47, isMe: true });

const BADGES = [
  { id: 'first_flight',  name: 'First Flight',  desc: 'Play your first game',           glyph: '✦', threshold: g => g >= 1 },
  { id: 'ten_pipes',     name: 'Getting Air',   desc: 'Pass 10 obstacles',              glyph: '◆', threshold: g => g >= 10 },
  { id: 'fifty_pipes',   name: 'Sky Cruiser',   desc: 'Pass 50 obstacles in one run',   glyph: '✷', threshold: g => g >= 50 },
  { id: 'hundred_pipes', name: 'Centurion',     desc: 'Pass 100 in a single flight',    glyph: '✺', threshold: g => g >= 100 },
  { id: 'hard_mode',     name: 'Hard Knocks',   desc: 'Beat 25 on Hard',                glyph: '▲', threshold: () => true },
  { id: 'insane_mode',   name: 'Unhinged',      desc: 'Beat 15 on Insane',              glyph: '✦', threshold: () => false },
  { id: 'streak_7',      name: 'Week Warrior',  desc: 'Play 7 days in a row',           glyph: '◐', threshold: () => true },
  { id: 'top_100',       name: 'Top 100',       desc: 'Reach global top 100',           glyph: '★', threshold: () => true },
  { id: 'top_10',        name: 'Top 10',        desc: 'Reach global top 10',            glyph: '✸', threshold: () => false },
  { id: 'night_owl',     name: 'Night Owl',     desc: 'Play after midnight',            glyph: '☾', threshold: () => true },
];

window.SkyDodgerData = {
  NAMES, CURRENT_USER, ALL_TIME, WEEKLY, MONTHLY, TODAY,
  MY_HISTORY, MY_BEST, MY_TOTAL_GAMES, BADGES,
};
