import Link from "next/link";
import { getAvailableSciences, getPracticals } from "@/lib/content";
import HomeProgress from "@/components/HomeProgress";

export default function Home() {
  const sciences = getAvailableSciences();
  const totalQ = sciences.reduce((n, s) => n + s.questionCount, 0);
  const practicals = getPracticals().length;
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-line bg-card p-8 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">AQA GCSE Science · Separate and Combined Trilogy</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Revise smarter for your GCSE Science exams.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Clear notes, labelled diagrams, flashcards that space themselves out, and {totalQ.toLocaleString("en-GB")} exam-style questions with full mark schemes,
          all matched to the AQA specification.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/biology/" className="theme-biology rounded-lg bg-accent px-5 py-2.5 font-semibold text-white">
            Start with Biology
          </Link>
          <Link href="/practice/" className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:bg-bg">
            Quick practice
          </Link>
        </div>
      </section>

      <HomeProgress />

      <section className="grid gap-4 md:grid-cols-3">
        {sciences.map((s) => (
          <Link key={s.id} href={`/${s.id}/`} className={`theme-${s.id} group rounded-xl border border-line bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg`}>
            <div className="mb-3 h-1.5 w-12 rounded-full bg-accent" />
            <h2 className="text-xl font-bold group-hover:text-accent">{s.name}</h2>
            <p className="mt-1 text-sm text-muted">{s.blurb}</p>
            <p className="mt-4 text-sm">
              {s.readyCount > 0 ? (
                <>
                  <strong>{s.readyCount}</strong> of {s.subtopicCount} subtopics ready · {s.questionCount.toLocaleString("en-GB")} questions
                </>
              ) : (
                <span className="text-muted">Coming soon</span>
              )}
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { href: "/flashcards/", t: "Flashcards", d: "Spaced repetition decides what you see next." },
          { href: "/practicals/", t: "Required practicals", d: `${practicals} written up with method, risks and exam questions.` },
          { href: "/equations/", t: "Equation bank", d: "Every equation you need, with practice." },
          { href: "/mock/", t: "Mock exams", d: "Timed papers built from the question bank." },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="rounded-xl border border-line bg-card p-5 hover:shadow-md">
            <h3 className="font-semibold">{x.t}</h3>
            <p className="mt-1 text-sm text-muted">{x.d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
