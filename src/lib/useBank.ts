"use client";
import { useEffect, useState } from "react";
import type { Question, ScienceId } from "./types";
import type { DeckCard } from "@/components/FlashcardDeck";

export interface BankTopic {
  id: string;
  code: string;
  name: string;
  subtopics: { slug: string; title: string; separateOnly: boolean; higherOnly: boolean; questionIds: string[] }[];
}
export interface Bank {
  science: ScienceId;
  topics: BankTopic[];
  questions: Question[];
  cards: (DeckCard & { topicId: string; separateOnly: boolean; higherOnly: boolean })[];
}

const cache = new Map<string, Promise<Bank | null>>();

function fetchBank(science: ScienceId): Promise<Bank | null> {
  if (!cache.has(science)) {
    cache.set(
      science,
      fetch(`/data/${science}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  }
  return cache.get(science)!;
}

export function useBanks(sciences: ScienceId[]) {
  const [banks, setBanks] = useState<Bank[] | null>(null);
  const key = sciences.join(",");
  useEffect(() => {
    let live = true;
    fetch("/data/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((idx: { science: string }[]) => {
        const have = new Set(idx.map((x) => x.science));
        return Promise.all(key.split(",").filter((s) => have.has(s)).map((s) => fetchBank(s as ScienceId)));
      })
      .then((b) => {
      if (live) setBanks(b.filter((x): x is Bank => !!x));
    });
    return () => {
      live = false;
    };
  }, [key]);
  return banks;
}

export const ALL_SCIENCES: ScienceId[] = ["biology", "chemistry", "physics"];
