"use client";
import { useState } from "react";
import type { Question } from "@/lib/types";
import { markNumeric, suggestShort, formatNumber } from "@/lib/marking";
import { recordAttempt, toggleBookmark, useStore, latest } from "@/lib/store";
import { Badge, Button, Text } from "./ui";

const DIFF = { 1: "Grade 1 to 3", 2: "Grade 4 to 6", 3: "Grade 7 to 9" } as const;
const TYPE = { mcq: "Multiple choice", numeric: "Calculation", short: "Short answer", extended: "Extended answer" } as const;

export interface Result {
  score: number;
  max: number;
}

export default function QuestionCard({
  q,
  index,
  onDone,
  showMeta = true,
}: {
  q: Question;
  index?: number;
  onDone?: (r: Result) => void;
  showMeta?: boolean;
}) {
  const s = useStore();
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [autoScore, setAutoScore] = useState<number | null>(null);
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [showScheme, setShowScheme] = useState(false);
  const bookmarked = s.bookmarks.includes(q.id);
  const prev = latest(s, q.id);
  const auto = q.type === "mcq" || q.type === "numeric";

  function check() {
    if (q.type === "mcq") {
      const sc = choice === q.answer ? q.marks : 0;
      setAutoScore(sc);
      recordAttempt(q.id, sc, q.marks);
      onDone?.({ score: sc, max: q.marks });
    } else if (q.type === "numeric") {
      const { correct } = markNumeric(q, text);
      const sc = correct ? q.marks : 0;
      setAutoScore(sc);
      recordAttempt(q.id, sc, q.marks);
      onDone?.({ score: sc, max: q.marks });
    } else {
      setShowScheme(true);
      const sug = q.type === "short" ? suggestShort(q, text).suggested : null;
      setSelfScore(sug);
    }
    setChecked(true);
  }

  function confirmSelf(score: number) {
    setSelfScore(score);
    setAutoScore(score);
    recordAttempt(q.id, score, q.marks);
    onDone?.({ score, max: q.marks });
  }

  function reset() {
    setChoice(null);
    setText("");
    setChecked(false);
    setAutoScore(null);
    setSelfScore(null);
    setShowScheme(false);
  }

  const done = autoScore !== null;
  const right = done && autoScore === q.marks;
  const hits = q.type === "short" && checked ? suggestShort(q, text).hits : [];

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      {showMeta && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {index !== undefined && <span className="mr-1 text-sm font-bold text-accent">Q{index + 1}</span>}
          <Badge>{TYPE[q.type]}</Badge>
          <Badge>{DIFF[q.difficulty]}</Badge>
          {q.tier === "higher" && <Badge tone="rose">Higher</Badge>}
          {prev && <Badge tone={prev.score === prev.max ? "accent" : "amber"}>Last: {prev.score}/{prev.max}</Badge>}
          <span className="ml-auto text-sm font-semibold text-muted">
            [{q.marks} mark{q.marks > 1 ? "s" : ""}]
          </span>
          <button
            onClick={() => toggleBookmark(q.id)}
            title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
            className={`ml-1 text-lg ${bookmarked ? "text-amber-500" : "text-muted"}`}
          >
            {bookmarked ? "★" : "☆"}
          </button>
        </div>
      )}
      <p className="mb-4 leading-relaxed">
        <Text>{q.question}</Text>
      </p>

      {q.type === "mcq" && (
        <div className="grid gap-2">
          {q.options!.map((o, i) => {
            let cls = "border-line hover:bg-accent-soft";
            if (choice === i) cls = "border-accent bg-accent-soft";
            if (checked && i === q.answer) cls = "border-green-600 bg-green-100 dark:bg-green-500/20";
            else if (checked && choice === i) cls = "border-rose-500 bg-rose-100 dark:bg-rose-500/20";
            return (
              <button key={i} disabled={checked} onClick={() => setChoice(i)} className={`rounded-lg border px-4 py-2.5 text-left text-sm ${cls}`}>
                <span className="mr-2 font-semibold">{"ABCD"[i]}</span>
                {o}
              </button>
            );
          })}
        </div>
      )}

      {q.type === "numeric" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={text}
            disabled={checked}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && text.trim() && !checked && check()}
            placeholder="Your answer, e.g. 2.5 or 3 × 10^-4"
            className="w-64 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          {q.unit && <span className="text-sm text-muted">{q.unit}</span>}
        </div>
      )}

      {(q.type === "short" || q.type === "extended") && (
        <textarea
          value={text}
          disabled={checked}
          onChange={(e) => setText(e.target.value)}
          rows={q.type === "extended" ? 7 : 3}
          placeholder={q.type === "extended" ? "Plan your answer, then write it in full sentences…" : "Write your answer…"}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm"
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!checked && (
          <Button onClick={check} disabled={q.type === "mcq" ? choice === null : !text.trim() && auto}>
            {auto ? "Check answer" : "Show mark scheme"}
          </Button>
        )}
        {checked && (
          <Button variant="ghost" onClick={reset}>
            Try again
          </Button>
        )}
        {checked && auto && !showScheme && (
          <Button variant="ghost" onClick={() => setShowScheme(true)}>
            Mark scheme
          </Button>
        )}
        {done && (
          <span className={`text-sm font-semibold ${right ? "text-green-600" : "text-rose-600"}`}>
            {right ? "Correct!" : autoScore! > 0 ? `${autoScore}/${q.marks}, partly there` : "Not quite"}
            {q.type === "numeric" && !right && q.numericAnswer !== undefined && ` (answer: ${formatNumber(q.numericAnswer)}${q.unit ? " " + q.unit : ""})`}
          </span>
        )}
      </div>

      {checked && !auto && !done && (
        <div className="mt-4 rounded-lg border border-accent bg-accent-soft p-4 text-sm">
          <p className="mb-2 font-semibold">Mark your answer against the mark scheme below. How many marks did you get?</p>
          {q.type === "short" && hits.length > 0 && (
            <p className="mb-2 text-muted">We spotted these key points in your answer: {hits.join(", ")}.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.marks + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => confirmSelf(i)}
                className={`h-9 w-9 rounded-lg border font-semibold ${selfScore === i ? "border-accent bg-accent text-white" : "border-line bg-card"}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {showScheme && (
        <div className="mt-4 space-y-3 rounded-lg bg-bg p-4 text-sm">
          <div>
            <p className="font-semibold">Mark scheme</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {q.markScheme.map((m, i) => (
                <li key={i}>
                  <Text>{m}</Text>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Explanation</p>
            <p className="mt-1 text-muted">
              <Text>{q.explanation}</Text>
            </p>
          </div>
        </div>
      )}
      {checked && auto && !showScheme && (
        <p className="mt-3 text-sm text-muted">
          <Text>{q.explanation}</Text>
        </p>
      )}
    </div>
  );
}
