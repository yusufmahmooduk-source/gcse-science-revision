"use client";
import Link from "next/link";
import { useRef } from "react";
import { ALL_SCIENCES, useBanks } from "@/lib/useBank";
import { exportProgress, importProgress, masteryFor, resetProgress, useHydrated, useStore } from "@/lib/store";
import { Bar, Button } from "@/components/ui";

export default function ProgressClient() {
  const banks = useBanks(ALL_SCIENCES);
  const s = useStore();
  const h = useHydrated();
  const file = useRef<HTMLInputElement>(null);
  if (!banks || !h) return <p className="text-muted">Loading…</p>;

  const weak: { label: string; href: string; pct: number; attempted: number }[] = [];
  const dueCards = Object.values(s.cards).filter((c) => c.due <= Date.now()).length;

  function download() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gcse-science-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  const sections = banks.map((b) => {
    const topics = b.topics
      .filter((t) => t.subtopics.length)
      .map((t) => {
        const subs = t.subtopics.filter((x) => s.course === "separate" || !x.separateOnly);
        const m = masteryFor(s, subs.flatMap((x) => x.questionIds));
        for (const x of subs) {
          const sm = masteryFor(s, x.questionIds);
          if (sm.attempted >= 3 && sm.pct < 60) weak.push({ label: `${t.code} ${x.title}`, href: `/${b.science}/${t.id}/${x.slug}/`, pct: sm.pct, attempted: sm.attempted });
        }
        return { t, m };
      });
    return { b, topics };
  });
  weak.sort((a, b) => a.pct - b.pct);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your progress</h1>
        <p className="mt-1 text-muted">Saved in this browser on this device. Use the backup button to move it to another device.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Questions answered", Object.keys(s.attempts).length],
          ["Streak", `${s.streak.count} day${s.streak.count === 1 ? "" : "s"}`],
          ["Flashcards due", dueCards],
          ["Bookmarked", s.bookmarks.length],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl border border-line bg-card p-5">
            <p className="text-sm text-muted">{k}</p>
            <p className="text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      {weak.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-card p-6">
          <h2 className="text-lg font-bold">Focus on these next</h2>
          <p className="text-sm text-muted">Subtopics where you&apos;re scoring under 60%.</p>
          <ul className="mt-3 space-y-2">
            {weak.slice(0, 8).map((w) => (
              <li key={w.href} className="flex items-center gap-3">
                <Link href={w.href} className="flex-1 hover:underline">
                  {w.label}
                </Link>
                <span className="text-sm text-muted">
                  {w.pct}% on {w.attempted}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sections.map(({ b, topics }) => (
        <section key={b.science} className={`theme-${b.science} rounded-xl border border-line bg-card p-6`}>
          <h2 className="text-lg font-bold capitalize text-accent">{b.science}</h2>
          <div className="mt-4 space-y-3">
            {topics.map(({ t, m }) => (
              <div key={t.id} className="grid items-center gap-2 sm:grid-cols-[16rem_1fr_9rem]">
                <Link href={`/${b.science}/${t.id}/`} className="font-medium hover:underline">
                  {t.code} {t.name}
                </Link>
                <Bar pct={m.pct} />
                <span className="text-sm text-muted">
                  {m.attempted ? `${m.pct}% · ${m.attempted}/${m.total} tried` : `0/${m.total} tried`}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {s.sessions.length > 0 && (
        <section className="rounded-xl border border-line bg-card p-6">
          <h2 className="text-lg font-bold">Recent sessions</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {[...s.sessions].reverse().slice(0, 15).map((x) => (
                <tr key={x.ts} className="border-t border-line">
                  <td className="py-2 text-muted">{new Date(x.ts).toLocaleDateString("en-GB")}</td>
                  <td>{x.label}</td>
                  <td className="text-right font-semibold">
                    {x.score}/{x.max} ({x.max ? Math.round((x.score / x.max) * 100) : 0}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={download}>
          Download backup
        </Button>
        <Button variant="ghost" onClick={() => file.current?.click()}>
          Restore from backup
        </Button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              importProgress(await f.text());
              alert("Progress restored.");
            } catch (err) {
              alert((err as Error).message);
            }
          }}
        />
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm("Delete all your progress on this device? This can't be undone.")) resetProgress();
          }}
        >
          Reset progress
        </Button>
      </section>
    </div>
  );
}
