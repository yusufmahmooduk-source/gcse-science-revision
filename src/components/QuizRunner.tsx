"use client";
import { useMemo, useState } from "react";
import type { Question } from "@/lib/types";
import { recordSession, useStore, latest } from "@/lib/store";
import QuestionCard, { type Result } from "./QuestionCard";
import { Bar, Button } from "./ui";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Picks a mixed-difficulty set, favouring questions not yet answered or previously got wrong. */
export function pickQuestions(pool: Question[], n: number, attempts: ReturnType<typeof useStore>["attempts"]): Question[] {
  const weight = (q: Question) => {
    const a = attempts[q.id];
    const last = a?.[a.length - 1];
    if (!last) return 3;
    if (last.score < last.max) return 4;
    return 1;
  };
  const byDiff: Record<number, Question[]> = { 1: [], 2: [], 3: [] };
  for (const q of shuffle(pool)) byDiff[q.difficulty]?.push(q);
  for (const d of [1, 2, 3]) byDiff[d].sort((a, b) => weight(b) - weight(a) + (Math.random() - 0.5));
  const out: Question[] = [];
  let d = 0;
  const order = [1, 2, 2, 3, 1, 2, 3];
  while (out.length < n && (byDiff[1].length || byDiff[2].length || byDiff[3].length)) {
    const want = order[d++ % order.length];
    const src = byDiff[want].length ? byDiff[want] : byDiff[1].length ? byDiff[1] : byDiff[2].length ? byDiff[2] : byDiff[3];
    out.push(src.shift()!);
  }
  return out;
}

export function filterForUser(qs: Question[], tier: "foundation" | "higher", course: "separate" | "combined") {
  return qs.filter(
    (q) =>
      (tier === "higher" || (q.tier !== "higher" && !q.source?.higherOnly)) && (course === "separate" || !q.source?.separateOnly),
  );
}

export default function QuizRunner({ pool, size = 10, label, autoOnly = false }: { pool: Question[]; size?: number; label: string; autoOnly?: boolean }) {
  const s = useStore();
  const usable = useMemo(
    () => filterForUser(pool, s.tier, s.course).filter((q) => !autoOnly || q.type === "mcq" || q.type === "numeric"),
    [pool, s.tier, s.course, autoOnly],
  );
  const [set, setSet] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [key, setKey] = useState(0);

  function start(qs?: Question[]) {
    setSet(qs ?? pickQuestions(usable, size, s.attempts));
    setI(0);
    setResults({});
    setKey((k) => k + 1);
  }

  if (!set) {
    return (
      <div className="rounded-xl border border-line bg-card p-8 text-center">
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="mt-1 text-sm text-muted">
          {Math.min(size, usable.length)} questions, mixed difficulty, chosen to focus on what you haven&apos;t mastered yet.
        </p>
        <Button className="mt-4" onClick={() => start()} disabled={!usable.length}>
          Start quiz
        </Button>
      </div>
    );
  }

  const finished = i >= set.length;
  const total = Object.values(results).reduce((n, r) => n + r.score, 0);
  const max = set.reduce((n, q) => n + q.marks, 0);

  if (finished) {
    const wrong = set.filter((q) => (results[q.id]?.score ?? 0) < q.marks);
    const pct = max ? Math.round((total / max) * 100) : 0;
    return (
      <div className="rounded-xl border border-line bg-card p-8 text-center">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-2 text-5xl font-bold text-accent">{pct}%</p>
        <p className="mt-1 text-muted">
          {total} out of {max} marks
        </p>
        <p className="mt-3">{pct >= 80 ? "Excellent work. You know this well." : pct >= 50 ? "Solid. Have another go at the ones you missed." : "Good start. Read the notes again, then retry the ones you missed."}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {wrong.length > 0 && <Button onClick={() => start(wrong)}>Retry {wrong.length} incorrect</Button>}
          <Button variant="ghost" onClick={() => start()}>
            New quiz
          </Button>
        </div>
      </div>
    );
  }

  const q = set[i];
  const answered = results[q.id] !== undefined;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="whitespace-nowrap">
          Question {i + 1} of {set.length}
        </span>
        <Bar pct={(i / set.length) * 100} />
        <span className="whitespace-nowrap">
          {total} marks
        </span>
      </div>
      <QuestionCard
        key={`${key}-${q.id}-${i}`}
        q={q}
        onDone={(r) => {
          const next = { ...results, [q.id]: r };
          setResults(next);
          if (i === set.length - 1) {
            recordSession({
              label,
              score: Object.values(next).reduce((n, x) => n + x.score, 0),
              max,
              count: set.length,
            });
          }
        }}
      />
      <div className="flex justify-end">
        <Button onClick={() => setI(i + 1)} disabled={!answered}>
          {i === set.length - 1 ? "See results" : "Next question →"}
        </Button>
      </div>
    </div>
  );
}

export function useLatest(qid: string) {
  const s = useStore();
  return latest(s, qid);
}
