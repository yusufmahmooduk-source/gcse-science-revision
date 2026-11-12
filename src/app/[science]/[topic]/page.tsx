import { notFound } from "next/navigation";
import { SCIENCES, getSpec, getTopic } from "@/lib/content";
import type { ScienceId } from "@/lib/types";
import { Crumbs } from "@/components/ui";
import SubtopicList from "@/components/SubtopicList";

export function generateStaticParams() {
  return SCIENCES.flatMap((s) => (getSpec(s.id)?.topics ?? []).map((t) => ({ science: s.id, topic: t.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ science: string; topic: string }> }) {
  const { science, topic } = await params;
  const t = getTopic(science as ScienceId, topic);
  return { title: t ? `${t.code} ${t.name}` : "Not found" };
}

export default async function TopicPage({ params }: { params: Promise<{ science: string; topic: string }> }) {
  const { science, topic } = await params;
  const meta = SCIENCES.find((x) => x.id === science);
  const t = getTopic(science as ScienceId, topic);
  if (!meta || !t) notFound();
  return (
    <div className={`theme-${science} space-y-6`}>
      <Crumbs items={[{ href: "/", label: "Home" }, { href: `/${science}/`, label: meta.name }, { label: `${t.code} ${t.name}` }]} />
      <div>
        <p className="text-sm font-semibold text-accent">
          {t.code} · Specification section {t.specRef}
        </p>
        <h1 className="text-3xl font-bold">{t.name}</h1>
      </div>
      <SubtopicList science={science as ScienceId} topic={t} />
    </div>
  );
}
