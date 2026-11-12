import Link from "next/link";
import { notFound } from "next/navigation";
import { SCIENCES, getSpec, getSubtopic, getTopic, practicalTitles } from "@/lib/content";
import type { ScienceId } from "@/lib/types";
import { Badge, Crumbs } from "@/components/ui";
import Notes, { visibleSections } from "@/components/Notes";
import SubtopicTabs from "@/components/SubtopicTabs";

export function generateStaticParams() {
  return SCIENCES.flatMap((s) =>
    (getSpec(s.id)?.topics ?? []).flatMap((t) =>
      t.subtopics.filter((x) => x.available).map((x) => ({ science: s.id, topic: t.id, subtopic: x.slug })),
    ),
  );
}

type P = { params: Promise<{ science: string; topic: string; subtopic: string }> };

export async function generateMetadata({ params }: P) {
  const { science, topic, subtopic } = await params;
  const sub = getSubtopic(science as ScienceId, topic, subtopic);
  if (!sub) return { title: "Not found" };
  return { title: `${sub.title} (${topic.toUpperCase()})`, description: sub.notes.definition };
}

export default async function SubtopicPage({ params }: P) {
  const { science, topic, subtopic } = await params;
  const meta = SCIENCES.find((x) => x.id === science);
  const t = getTopic(science as ScienceId, topic);
  const sub = getSubtopic(science as ScienceId, topic, subtopic);
  if (!meta || !t || !sub) notFound();
  const idx = t.subtopics.findIndex((x) => x.slug === subtopic);
  const prev = t.subtopics.slice(0, idx).reverse().find((x) => x.available);
  const next = t.subtopics.slice(idx + 1).find((x) => x.available);
  const cards = sub.flashcards.map((c, i) => ({ ...c, id: `${sub.id}-f${i}` }));

  return (
    <div className={`theme-${science}`}>
      <Crumbs
        items={[
          { href: "/", label: "Home" },
          { href: `/${science}/`, label: meta.name },
          { href: `/${science}/${topic}/`, label: `${t.code} ${t.name}` },
          { label: sub.title },
        ]}
      />
      <div className="mb-6">
        <p className="text-sm font-semibold text-accent">
          {t.code} · Spec {sub.specRef}
        </p>
        <h1 className="text-3xl font-bold">{sub.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sub.separateOnly ? <Badge tone="amber">Separate {meta.name} only</Badge> : <Badge>Separate and Combined</Badge>}
          {sub.higherOnly && <Badge tone="rose">Higher tier only</Badge>}
          <Badge>{sub.questions.length} questions</Badge>
          <Badge>{sub.flashcards.length} flashcards</Badge>
        </div>
      </div>
      <SubtopicTabs
        subtopicId={sub.id}
        label={`${t.code} ${sub.title}`}
        questions={sub.questions}
        cards={cards}
        sections={visibleSections(sub.notes).map(([id, title]) => ({ id, title }))}
      >
        <Notes sub={sub} practicals={practicalTitles()} />
      </SubtopicTabs>
      <div className="mt-10 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/${science}/${topic}/${prev.slug}/`} className="rounded-lg border border-line bg-card px-4 py-3 hover:bg-accent-soft">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/${science}/${topic}/${next.slug}/`} className="rounded-lg border border-line bg-card px-4 py-3 hover:bg-accent-soft">
            {next.title} →
          </Link>
        ) : (
          <Link href={`/${science}/${topic}/`} className="rounded-lg border border-line bg-card px-4 py-3 hover:bg-accent-soft">
            Back to {t.code} →
          </Link>
        )}
      </div>
    </div>
  );
}
