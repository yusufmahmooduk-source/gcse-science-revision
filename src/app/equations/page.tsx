import fs from "node:fs";
import path from "node:path";
import { allSubtopics } from "@/lib/content";
import EquationsClient, { type Eq } from "./EquationsClient";

export const metadata = { title: "Equation bank" };

export default function Page() {
  const structured = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/equations.json"), "utf8")) as Eq[];
  const seen = new Set(structured.map((e) => e.name.toLowerCase()));
  const fromNotes: Eq[] = [];
  for (const sub of allSubtopics()) {
    for (const e of sub.notes.equations) {
      const k = e.name.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      fromNotes.push({ id: `${sub.id}-${k.replace(/\W+/g, "-")}`, science: sub.science, topicId: sub.topicId, subtopic: sub.slug, name: e.name, formula: e.formula, recall: e.recall, form: "custom", note: [e.symbols, e.units && `Units: ${e.units}`].filter(Boolean).join(" · ") });
    }
  }
  return <EquationsClient equations={[...structured, ...fromNotes]} />;
}
