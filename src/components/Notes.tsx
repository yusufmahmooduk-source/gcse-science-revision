import Link from "@/components/Link";
import type { Notes as N, Subtopic } from "@/lib/types";
import { Badge, Text } from "./ui";

function Section({ id, title, children, tone }: { id: string; title: string; children: React.ReactNode; tone?: "accent" | "amber" | "rose" }) {
  const border = tone === "amber" ? "border-l-amber-400" : tone === "rose" ? "border-l-rose-400" : tone === "accent" ? "border-l-accent" : "border-l-transparent";
  return (
    <section id={id} className={`scroll-mt-24 rounded-xl border border-line border-l-4 ${border} bg-card p-6`}>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export const NOTE_SECTIONS = [
  ["definition", "Definition"],
  ["explanation", "Explanation"],
  ["key-facts", "Key facts"],
  ["key-terms", "Key terms"],
  ["equations", "Equations"],
  ["worked-examples", "Worked examples"],
  ["diagrams", "Diagrams"],
  ["misconceptions", "Common mistakes"],
  ["real-world", "Real-world links"],
  ["practicals", "Required practical"],
  ["higher", "Higher tier"],
  ["separate", "Separate science only"],
  ["exam-tips", "Exam technique"],
  ["summary", "Summary"],
] as const;

export function visibleSections(n: N) {
  return NOTE_SECTIONS.filter(([id]) => {
    if (id === "equations") return n.equations.length > 0;
    if (id === "practicals") return n.practicals.length > 0;
    if (id === "higher") return n.higherTier.length > 0;
    if (id === "separate") return n.separateOnlyContent.length > 0;
    return true;
  });
}

export default function Notes({ sub, practicals }: { sub: Subtopic; practicals: Record<string, { title: string; number: number; ready: boolean }> }) {
  const n = sub.notes;
  return (
    <div className="space-y-5">
      <Section id="definition" title="Definition" tone="accent">
        <p className="text-lg leading-relaxed">{n.definition}</p>
      </Section>

      <Section id="explanation" title="Explanation">
        <div className="prose-notes">
          {n.explanation.map((p, i) => (
            <p key={i}>
              <Text>{p}</Text>
            </p>
          ))}
        </div>
      </Section>

      <Section id="key-facts" title="Key facts">
        <ul className="grid gap-2 sm:grid-cols-2">
          {n.keyFacts.map((f, i) => (
            <li key={i} className="flex gap-2 rounded-lg bg-bg p-3 text-sm">
              <span className="text-accent">●</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="key-terms" title="Key terms">
        <dl className="divide-y divide-line">
          {n.keyTerms.map((k, i) => (
            <div key={i} className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr]">
              <dt className="font-semibold">{k.term}</dt>
              <dd className="text-muted">{k.definition}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {n.equations.length > 0 && (
        <Section id="equations" title="Equations">
          <div className="space-y-3">
            {n.equations.map((e, i) => (
              <div key={i} className="rounded-lg bg-bg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{e.name}</span>
                  {e.recall ? <Badge tone="rose">Learn this</Badge> : <Badge>Given on equation sheet</Badge>}
                </div>
                <p className="mt-2 font-mono text-lg">{e.formula}</p>
                {e.symbols && <p className="mt-1 font-mono text-sm text-muted">{e.symbols}</p>}
                {e.units && <p className="mt-1 text-sm text-muted">Units: {e.units}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section id="worked-examples" title="Worked examples">
        <div className="space-y-4">
          {n.workedExamples.map((w, i) => (
            <details key={i} className="group rounded-lg bg-bg p-4" open={i === 0}>
              <summary className="cursor-pointer font-semibold">
                Example {i + 1}
                {w.title ? `: ${w.title}` : ""}
              </summary>
              <p className="mt-3">
                <Text>{w.question}</Text>
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm">
                {w.steps.map((st, j) => (
                  <li key={j}>
                    <Text>{st}</Text>
                  </li>
                ))}
              </ol>
              <p className="mt-3 rounded-md bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-fg">
                Answer: <Text>{w.answer}</Text>
              </p>
            </details>
          ))}
        </div>
      </Section>

      <Section id="diagrams" title="Diagrams">
        <div className="grid gap-5 md:grid-cols-2">
          {n.diagrams.map((d, i) => (
            <figure key={i} className="rounded-lg bg-bg p-4">
              <figcaption className="mb-2 font-semibold">{d.title}</figcaption>
              <div className="diagram" dangerouslySetInnerHTML={{ __html: d.svg }} />
              <p className="mt-2 text-sm text-muted">{d.caption}</p>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="misconceptions" title="Common mistakes" tone="amber">
        <div className="space-y-3">
          {n.misconceptions.map((m, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <p className="rounded-lg bg-rose-50 p-3 text-sm dark:bg-rose-500/10">
                <span className="font-semibold">✗ </span>
                {m.wrong}
              </p>
              <p className="rounded-lg bg-green-50 p-3 text-sm dark:bg-green-500/10">
                <span className="font-semibold">✓ </span>
                {m.right}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="real-world" title="Real-world links">
        <ul className="list-disc space-y-2 pl-5">
          {n.realWorld.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Section>

      {n.practicals.length > 0 && (
        <Section id="practicals" title="Required practical" tone="accent">
          <ul className="space-y-2">
            {n.practicals.map((p) => {
              const info = practicals[p];
              if (!info) return null;
              return (
                <li key={p}>
                  {info.ready ? (
                    <Link href={`/practicals/${p}/`} className="font-semibold text-accent hover:underline">
                      Required practical {info.number}: {info.title} →
                    </Link>
                  ) : (
                    <span className="font-semibold">
                      Required practical {info.number}: {info.title} <span className="text-sm font-normal text-muted">(full write-up coming soon)</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {n.higherTier.length > 0 && (
        <Section id="higher" title="Higher tier only" tone="rose">
          <ul className="list-disc space-y-2 pl-5">
            {n.higherTier.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </Section>
      )}

      {n.separateOnlyContent.length > 0 && (
        <Section id="separate" title="Separate science only (not in Combined Science)" tone="amber">
          <ul className="list-disc space-y-2 pl-5">
            {n.separateOnlyContent.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="exam-tips" title="Exam technique">
        <ul className="space-y-2">
          {n.examTips.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span>💡</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="summary" title="Summary" tone="accent">
        <ul className="list-disc space-y-1 pl-5">
          {n.summary.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
