"use client";
import { useMemo, useState } from "react";
import { ALL_SCIENCES, useBanks } from "@/lib/useBank";
import { useStore, latest } from "@/lib/store";
import QuizRunner, { filterForUser } from "@/components/QuizRunner";
import { Button } from "@/components/ui";

export default function PracticeClient() {
  const banks = useBanks(ALL_SCIENCES);
  const s = useStore();
  const [topics, setTopics] = useState<string[]>([]);
  const [size, setSize] = useState(15);
  const [mode, setMode] = useState<"mixed" | "wrong" | "bookmarked" | "new">("mixed");
  const [autoOnly, setAutoOnly] = useState(false);
  const [running, setRunning] = useState<number>(0);

  const pool = useMemo(() => {
    if (!banks) return [];
    const all = banks.flatMap((b) => b.questions).filter((q) => !topics.length || topics.includes(`${q.source!.science}:${q.source!.topicId}`));
    return filterForUser(all, s.tier, s.course).filter((q) => {
      const l = latest(s, q.id);
      if (mode === "wrong") return l && l.score < l.max;
      if (mode === "bookmarked") return s.bookmarks.includes(q.id);
      if (mode === "new") return !l;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banks, topics, mode, s.tier, s.course, running]);

  if (!banks) return <p className="text-muted">Loading questions…</p>;

  const toggle = (k: string) => setTopics((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Practice questions</h1>
        <p className="mt-1 text-muted">Build your own quiz from any mix of topics. The quiz favours questions you haven&apos;t tried or got wrong before.</p>
      </div>
      {running ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setRunning(0)}>
            ← Change settings
          </Button>
          <QuizRunner key={running} pool={pool} size={size} label="Custom practice" autoOnly={autoOnly} autoStart />
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-line bg-card p-6">
          {banks.map((b) => (
            <div key={b.science} className={`theme-${b.science}`}>
              <p className="mb-2 font-semibold capitalize text-accent">{b.science}</p>
              <div className="flex flex-wrap gap-2">
                {b.topics
                  .filter((t) => t.subtopics.length)
                  .map((t) => {
                    const k = `${b.science}:${t.id}`;
                    const on = topics.includes(k);
                    return (
                      <button
                        key={k}
                        onClick={() => toggle(k)}
                        className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-accent bg-accent text-white" : "border-line hover:bg-accent-soft"}`}
                      >
                        {t.code} {t.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted">{topics.length ? `${topics.length} topic(s) chosen.` : "No topics chosen, so questions come from everything."}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              Questions
              <select value={size} onChange={(e) => setSize(+e.target.value)} className="rounded-md border border-line bg-card px-2 py-1">
                {[5, 10, 15, 20, 30, 40].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Focus
              <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="rounded-md border border-line bg-card px-2 py-1">
                <option value="mixed">Smart mix</option>
                <option value="new">Not tried yet</option>
                <option value="wrong">Got wrong before</option>
                <option value="bookmarked">Bookmarked</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoOnly} onChange={(e) => setAutoOnly(e.target.checked)} />
              Quick mode (auto-marked questions only)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setRunning(Date.now())} disabled={!pool.length}>
              Start practice
            </Button>
            <span className="text-sm text-muted">{pool.length} questions match</span>
          </div>
        </div>
      )}
    </div>
  );
}
