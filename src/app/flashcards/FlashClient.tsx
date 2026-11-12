"use client";
import { useMemo, useState } from "react";
import { ALL_SCIENCES, useBanks } from "@/lib/useBank";
import { useStore } from "@/lib/store";
import FlashcardDeck from "@/components/FlashcardDeck";

export default function FlashClient() {
  const banks = useBanks(ALL_SCIENCES);
  const s = useStore();
  const [filter, setFilter] = useState("all");
  const cards = useMemo(() => {
    if (!banks) return [];
    return banks
      .flatMap((b) => b.cards.map((c) => ({ ...c, key: `${b.science}:${c.topicId}` })))
      .filter((c) => (s.course === "separate" || !c.separateOnly) && (s.tier === "higher" || !c.higherOnly))
      .filter((c) => filter === "all" || c.key === filter || c.key.startsWith(filter + ":"));
  }, [banks, filter, s.course, s.tier]);
  if (!banks) return <p className="text-muted">Loading flashcards…</p>;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <p className="mt-1 text-muted">Spaced repetition: review the cards that are due each day and they&apos;ll stick for the exam.</p>
      </div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-line bg-card px-3 py-2 text-sm">
        <option value="all">All sciences</option>
        {banks.map((b) => (
          <optgroup key={b.science} label={b.science[0].toUpperCase() + b.science.slice(1)}>
            <option value={b.science}>All {b.science}</option>
            {b.topics
              .filter((t) => t.subtopics.length)
              .map((t) => (
                <option key={t.id} value={`${b.science}:${t.id}`}>
                  {t.code} {t.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <FlashcardDeck key={filter} cards={cards} title={filter === "all" ? "All flashcards" : "Your deck"} dueOnly />
    </div>
  );
}
