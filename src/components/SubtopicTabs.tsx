"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Question } from "@/lib/types";
import { markVisited, useHydrated, useStore, masteryFor, latest } from "@/lib/store";
import FlashcardDeck, { type DeckCard } from "./FlashcardDeck";
import QuizRunner, { filterForUser } from "./QuizRunner";
import QuestionCard from "./QuestionCard";
import { Bar } from "./ui";

const TABS = ["Notes", "Flashcards", "Quiz", "Question bank"] as const;
type Tab = (typeof TABS)[number];

export default function SubtopicTabs({
  subtopicId,
  label,
  questions,
  cards,
  sections,
  children,
}: {
  subtopicId: string;
  label: string;
  questions: Question[];
  cards: DeckCard[];
  sections: { id: string; title: string }[];
  children: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("Notes");
  const s = useStore();
  const h = useHydrated();
  useEffect(() => {
    markVisited(subtopicId);
    const hash = window.location.hash.slice(1);
    if (hash === "quiz") setTab("Quiz");
    if (hash === "flashcards") setTab("Flashcards");
    if (hash === "questions") setTab("Question bank");
  }, [subtopicId]);
  const m = masteryFor(s, questions.map((q) => q.id));

  return (
    <div>
      <div className="no-print sticky top-[57px] z-20 -mx-4 mb-6 border-b border-line bg-bg/95 px-4 backdrop-blur">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"}`}
            >
              {t}
            </button>
          ))}
          {h && m.attempted > 0 && (
            <div className="ml-auto hidden w-48 items-center gap-2 text-xs text-muted sm:flex">
              <Bar pct={m.pct} />
              <span className="whitespace-nowrap">{m.pct}% on {m.attempted}</span>
            </div>
          )}
        </div>
      </div>

      <div className={tab === "Notes" ? "grid gap-6 lg:grid-cols-[1fr_14rem]" : "hidden"}>
        <div>{children}</div>
        <aside className="no-print hidden lg:block">
          <div className="sticky top-32 space-y-1 text-sm">
            <p className="mb-2 font-semibold">On this page</p>
            {sections.map((x) => (
              <a key={x.id} href={`#${x.id}`} className="block rounded px-2 py-1 text-muted hover:bg-accent-soft hover:text-fg">
                {x.title}
              </a>
            ))}
            <button onClick={() => setTab("Quiz")} className="mt-4 w-full rounded-lg bg-accent px-3 py-2 font-semibold text-white">
              Test yourself →
            </button>
          </div>
        </aside>
      </div>
      {tab === "Flashcards" && <FlashcardDeck cards={cards} title={`${label} flashcards`} />}
      {tab === "Quiz" && <QuizRunner pool={questions} size={10} label={`${label} quiz`} />}
      {tab === "Question bank" && <Bank questions={questions} />}
    </div>
  );
}

function Bank({ questions }: { questions: Question[] }) {
  const s = useStore();
  const [type, setType] = useState("all");
  const [diff, setDiff] = useState("all");
  const [status, setStatus] = useState("all");
  const shown = useMemo(
    () =>
      filterForUser(questions, s.tier, s.course).filter((q) => {
        if (type !== "all" && q.type !== type) return false;
        if (diff !== "all" && String(q.difficulty) !== diff) return false;
        const l = latest(s, q.id);
        if (status === "new" && l) return false;
        if (status === "wrong" && (!l || l.score === l.max)) return false;
        if (status === "bookmarked" && !s.bookmarks.includes(q.id)) return false;
        return true;
      }),
    [questions, type, diff, status, s],
  );
  const sel = "rounded-md border border-line bg-card px-2 py-1.5 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className={sel}>
          <option value="all">All types</option>
          <option value="mcq">Multiple choice</option>
          <option value="numeric">Calculations</option>
          <option value="short">Short answer</option>
          <option value="extended">Extended answer</option>
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value)} className={sel}>
          <option value="all">All grades</option>
          <option value="1">Grade 1 to 3</option>
          <option value="2">Grade 4 to 6</option>
          <option value="3">Grade 7 to 9</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
          <option value="all">All questions</option>
          <option value="new">Not tried yet</option>
          <option value="wrong">Got wrong last time</option>
          <option value="bookmarked">Bookmarked</option>
        </select>
        <span className="text-sm text-muted">{shown.length} shown</span>
      </div>
      {s.tier === "foundation" && <p className="text-xs text-muted">Showing Foundation questions. Switch to Higher at the top to see all of them.</p>}
      {shown.map((q, i) => (
        <QuestionCard key={q.id} q={q} index={i} />
      ))}
    </div>
  );
}
