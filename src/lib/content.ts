import fs from "node:fs";
import path from "node:path";
import type { Practical, Question, ScienceId, Spec, SpecTopic, Subtopic } from "./types";

const ROOT = path.join(process.cwd(), "content");

export const SCIENCES: { id: ScienceId; name: string; blurb: string }[] = [
  { id: "biology", name: "Biology", blurb: "Cells, organisation, infection, bioenergetics, homeostasis, inheritance and ecology." },
  { id: "chemistry", name: "Chemistry", blurb: "Atomic structure, bonding, quantitative chemistry, reactions, rates, organic and the atmosphere." },
  { id: "physics", name: "Physics", blurb: "Energy, electricity, particles, atoms, forces, waves, magnetism and space." },
];

const specCache = new Map<ScienceId, Spec | null>();

export function getSpec(science: ScienceId): Spec | null {
  if (specCache.has(science)) return specCache.get(science)!;
  const file = path.join(ROOT, "spec", `${science}.json`);
  if (!fs.existsSync(file)) {
    specCache.set(science, null);
    return null;
  }
  const spec = JSON.parse(fs.readFileSync(file, "utf8")) as Spec;
  for (const t of spec.topics) {
    for (const s of t.subtopics) {
      const sub = readSubtopic(science, t.id, s.slug);
      s.available = !!sub;
      s.questionCount = sub?.questions.length ?? 0;
    }
  }
  specCache.set(science, spec);
  return spec;
}

function readSubtopic(science: ScienceId, topicId: string, slug: string): Subtopic | null {
  const file = path.join(ROOT, science, topicId, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as Subtopic;
}

export function getTopic(science: ScienceId, topicId: string): SpecTopic | null {
  return getSpec(science)?.topics.find((t) => t.id === topicId) ?? null;
}

export function getSubtopic(science: ScienceId, topicId: string, slug: string): Subtopic | null {
  const sub = readSubtopic(science, topicId, slug);
  if (!sub) return null;
  sub.questions = sub.questions.map((q) => withSource(q, sub));
  return sub;
}

function withSource(q: Question, sub: Subtopic): Question {
  return {
    ...q,
    source: { science: sub.science, topicId: sub.topicId, slug: sub.slug, title: sub.title, higherOnly: sub.higherOnly, separateOnly: sub.separateOnly },
  };
}

export function getAvailableSciences() {
  return SCIENCES.map((s) => {
    const spec = getSpec(s.id);
    const subs = spec?.topics.flatMap((t) => t.subtopics) ?? [];
    return {
      ...s,
      topicCount: spec?.topics.length ?? 0,
      subtopicCount: subs.length,
      readyCount: subs.filter((x) => x.available).length,
      questionCount: subs.reduce((n, x) => n + (x.questionCount ?? 0), 0),
    };
  });
}

export function allSubtopics(science?: ScienceId): Subtopic[] {
  const out: Subtopic[] = [];
  for (const s of SCIENCES) {
    if (science && s.id !== science) continue;
    const spec = getSpec(s.id);
    if (!spec) continue;
    for (const t of spec.topics) for (const st of t.subtopics) {
      const sub = getSubtopic(s.id, t.id, st.slug);
      if (sub) out.push(sub);
    }
  }
  return out;
}

export function getPracticals(): Practical[] {
  const dir = path.join(ROOT, "practicals");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Practical)
    .sort((a, b) => a.science.localeCompare(b.science) || a.number - b.number);
}

export function getPractical(id: string): Practical | null {
  return getPracticals().find((p) => p.id === id) ?? null;
}

export function practicalTitles(): Record<string, { title: string; number: number; science: ScienceId; ready: boolean }> {
  const ready = new Set(getPracticals().map((p) => p.id));
  const out: Record<string, { title: string; number: number; science: ScienceId; ready: boolean }> = {};
  for (const s of SCIENCES) {
    for (const p of getSpec(s.id)?.practicals ?? []) out[p.id] = { title: p.title, number: p.number, science: s.id, ready: ready.has(p.id) };
  }
  return out;
}
