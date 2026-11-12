"use client";
import { useEffect, useMemo, useState } from "react";
import { reviewCard, useHydrated, useStore } from "@/lib/store";
import { Bar, Button, Text } from "./ui";

export interface DeckCard {
  id: string;
  front: string;
  back: string;
  label?: string;
}

const BOX_LABEL = ["", "New / learning", "1 day", "3 days", "1 week", "2 weeks"];

export default function FlashcardDeck({ cards, title, dueOnly = false }: { cards: DeckCard[]; title?: string; dueOnly?: boolean }) {
  const s = useStore();
  const h = useHydrated();
  const [mode, setMode] = useState<"due" | "all">(dueOnly ? "due" : "all");
  const [queue, setQueue] = useState<DeckCard[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [started, setStarted] = useState(false);

  const now = Date.now();
  const dueCards = useMemo(() => cards.filter((c) => (s.cards[c.id]?.due ?? 0) <= now), [cards, s.cards, now]);

  function begin(m: "due" | "all") {
    setMode(m);
    const base = m === "due" ? dueCards : cards;
    // unseen and low-box cards first
    const sorted = [...base].sort((a, b) => (s.cards[a.id]?.box ?? 0) - (s.cards[b.id]?.box ?? 0) || Math.random() - 0.5);
    setQueue(sorted);
    setDone(0);
    setFlipped(false);
    setStarted(true);
  }

  useEffect(() => {
    setStarted(false);
  }, [cards]);

  if (!h) return null;

  if (!started) {
    const boxes = [1, 2, 3, 4, 5].map((b) => cards.filter((c) => (s.cards[c.id]?.box ?? 0) === b).length);
    const unseen = cards.filter((c) => !s.cards[c.id]).length;
    return (
      <div className="rounded-xl border border-line bg-card p-6">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        <p className="mt-1 text-sm text-muted">
          {cards.length} cards · {dueCards.length} due now · {unseen} not seen yet
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
          {boxes.map((n, i) => (
            <div key={i} className="rounded-lg bg-bg p-2">
              <p className="text-lg font-bold">{n}</p>
              <p className="text-muted">{BOX_LABEL[i + 1]}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => begin("due")} disabled={!dueCards.length}>
            Review {dueCards.length} due
          </Button>
          <Button variant="ghost" onClick={() => begin("all")}>
            Study all {cards.length}
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted">
          Cards you know move up a box and come back less often (1 day, 3 days, 1 week, 2 weeks, 1 month). Cards you miss go back to box 1.
        </p>
      </div>
    );
  }

  const card = queue[0];
  if (!card) {
    return (
      <div className="rounded-xl border border-line bg-card p-8 text-center">
        <p className="text-4xl">🎉</p>
        <p className="mt-2 font-semibold">Deck finished: {done} cards reviewed.</p>
        <Button className="mt-4" variant="ghost" onClick={() => setStarted(false)}>
          Back to deck
        </Button>
      </div>
    );
  }

  function answer(knew: boolean) {
    reviewCard(card.id, knew);
    setFlipped(false);
    setDone((d) => d + 1);
    setQueue((q) => (knew ? q.slice(1) : [...q.slice(1), card]));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="whitespace-nowrap">{queue.length} left</span>
        <Bar pct={(done / (done + queue.length)) * 100} />
        <span className="whitespace-nowrap">{mode === "due" ? "Due cards" : "All cards"}</span>
      </div>
      <button onClick={() => setFlipped(!flipped)} className="flip block h-64 w-full text-left" aria-label="Flip card">
        <div className={`flip-inner h-full ${flipped ? "flipped" : ""}`}>
          <div className="flip-face flex flex-col items-center justify-center rounded-2xl border border-line bg-card p-8 text-center shadow-sm">
            {card.label && <p className="mb-2 text-xs text-muted">{card.label}</p>}
            <p className="text-xl font-semibold">
              <Text>{card.front}</Text>
            </p>
            <p className="mt-4 text-xs text-muted">Tap to flip</p>
          </div>
          <div className="flip-face flip-back flex items-center justify-center rounded-2xl border border-accent bg-accent-soft p-8 text-center">
            <p className="text-lg">
              <Text>{card.back}</Text>
            </p>
          </div>
        </div>
      </button>
      <div className="flex justify-center gap-3">
        {flipped ? (
          <>
            <Button variant="ghost" onClick={() => answer(false)}>
              ✗ Still learning
            </Button>
            <Button onClick={() => answer(true)}>✓ I knew it</Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setFlipped(true)}>
            Show answer
          </Button>
        )}
      </div>
    </div>
  );
}
