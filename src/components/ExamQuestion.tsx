"use client";
import type { Question } from "@/lib/types";

/** Two-digit question number in separate boxes, like "0 1" on an AQA paper. */
export function QNum({ n }: { n: number }) {
  const s = String(n).padStart(2, "0");
  return (
    <span className="inline-flex shrink-0 gap-0.5" aria-label={`Question ${n}`}>
      {s.split("").map((d, i) => (
        <span key={i} className="exam-box">
          {d}
        </span>
      ))}
    </span>
  );
}

export function marksLabel(m: number) {
  return `[${m} mark${m === 1 ? "" : "s"}]`;
}

/** Number of dotted lines to give for a written answer, roughly as AQA does. */
function linesFor(q: Question) {
  if (q.type === "extended") return q.marks >= 6 ? 12 : 8;
  if (q.type === "numeric") return Math.max(3, q.marks + 2);
  return Math.max(2, q.marks * 2);
}

export function Figure({ svg, caption }: { svg: string; caption?: string }) {
  return (
    <figure className="my-4">
      <p className="mb-2 text-center font-bold">Figure 1</p>
      <div className="diagram exam-figure mx-auto max-w-xl" dangerouslySetInnerHTML={{ __html: svg }} />
      {caption && <figcaption className="mt-1 text-center text-sm">{caption}</figcaption>}
    </figure>
  );
}

export function DataTable({ t }: { t: NonNullable<Question["table"]> }) {
  return (
    <div className="my-4">
      <p className="mb-2 text-center font-bold">Table 1</p>
      {t.caption && <p className="mb-1 text-center text-sm">{t.caption}</p>}
      <div className="overflow-x-auto">
        <table className="exam-table mx-auto">
          <thead>
            <tr>
              {t.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Renders one question in AQA exam-paper style.
 * value: the student's answer (MCQ: option index as a string).
 * reveal: after marking, colour the correct / chosen boxes.
 */
export default function ExamQuestion({
  q,
  number,
  value,
  onChange,
  locked,
  reveal,
  onEnter,
  context,
}: {
  q: Question;
  number: number;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  reveal: boolean;
  onEnter?: () => void;
  context?: string;
}) {
  const lines = linesFor(q);
  return (
    <div className="exam">
      <div className="flex items-start gap-3">
        <QNum n={number} />
        <div className="min-w-0 flex-1">
          {context && <p className="mb-1 text-xs text-muted">{context}</p>}
          <p className="whitespace-pre-line leading-relaxed">{q.question}</p>
          {q.figure && <Figure svg={q.figure.svg} caption={q.figure.caption} />}
          {q.table && <DataTable t={q.table} />}

          {q.type === "mcq" && (
            <>
              <p className="mt-4 font-bold">Tick (✓) one box.</p>
              <div className="mt-2 space-y-2">
                {q.options!.map((o, i) => {
                  const chosen = value === String(i);
                  const right = reveal && i === q.answer;
                  const wrong = reveal && chosen && i !== q.answer;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={locked}
                      onClick={() => onChange(String(i))}
                      className={`flex w-full items-center gap-3 rounded-md px-1 py-1 text-left ${locked ? "" : "hover:bg-accent-soft"}`}
                    >
                      <span
                        className={`tick-box ${chosen ? "tick-box-on" : ""} ${right ? "tick-box-right" : ""} ${wrong ? "tick-box-wrong" : ""}`}
                        aria-hidden
                      >
                        {chosen ? "✓" : right ? "✓" : ""}
                      </span>
                      <span className={right ? "font-semibold text-green-700 dark:text-green-400" : wrong ? "text-rose-600 line-through" : ""}>{o}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-right font-bold">{marksLabel(q.marks)}</p>
            </>
          )}

          {q.type !== "mcq" && <p className="mt-2 text-right font-bold">{marksLabel(q.marks)}</p>}

          {q.type === "numeric" && (
            <>
              <textarea
                aria-label="Working"
                disabled={locked}
                rows={lines}
                placeholder="Show your working (optional)"
                className="lined mt-1"
              />
              <div className="mt-3 flex flex-wrap items-baseline justify-end gap-2">
                <span>{q.answerLabel ?? "Answer"} =</span>
                <input
                  aria-label="Final answer"
                  value={value}
                  disabled={locked}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && value.trim() && onEnter?.()}
                  className="answer-line w-44"
                />
                <span className="min-w-6">{q.unit}</span>
              </div>
            </>
          )}

          {(q.type === "short" || q.type === "extended") && (
            <textarea
              aria-label="Your answer"
              value={value}
              disabled={locked}
              onChange={(e) => onChange(e.target.value)}
              rows={lines}
              className="lined mt-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}
