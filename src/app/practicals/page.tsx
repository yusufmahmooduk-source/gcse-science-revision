import Link from "next/link";
import { SCIENCES, getSpec, getPracticals } from "@/lib/content";
import { Badge } from "@/components/ui";

export const metadata = { title: "Required practicals" };

export default function Page() {
  const ready = new Set(getPracticals().map((p) => p.id));
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Required practicals</h1>
        <p className="mt-1 max-w-2xl text-muted">
          At least 15% of the marks in your exams come from questions about the required practicals. Each one here has the method, variables, risks, sample results and
          exam questions.
        </p>
      </div>
      {SCIENCES.map((s) => {
        const spec = getSpec(s.id);
        return (
          <section key={s.id} className={`theme-${s.id}`}>
            <h2 className="mb-3 text-xl font-bold text-accent">{s.name}</h2>
            {spec ? (
              <div className="grid gap-3 md:grid-cols-2">
                {spec.practicals.map((p) => {
                  const inner = (
                    <>
                      <p className="text-sm font-semibold text-accent">Required practical {p.number}</p>
                      <p className="font-semibold">{p.title}</p>
                      <div className="mt-2 flex gap-1.5">
                        {p.combined ? <Badge>Separate and Combined</Badge> : <Badge tone="amber">Separate only</Badge>}
                        {!ready.has(p.id) && <Badge>Coming soon</Badge>}
                      </div>
                    </>
                  );
                  return ready.has(p.id) ? (
                    <Link key={p.id} href={`/practicals/${p.id}/`} className="rounded-xl border border-line bg-card p-5 hover:shadow-md">
                      {inner}
                    </Link>
                  ) : (
                    <div key={p.id} className="rounded-xl border border-dashed border-line bg-card p-5 opacity-70">
                      {inner}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted">Coming soon.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
