"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

export type Course = "separate" | "combined";
export type TierPref = "foundation" | "higher";

export interface Attempt {
  score: number;
  max: number;
  ts: number;
}

export interface CardState {
  box: number; // Leitner box 1..5
  due: number; // epoch ms
  reviews: number;
}

export interface Session {
  ts: number;
  label: string;
  score: number;
  max: number;
  count: number;
}

export interface State {
  v: 1;
  course: Course;
  tier: TierPref;
  attempts: Record<string, Attempt[]>; // question id -> attempts (latest last)
  cards: Record<string, CardState>; // flashcard id -> state
  bookmarks: string[];
  visited: Record<string, number>; // subtopic id -> last visit
  sessions: Session[];
  streak: { last: string; count: number };
}

const KEY = "gcse-science:v1";
const DEFAULT: State = {
  v: 1,
  course: "separate",
  tier: "higher",
  attempts: {},
  cards: {},
  bookmarks: [],
  visited: {},
  sessions: [],
  streak: { last: "", count: 0 },
};

let state: State = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable: keep defaults in memory */
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function getState(): State {
  load();
  return state;
}

export function update(fn: (s: State) => State) {
  load();
  state = fn(state);
  save();
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns the stored state, or the defaults during server render / first paint. */
export function useStore(): State {
  return useSyncExternalStore(subscribe, getState, () => DEFAULT);
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function touchStreak(s: State): State {
  const t = today();
  if (s.streak.last === t) return s;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return { ...s, streak: { last: t, count: s.streak.last === y ? s.streak.count + 1 : 1 } };
}

export function recordAttempt(qid: string, score: number, max: number) {
  update((s) => {
    const prev = s.attempts[qid] ?? [];
    return touchStreak({ ...s, attempts: { ...s.attempts, [qid]: [...prev.slice(-9), { score, max, ts: Date.now() }] } });
  });
}

export function recordSession(sess: Omit<Session, "ts">) {
  update((s) => ({ ...s, sessions: [...s.sessions.slice(-49), { ...sess, ts: Date.now() }] }));
}

export function toggleBookmark(qid: string) {
  update((s) => ({
    ...s,
    bookmarks: s.bookmarks.includes(qid) ? s.bookmarks.filter((b) => b !== qid) : [...s.bookmarks, qid],
  }));
}

export function markVisited(subtopicId: string) {
  update((s) => ({ ...s, visited: { ...s.visited, [subtopicId]: Date.now() } }));
}

// Leitner intervals in days for boxes 1..5
const INTERVALS = [0, 1, 3, 7, 14, 30];

export function reviewCard(cardId: string, knewIt: boolean) {
  update((s) => {
    const cur = s.cards[cardId] ?? { box: 1, due: 0, reviews: 0 };
    const box = knewIt ? Math.min(5, cur.box + 1) : 1;
    const days = knewIt ? INTERVALS[box] : 0;
    const due = knewIt ? Date.now() + days * 86400000 : Date.now() + 10 * 60000;
    return touchStreak({ ...s, cards: { ...s.cards, [cardId]: { box, due, reviews: cur.reviews + 1 } } });
  });
}

export function setPrefs(p: Partial<Pick<State, "course" | "tier">>) {
  update((s) => ({ ...s, ...p }));
}

export function resetProgress() {
  update((s) => ({ ...DEFAULT, course: s.course, tier: s.tier }));
}

export function exportProgress(): string {
  return JSON.stringify(getState());
}

export function importProgress(json: string) {
  const parsed = JSON.parse(json);
  if (parsed?.v !== 1) throw new Error("That file doesn't look like a progress backup.");
  update(() => ({ ...DEFAULT, ...parsed }));
}

/** Latest attempt per question. */
export function latest(s: State, qid: string): Attempt | undefined {
  const a = s.attempts[qid];
  return a?.[a.length - 1];
}

export function masteryFor(s: State, qids: string[]) {
  let attempted = 0;
  let got = 0;
  let max = 0;
  for (const id of qids) {
    const a = latest(s, id);
    if (!a) continue;
    attempted++;
    got += a.score;
    max += a.max;
  }
  return { attempted, total: qids.length, pct: max ? Math.round((got / max) * 100) : 0 };
}
