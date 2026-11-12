"use client";
import Link from "next/link";
import { useHydrated, useStore } from "@/lib/store";

export default function HomeProgress() {
  const s = useStore();
  const h = useHydrated();
  if (!h) return null;
  const attempted = Object.keys(s.attempts).length;
  if (!attempted) return null;
  const due = Object.values(s.cards).filter((c) => c.due <= Date.now()).length;
  const last = s.sessions[s.sessions.length - 1];
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-line bg-card p-5">
        <p className="text-sm text-muted">Questions answered</p>
        <p className="text-3xl font-bold">{attempted}</p>
      </div>
      <div className="rounded-xl border border-line bg-card p-5">
        <p className="text-sm text-muted">Revision streak</p>
        <p className="text-3xl font-bold">{s.streak.count} day{s.streak.count === 1 ? "" : "s"}</p>
      </div>
      <Link href="/flashcards/" className="rounded-xl border border-line bg-card p-5 hover:shadow-md">
        <p className="text-sm text-muted">Flashcards due</p>
        <p className="text-3xl font-bold">{due}</p>
        {last && <p className="mt-1 text-xs text-muted">Last session: {last.label}, {last.score}/{last.max}</p>}
      </Link>
    </section>
  );
}
