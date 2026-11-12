"use client";
import { useEffect, useMemo, useState } from "react";
import type { Question, ScienceId } from "@/lib/types";
import { ALL_SCIENCES, useBanks } from "@/lib/useBank";
import { recordAttempt, recordSession, useStore } from "@/lib/store";
import { markNumeric, formatNumber } from "@/lib/marking";
import { filterForUser, pickQuestions } from "@/components/QuizRunner";
import { Badge, Button, Text } from "@/components/ui";

const PAPER_TOPICS: Record<ScienceId, [string[], string[]]> = {
  biology: [["b1", "b2", "b3", "b4"], ["b5", "b6", "b7"]],
  chemistry: [["c1", "c2", "c3", "c4", "c5"], ["c6", "c7", "c8", "c9", "c10"]],
  physics: [["p1", "p2", "p3", "p4"], ["p5", "p6", "p7", "p8"]],
};

const LENGTHS = [
  { marks: 30, mins: 35, label: "Short paper: 30 marks, 35 minutes" },
  { marks: 70, mins: 75, label: "Combined Science length: 70 marks, 1 hour 15 minutes" },
  { marks: 100, mins: 105, label: "Full separate science paper: 100 marks, 1 hour 45 minutes" },
];

function buildPaper(pool: Question[], targetMarks: number, attempts: ReturnType<typeof useStore>["attempts"]): Question[] {
  const ordered = pickQuestions(pool, pool.length, attempts);
  const out: Question[] = [];
  let marks = 0;
  let sixers = 0;
  for (const q of ordered) {
    if (marks >= targetMarks) break;
    if (q.marks === 6 && sixers >= Math.max(1, Math.round(targetMarks / 35))) continue;
    if (marks + q.marks > targetMarks) continue;
    out.push(q);
    marks += q.marks;
    if (q.marks === 6) sixers++;
  }
  // exam papers start easier and finish harder
  return out.sort((a, b) => a.difficulty - b.difficulty);
}

export default function MockClient() {
  const banks = useBanks(ALL_SCIENCES);
  const s = useStore();
  const [science, setScience] = useState<ScienceId>("biology");
  const [paper, setPaper] = useState<0 | 1>(0);
  const [len, setLen] = useState(0);
  const [qs, setQs] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [self, setSelf] = useState<Record<string, number>>({});
  const [endAt, setEndAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!qs || submitted) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [qs, submitted]);

  const pool = useMemo(() => {
    const b = banks?.find((x) => x.science === science);
    if (!b) return [];
    const topics = PAPER_TOPICS[science][paper];
    return filterForUser(b.questions, s.tier, s.course).filter((q) => topics.includes(q.source!.topicId));
  }, [banks, science, paper, s.tier, s.course]);

  if (!banks) return <p className="text-muted">Loading…</p>;
  const available = banks.map((b) => b.science);

  if (!qs) {
    const poolMarks = pool.reduce((n, q) => n + q.marks, 0);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mock exams</h1>
          <p className="mt-1 text-muted">A timed paper built from the question bank, following the AQA paper split. Answer everything, then mark it at the end.</p>
        </div>
        <div className="space-y-4 rounded-xl border border-line bg-card p-6">
          <div className="flex flex-wrap gap-2">
            {ALL_SCIENCES.map((x) => (
              <button
                key={x}
                disabled={!available.includes(x)}
                onClick={() => setScience(x)}
                className={`theme-${x} rounded-lg border px-4 py-2 text-sm font-semibold capitalize disabled:opacity-40 ${science === x ? "border-accent bg-accent text-white" : "border-line"}`}
              >
                {x}
                {!available.includes(x) && " (soon)"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[0, 1].map((p) => (
              <button key={p} onClick={() => setPaper(p as 0 | 1)} className={`rounded-lg border px-4 py-2 text-sm ${paper === p ? "border-accent bg-accent-soft font-semibold" : "border-line"}`}>
                Paper {p + 1} ({PAPER_TOPICS[science][p].map((t) => t.toUpperCase()).join(", ")})
              </button>
            ))}
          </div>
          <select value={len} onChange={(e) => setLen(+e.target.value)} className="rounded-md border border-line bg-card px-3 py-2 text-sm">
            {LENGTHS.map((l, i) => (
              <option key={i} value={i}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">
            {s.tier === "higher" ? "Higher" : "Foundation"} tier, {s.course === "separate" ? "separate science" : "Combined Science"} content. {pool.length} questions ({poolMarks} marks) available for this paper so far.
          </p>
          <Button
            disabled={poolMarks < LENGTHS[len].marks * 0.5}
            onClick={() => {
              setQs(buildPaper(pool, LENGTHS[len].marks, s.attempts));
              setAnswers({});
              setSelf({});
              setSubmitted(false);
              setEndAt(Date.now() + LENGTHS[len].mins * 60000);
            }}
          >
            Start mock exam
          </Button>
        </div>
      </div>
    );
  }

  const totalMarks = qs.reduce((n, q) => n + q.marks, 0);
  const left = Math.max(0, endAt - now);
  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000);

  function autoScore(q: Question) {
    const a = answers[q.id] ?? "";
    if (q.type === "mcq") return a !== "" && +a === q.answer ? q.marks : 0;
    if (q.type === "numeric") return markNumeric(q, a).correct ? q.marks : 0;
    return self[q.id];
  }
  const needSelf = qs.filter((q) => q.type === "short" || q.type === "extended");
  const allMarked = needSelf.every((q) => self[q.id] !== undefined);
  const score = qs.reduce((n, q) => n + (autoScore(q) ?? 0), 0);

  function finish() {
    for (const q of qs!) recordAttempt(q.id, autoScore(q) ?? 0, q.marks);
    recordSession({ label: `${science[0].toUpperCase() + science.slice(1)} Paper ${paper + 1} mock`, score, max: totalMarks, count: qs!.length });
    setQs(null);
  }

  return (
    <div className={`theme-${science} space-y-5`}>
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <p className="font-semibold capitalize">
          {science} Paper {paper + 1} · {totalMarks} marks
        </p>
        {!submitted ? (
          <>
            <span className={`ml-auto font-mono text-lg ${left < 300000 ? "text-rose-600" : ""}`}>
              {left === 0 ? "Time's up" : `${mm}:${String(ss).padStart(2, "0")}`}
            </span>
            <Button onClick={() => { setSubmitted(true); window.scrollTo({ top: 0 }); }}>Finish and mark</Button>
          </>
        ) : (
          <span className="ml-auto text-sm">
            {allMarked ? (
              <strong>
                Score: {score}/{totalMarks} ({Math.round((score / totalMarks) * 100)}%)
              </strong>
            ) : (
              `Mark your written answers (${needSelf.filter((q) => self[q.id] === undefined).length} left)`
            )}
          </span>
        )}
        {submitted && (
          <Button disabled={!allMarked} onClick={finish}>
            Save result
          </Button>
        )}
      </div>

      {qs.map((q, i) => {
        const a = answers[q.id] ?? "";
        const sc = submitted ? autoScore(q) : undefined;
        return (
          <div key={q.id} className="rounded-xl border border-line bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-xs text-muted">{q.source?.title}</span>
              <span className="ml-auto text-sm font-semibold text-muted">[{q.marks}]</span>
            </div>
            <p className="mb-3">
              <Text>{q.question}</Text>
            </p>
            {q.type === "mcq" ? (
              <div className="grid gap-2">
                {q.options!.map((o, j) => {
                  let cls = a === String(j) ? "border-accent bg-accent-soft" : "border-line";
                  if (submitted && j === q.answer) cls = "border-green-600 bg-green-100 dark:bg-green-500/20";
                  else if (submitted && a === String(j)) cls = "border-rose-500 bg-rose-100 dark:bg-rose-500/20";
                  return (
                    <button key={j} disabled={submitted} onClick={() => setAnswers({ ...answers, [q.id]: String(j) })} className={`rounded-lg border px-3 py-2 text-left text-sm ${cls}`}>
                      <strong className="mr-2">{"ABCD"[j]}</strong>
                      {o}
                    </button>
                  );
                })}
              </div>
            ) : q.type === "numeric" ? (
              <div className="flex items-center gap-2">
                <input disabled={submitted} value={a} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-56 rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
                <span className="text-sm text-muted">{q.unit}</span>
              </div>
            ) : (
              <textarea disabled={submitted} value={a} rows={q.type === "extended" ? 6 : 3} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            )}
            {submitted && (
              <div className="mt-3 space-y-2 rounded-lg bg-bg p-3 text-sm">
                {q.type === "numeric" && <p>Answer: {formatNumber(q.numericAnswer!)} {q.unit}</p>}
                <ul className="list-disc pl-5">
                  {q.markScheme.map((m, k) => (
                    <li key={k}>
                      <Text>{m}</Text>
                    </li>
                  ))}
                </ul>
                {(q.type === "short" || q.type === "extended") ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-semibold">Your mark:</span>
                    {Array.from({ length: q.marks + 1 }, (_, k) => (
                      <button key={k} onClick={() => setSelf({ ...self, [q.id]: k })} className={`h-8 w-8 rounded-md border ${self[q.id] === k ? "border-accent bg-accent text-white" : "border-line bg-card"}`}>
                        {k}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Badge tone={sc === q.marks ? "accent" : "rose"}>
                    {sc}/{q.marks}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      })}
      {!submitted && (
        <div className="flex justify-end">
          <Button onClick={() => { setSubmitted(true); window.scrollTo({ top: 0 }); }}>Finish and mark</Button>
        </div>
      )}
    </div>
  );
}
