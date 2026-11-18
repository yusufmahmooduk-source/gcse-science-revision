"use client";
import Link from "@/components/Link";
import type { ScienceId, SpecTopic } from "@/lib/types";
import { useHydrated, useStore } from "@/lib/store";
import { Badge } from "./ui";

export default function SubtopicList({ science, topic }: { science: ScienceId; topic: SpecTopic }) {
  const s = useStore();
  const h = useHydrated();
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
      {topic.subtopics.map((st) => {
        const hidden = s.course === "combined" && st.separateOnly;
        const visited = h && s.visited[`${topic.id}-${st.slug}`];
        const inner = (
          <div className={`flex flex-wrap items-center gap-3 px-5 py-4 ${hidden ? "opacity-50" : ""}`}>
            <span className="w-16 shrink-0 font-mono text-xs text-muted">{st.specRef}</span>
            <span className="flex-1 font-medium">{st.title}</span>
            <span className="flex flex-wrap gap-1.5">
              {st.separateOnly && <Badge tone="amber">Separate only</Badge>}
              {st.higherOnly && <Badge tone="rose">Higher only</Badge>}
              {st.available ? <Badge>{st.questionCount} questions</Badge> : <Badge>Coming soon</Badge>}
              {visited && <Badge tone="accent">Studied</Badge>}
            </span>
          </div>
        );
        return (
          <li key={st.slug}>
            {st.available ? (
              <Link href={`/${science}/${topic.id}/${st.slug}/`} className="block hover:bg-accent-soft">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
