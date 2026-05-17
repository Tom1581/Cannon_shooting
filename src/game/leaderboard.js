// Weekly Top 10 leaderboard with a pluggable backend.
//
// CURRENT BACKEND: local. Stores the player's own runs in localStorage and
// returns the top 10 of *this device's* runs for the current ISO week.
// That's a true "Hall of Survivors for this device" — NOT a global leaderboard.
//
// TO MAKE IT A REAL GLOBAL WEEKLY TOP 10:
//   Option A — Firebase Firestore (easiest cross-platform, free tier):
//     1. npm i firebase
//     2. Create a Firebase project, enable Firestore in test mode initially
//     3. Drop your config into src/game/leaderboard.firebase.js
//     4. Implement `submitScore` to write to collection `scores_YYYY_WW`
//     5. Implement `getTopWeekly` to query that collection, orderBy score desc, limit 10
//     6. Set `BACKEND = 'firebase'` below.
//
//   Option B — Google Play Games Services (Android-native leaderboards):
//     1. Set up a leaderboard in Play Console > Play Games Services
//     2. npm i @openforge/capacitor-game-services (or another community plugin)
//     3. Wrap submitScore/getTopWeekly around the plugin API
//     4. Set `BACKEND = 'playgames'` below.
//
// The interface below is intentionally async so swapping backends doesn't
// require changing any caller.

const BACKEND = 'local'; // 'local' | 'firebase' | 'playgames'
const LOCAL_KEY = 'zt_leaderboard_v1';
const NAME_KEY  = 'zt_player_name';

export function getPlayerName() {
  try { return localStorage.getItem(NAME_KEY) || ''; } catch (_) { return ''; }
}
export function setPlayerName(name) {
  const trimmed = (name || '').slice(0, 16).trim();
  try { localStorage.setItem(NAME_KEY, trimmed); } catch (_) {}
  return trimmed;
}

// Returns ISO week key like "2026-W20"
export function currentWeekKey(d = new Date()) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ---------- Public interface (always async) ----------
export async function submitScore({ name, score, wave }) {
  if (BACKEND === 'local') return submitLocal({ name, score, wave });
  // Other backends would dispatch here.
  return submitLocal({ name, score, wave });
}

export async function getTopWeekly(limit = 10) {
  if (BACKEND === 'local') return getTopLocal(limit);
  return getTopLocal(limit);
}

// ---------- Local backend ----------
function readStore() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (_) {
    return {};
  }
}
function writeStore(s) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch (_) {}
}

function submitLocal({ name, score, wave }) {
  const week = currentWeekKey();
  const store = readStore();
  const list = store[week] || [];
  list.push({
    name: (name || 'You').slice(0, 16),
    score: score | 0,
    wave: wave | 0,
    at: Date.now(),
  });
  list.sort((a, b) => b.score - a.score);
  store[week] = list.slice(0, 50);
  writeStore(store);
  return Promise.resolve(list[0]?.score || score);
}

function getTopLocal(limit) {
  const week = currentWeekKey();
  const store = readStore();
  const list = (store[week] || []).slice(0, limit);
  return Promise.resolve({
    week,
    backend: BACKEND,
    isGlobal: false, // surface honestly in the UI
    entries: list,
  });
}
