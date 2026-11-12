import Link from "next/link";
import { notFound } from "next/navigation";
import { SCIENCES, getSpec } from "@/lib/content";
import type { ScienceId } from "@/lib/types";
import { Crumbs } from "@/components/ui";
import TopicGrid from "@/components/TopicGrid";

export function generateStaticParams() {
  return SCIENCES.map((s) => ({ science: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ science: string }> }) {
  const { science } = await params;
  const s = SCIENCES.find((x) => x.id === science);
  return { title: s ? `${s.name} revision` : "Not found" };
}

export default async function SciencePage({ params }: { params: Promise<{ science: string }> }) {
  const { science } = await params;
  const meta = SCIENCES.find((x) => x.id === science);
  if (!meta) notFound();
  const spec = getSpec(science as ScienceId);
  return (
    <div className={`theme-${science} space-y-6`}>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: meta.name }]} />
      <div>
        <div className="mb-3 h-1.5 w-16 rounded-full bg-accent" />
        <h1 className="text-3xl font-bold">AQA GCSE {meta.name}</h1>
        <p className="mt-2 max-w-2xl text-muted">{meta.blurb}</p>
        {spec && (
          <p className="mt-1 text-sm text-muted">
            Specification {spec.specCodes.separate} (separate {meta.name}) and {spec.specCodes.combined} (Combined Science Trilogy).
          </p>
        )}
      </div>
      {spec ? (
        <TopicGrid science={science as ScienceId} topics={spec.topics} />
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">{meta.name} is on its way</h2>
          <p className="mt-2 text-muted">We&apos;re writing and checking every {meta.name.toLowerCase()} topic now. Biology is ready to use today.</p>
          <Link href="/biology/" className="theme-biology mt-4 inline-block rounded-lg bg-accent px-4 py-2 font-semibold text-white">
            Go to Biology
          </Link>
        </div>
      )}
    </div>
  );
}
