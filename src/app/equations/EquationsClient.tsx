"use client";
import Link from "@/components/Link";
import { useMemo, useState } from "react";
import { markNumeric, formatNumber } from "@/lib/marking";
import { Badge, Button } from "@/components/ui";

export interface Var { sym: string; name: string; unit: string; min?: number; max?: number; dp?: number }
export interface Eq {
  id: string; science: string; topicId: string; subtopic: string; name: string; formula: string; recall: boolean;
  form: "product" | "quotient" | "custom"; vars?: Var[]; note?: string;
}

function rnd(v: Var) {
  const x = v.min! + Math.random() * (v.max! - v.min!);
  const p = Math.pow(10, v.dp ?? 0);
  return Math.round(x * p) / p;
}

/** product: a = b × c.  quotient: a = b ÷ c.  Picks one unknown and generates a question. */
function makeProblem(e: Eq) {
  const [a, b, c] = e.vars!;
  let va: number, vb: number, vc: number;
  if (e.form === "product") {
    vb = rnd(b); vc = rnd(c); va = vb * vc;
  } else {
    va = rnd(a); vb = rnd(b); vc = vb / va;
  }
  const vals = [va, vb, vc];
  const unknown = Math.floor(Math.random() * 3);
  const vars = [a, b, c];
  const given = vars.map((v, i) => (i === unknown ? null : `${v.name} = ${formatNumber(vals[i])}${v.unit ? " " + v.unit : ""}`)).filter(Boolean);
  return { prompt: `${given.join(", ")}. Calculate the ${vars[unknown].name}.`, answer: vals[unknown], unit: vars[unknown].unit };
}

function Practice({ e }: { e: Eq }) {
  const [p, setP] = useState(() => makeProblem(e));
  const [input, setInput] = useState("");
  const [res, setRes] = useState<null | boolean>(null);
  return (
    <div className="mt-3 rounded-lg bg-bg p-3 text-sm">
      <p>{p.prompt}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input value={input} onChange={(x) => setInput(x.target.value)} className="w-40 rounded-md border border-line bg-card px-2 py-1" placeholder="Answer" />
        <span className="text-muted">{p.unit}</span>
        <Button className="!px-3 !py-1" onClick={() => setRes(markNumeric({ numericAnswer: p.answer, tolerance: 0.02 } as never, input).correct)}>
          Check
        </Button>
        <Button variant="ghost" className="!px-3 !py-1" onClick={() => { setP(makeProblem(e)); setInput(""); setRes(null); }}>
          New one
        </Button>
        {res !== null && (
          <span className={res ? "font-semibold text-green-600" : "font-semibold text-rose-600"}>
            {res ? "Correct!" : `Not quite: ${formatNumber(p.answer)} ${p.unit}`}
          </span>
        )}
      </div>
    </div>
  );
}

export default function EquationsClient({ equations }: { equations: Eq[] }) {
  const [q, setQ] = useState("");
  const [sci, setSci] = useState("all");
  const [recallOnly, setRecallOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const shown = useMemo(
    () =>
      equations.filter(
        (e) =>
          (sci === "all" || e.science === sci) &&
          (!recallOnly || e.recall) &&
          (!q || `${e.name} ${e.formula} ${e.note ?? ""}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [equations, q, sci, recallOnly],
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Equation bank</h1>
        <p className="mt-1 text-muted">Search every equation. &quot;Learn this&quot; means you must recall it: it won&apos;t be on the equation sheet.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. magnification" className="w-72 rounded-lg border border-line bg-card px-3 py-2 text-sm" />
        <select value={sci} onChange={(e) => setSci(e.target.value)} className="rounded-lg border border-line bg-card px-3 py-2 text-sm">
          <option value="all">All sciences</option>
          <option value="biology">Biology</option>
          <option value="chemistry">Chemistry</option>
          <option value="physics">Physics</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={recallOnly} onChange={(e) => setRecallOnly(e.target.checked)} /> Must-learn only
        </label>
        <span className="text-sm text-muted">{shown.length} equations</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((e) => (
          <div key={e.id} className={`theme-${e.science} rounded-xl border border-line border-l-4 border-l-accent bg-card p-5`}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{e.name}</h2>
              {e.recall ? <Badge tone="rose">Learn this</Badge> : <Badge>On equation sheet / given</Badge>}
            </div>
            <p className="mt-2 font-mono">{e.formula}</p>
            {e.note && <p className="mt-2 text-sm text-muted">{e.note}</p>}
            <div className="mt-3 flex items-center gap-3 text-sm">
              <Link href={`/${e.science}/${e.topicId}/${e.subtopic}/`} className="text-accent hover:underline">
                Revise the topic →
              </Link>
              {e.form !== "custom" && e.vars && (
                <button onClick={() => setOpen(open === e.id ? null : e.id)} className="font-semibold text-accent">
                  {open === e.id ? "Hide practice" : "Practise it"}
                </button>
              )}
            </div>
            {open === e.id && <Practice e={e} />}
          </div>
        ))}
      </div>
    </div>
  );
}
