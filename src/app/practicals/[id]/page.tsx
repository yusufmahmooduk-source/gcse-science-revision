import { notFound } from "next/navigation";
import { getPractical, getPracticals, SCIENCES } from "@/lib/content";
import { Badge, Crumbs } from "@/components/ui";
import QuizRunner from "@/components/QuizRunner";

export function generateStaticParams() {
  const ps = getPracticals();
  return ps.length ? ps.map((p) => ({ id: p.id })) : [{ id: "none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = getPractical((await params).id);
  return { title: p ? `Required practical: ${p.title}` : "Not found" };
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold">{children}</h2>;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const p = getPractical((await params).id);
  if (!p) notFound();
  const sci = SCIENCES.find((s) => s.id === p.science)!;
  const qs = p.questions.map((q) => ({ ...q, source: { science: p.science, topicId: p.topicId, slug: p.subtopic, title: p.title, higherOnly: false, separateOnly: !p.combined } }));
  const card = "rounded-xl border border-line bg-card p-6";
  return (
    <div className={`theme-${p.science} space-y-5`}>
      <Crumbs items={[{ href: "/", label: "Home" }, { href: "/practicals/", label: "Required practicals" }, { label: p.title }]} />
      <div>
        <p className="text-sm font-semibold text-accent">
          {sci.name} required practical {p.number}
        </p>
        <h1 className="text-3xl font-bold">{p.title}</h1>
        <div className="mt-2 flex gap-1.5">{p.combined ? <Badge>Separate and Combined</Badge> : <Badge tone="amber">Separate {sci.name} only</Badge>}</div>
      </div>
      <div className={`${card} border-l-4 border-l-accent`}>
        <H>Aim</H>
        <p>{p.aim}</p>
        <p className="mt-3 text-sm text-muted">
          <strong>Example hypothesis:</strong> {p.hypothesis}
        </p>
      </div>
      <div className={card}>
        <H>Background</H>
        {p.background.map((b, i) => (
          <p key={i} className="mb-3 leading-relaxed">
            {b}
          </p>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className={card}>
          <H>Variables</H>
          <dl className="space-y-2 text-sm">
            <div><dt className="font-semibold">Independent (what you change)</dt><dd className="text-muted">{p.variables.independent}</dd></div>
            <div><dt className="font-semibold">Dependent (what you measure)</dt><dd className="text-muted">{p.variables.dependent}</dd></div>
            <div><dt className="font-semibold">Control (what you keep the same)</dt><dd><ul className="list-disc pl-5 text-muted">{p.variables.control.map((c, i) => <li key={i}>{c}</li>)}</ul></dd></div>
          </dl>
        </div>
        <div className={card}>
          <H>Equipment</H>
          <ul className="list-disc space-y-1 pl-5 text-sm">{p.equipment.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      </div>
      <figure className={card}>
        <H>{p.diagram.title}</H>
        <div className="diagram mx-auto max-w-xl" dangerouslySetInnerHTML={{ __html: p.diagram.svg }} />
        <figcaption className="mt-2 text-sm text-muted">{p.diagram.caption}</figcaption>
      </figure>
      <div className={card}>
        <H>Method</H>
        <ol className="list-decimal space-y-2 pl-6">{p.method.map((m, i) => <li key={i}>{m}</li>)}</ol>
      </div>
      <div className={card}>
        <H>Risk assessment</H>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left"><th className="py-2 pr-3">Hazard</th><th className="pr-3">Risk</th><th>Precaution</th></tr></thead>
            <tbody>{p.safety.map((s, i) => <tr key={i} className="border-t border-line align-top"><td className="py-2 pr-3">{s.hazard}</td><td className="pr-3">{s.risk}</td><td>{s.precaution}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className={card}>
        <H>Sample results</H>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>{p.results.headers.map((h, i) => <th key={i} className="border-b border-line px-2 py-2 text-left">{h}</th>)}</tr></thead>
            <tbody>{p.results.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-line px-2 py-1.5">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">{p.results.notes}</p>
      </div>
      <div className={card}>
        <H>Analysis and conclusion</H>
        <ul className="list-disc space-y-2 pl-5">{p.analysis.map((a, i) => <li key={i}>{a}</li>)}</ul>
      </div>
      <div className={card}>
        <H>Errors and improvements</H>
        <div className="space-y-2">{p.errors.map((e, i) => <div key={i} className="grid gap-2 text-sm sm:grid-cols-2"><p className="rounded-lg bg-bg p-3">{e.error}</p><p className="rounded-lg bg-accent-soft p-3">{e.improvement}</p></div>)}</div>
      </div>
      <div className={card}>
        <H>Exam tips</H>
        <ul className="space-y-2">{p.examTips.map((t, i) => <li key={i}>💡 {t}</li>)}</ul>
      </div>
      <div>
        <h2 className="mb-3 text-xl font-bold">Practical exam questions</h2>
        <QuizRunner pool={qs} size={10} label={`RP${p.number} ${p.title}`} />
      </div>
    </div>
  );
}
