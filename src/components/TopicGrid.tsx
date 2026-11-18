"use client";
import Link from "@/components/Link";
import type { ScienceId, SpecTopic } from "@/lib/types";
import { useHydrated, useStore } from "@/lib/store";
import { Badge, Bar } from "./ui";

export default function TopicGrid({ science, topics }: { science: ScienceId; topics: SpecTopic[] }) {
  const s = useStore();
  const h = useHydrated();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {topics.map((t) => {
        const subs = t.subtopics.filter((x) => s.course === "separate" || !x.separateOnly);
        const ready = subs.filter((x) => x.available).length;
        const visited = h ? subs.filter((x) => s.visited[`${t.id}-${x.slug}`]).length : 0;
        return (
          <Link key={t.id} href={`/${science}/${t.id}/`} className="rounded-xl border border-line bg-card p-5 transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-accent">
                  {t.code} · {t.specRef}
                </p>
                <h2 className="text-lg font-bold">{t.name}</h2>
              </div>
              {ready < subs.length && <Badge>{ready}/{subs.length} ready</Badge>}
            </div>
            <p className="mt-2 text-sm text-muted">{subs.map((x) => x.title).slice(0, 5).join(" · ")}{subs.length > 5 ? " …" : ""}</p>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted">
              <Bar pct={subs.length ? (visited / subs.length) * 100 : 0} />
              <span className="whitespace-nowrap">{visited}/{subs.length} studied</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
