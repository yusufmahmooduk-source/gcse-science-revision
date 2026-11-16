"use client";
import { useState } from "react";
import type { Question } from "@/lib/types";
import { markNumeric, suggestShort, formatNumber } from "@/lib/marking";
import { recordAttempt, toggleBookmark, useStore, latest } from "@/lib/store";
import ExamQuestion from "./ExamQuestion";
import { Badge, Button, Text } from "./ui";

const DIFF = { 1: "Grade 1 to 3", 2: "Grade 4 to 6", 3: "Grade 7 to 9" } as const;

export interface Result {
  score: number;
  max: number;
}

export function MarkScheme({ q }: { q: Question }) {
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-line bg-bg p-4 text-sm">
      {q.type === "numeric" && q.numericAnswer !== undefined && (
        <p>
          <span className="font-semibold">Answer: </span>
          {q.answerLabel ? `${q.answerLabel} = ` : ""}
          {formatNumber(q.numericAnswer)} {q.unit}
        </p>
      )}
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
  );
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
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showScheme, setShowScheme] = useState(false);
  const bookmarked = s.bookmarks.includes(q.id);
  const prev = latest(s, q.id);
  const auto = q.type === "mcq" || q.type === "numeric";

  function check() {
    if (auto) {
      const ok = q.type === "mcq" ? value === String(q.answer) : markNumeric(q, value).correct;
      const sc = ok ? q.marks : 0;
      setScore(sc);
      recordAttempt(q.id, sc, q.marks);
      onDone?.({ score: sc, max: q.marks });
    }
    setShowScheme(!auto);
    setChecked(true);
  }

  function confirmSelf(sc: number) {
    setScore(sc);
    recordAttempt(q.id, sc, q.marks);
    onDone?.({ score: sc, max: q.marks });
  }

  function reset() {
    setValue("");
    setChecked(false);
    setScore(null);
    setShowScheme(false);
  }

  const done = score !== null;
  const right = done && score === q.marks;
  const hits = q.type === "short" && checked ? suggestShort(q, value).hits : [];
  const suggested = q.type === "short" && checked ? suggestShort(q, value).suggested : null;

  return (
    <div className="paper p-5 sm:p-6">
      {showMeta && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
          <Badge>{DIFF[q.difficulty]}</Badge>
          {q.tier === "higher" && <Badge tone="rose">Higher</Badge>}
          {q.source && <span className="text-xs text-muted">{q.source.title}</span>}
          {prev && <Badge tone={prev.score === prev.max ? "accent" : "amber"}>Last time: {prev.score}/{prev.max}</Badge>}
          <button
            onClick={() => toggleBookmark(q.id)}
            title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
            className={`ml-auto text-lg ${bookmarked ? "text-amber-500" : "text-muted"}`}
          >
            {bookmarked ? "★" : "☆"}
          </button>
        </div>
      )}

      <ExamQuestion
        q={q}
        number={(index ?? 0) + 1}
        value={value}
        onChange={setValue}
        locked={checked}
        reveal={checked && q.type === "mcq"}
        onEnter={() => !checked && check()}
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {!checked && (
          <Button onClick={check} disabled={q.type === "mcq" ? value === "" : q.type === "numeric" ? !value.trim() : false}>
            {auto ? "Check answer" : "Mark my answer"}
          </Button>
        )}
        {checked && (
          <Button variant="ghost" onClick={reset}>
            Try again
          </Button>
        )}
        {checked && auto && !showScheme && (
          <Button variant="ghost" onClick={() => setShowScheme(true)}>
            Show mark scheme
          </Button>
        )}
        {done && (
          <span className={`text-sm font-semibold ${right ? "text-green-600" : "text-rose-600"}`}>
            {right ? `Correct! ${q.marks}/${q.marks}` : score! > 0 ? `${score}/${q.marks}, partly there` : `0/${q.marks}, not quite`}
            {q.type === "numeric" && !right && q.numericAnswer !== undefined && ` (answer: ${formatNumber(q.numericAnswer)}${q.unit ? " " + q.unit : ""})`}
          </span>
        )}
      </div>

      {checked && !auto && !done && (
        <div className="mt-4 rounded-lg border border-accent bg-accent-soft p-4 text-sm">
          <p className="mb-2 font-semibold">Mark your answer against the mark scheme below, like an examiner. How many marks did you get?</p>
          {hits.length > 0 && <p className="mb-2 text-muted">We spotted these key points in your answer: {hits.join(", ")}.</p>}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.marks + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => confirmSelf(i)}
                className={`h-9 w-9 rounded-lg border font-semibold ${suggested === i ? "border-accent" : "border-line"} bg-card`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {showScheme && <MarkScheme q={q} />}
      {checked && auto && !showScheme && (
        <p className="mt-3 text-sm text-muted">
          <Text>{q.explanation}</Text>
        </p>
      )}
    </div>
  );
}
