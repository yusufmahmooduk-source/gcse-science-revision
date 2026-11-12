#!/usr/bin/env node
// Validates subtopic content files against content/AUTHORING.md rules.
// Usage: node scripts/validate.mjs [file-or-dir ...]   (default: content/)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const specs = {};
for (const f of fs.readdirSync(path.join(root, "content/spec"))) {
  const s = JSON.parse(fs.readFileSync(path.join(root, "content/spec", f), "utf8"));
  specs[s.science] = s;
}

function walk(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) return fs.readdirSync(p).flatMap((x) => (x === "spec" ? [] : walk(path.join(p, x))));
  return p.endsWith(".json") ? [p] : [];
}

const args = process.argv.slice(2);
const files = (args.length ? args : [path.join(root, "content")]).flatMap((a) => walk(path.resolve(a)));
const PLACEHOLDER = /\b(TODO|TBD|lorem|ipsum|FIXME)\b|\[insert|xxx/i;

let totalErrors = 0;
for (const file of files) {
  const errs = [];
  const warn = [];
  let d;
  try {
    d = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.log(`✗ ${file}\n   invalid JSON: ${e.message}`);
    totalErrors++;
    continue;
  }
  const spec = specs[d.science];
  const topic = spec?.topics.find((t) => t.id === d.topicId);
  const st = topic?.subtopics.find((s) => s.slug === d.slug);
  if (!st) errs.push(`slug ${d.science}/${d.topicId}/${d.slug} not in spec`);
  else {
    if (st.specRef !== d.specRef) errs.push(`specRef ${d.specRef} != spec ${st.specRef}`);
    if (st.title !== d.title) errs.push(`title "${d.title}" != spec "${st.title}"`);
    if (!!st.separateOnly !== !!d.separateOnly) errs.push("separateOnly mismatch");
    if (!!st.higherOnly !== !!d.higherOnly) errs.push("higherOnly mismatch");
  }
  if (d.id !== `${d.topicId}-${d.slug}`) errs.push(`id should be ${d.topicId}-${d.slug}`);
  const expectedPath = path.join(root, "content", d.science ?? "", d.topicId ?? "", `${d.slug}.json`);
  if (path.resolve(file) !== expectedPath) errs.push(`file should be at ${path.relative(root, expectedPath)}`);

  const n = d.notes ?? {};
  const need = (cond, msg) => cond || errs.push(msg);
  need(typeof n.definition === "string" && n.definition.length > 30, "notes.definition missing/short");
  need(Array.isArray(n.explanation) && n.explanation.length >= 3, "notes.explanation needs >= 3 paragraphs");
  need(Array.isArray(n.keyFacts) && n.keyFacts.length >= 6, "notes.keyFacts needs >= 6");
  need(Array.isArray(n.keyTerms) && n.keyTerms.length >= 4 && n.keyTerms.every((k) => k.term && k.definition), "notes.keyTerms needs >= 4 {term, definition}");
  need(Array.isArray(n.equations), "notes.equations must be an array");
  (n.equations ?? []).forEach((e, i) => need(e.name && e.formula && typeof e.recall === "boolean", `equation ${i} needs name, formula, recall`));
  need(Array.isArray(n.workedExamples) && n.workedExamples.length >= 2, "notes.workedExamples needs >= 2");
  (n.workedExamples ?? []).forEach((w, i) => need(w.question && Array.isArray(w.steps) && w.steps.length && w.answer, `workedExample ${i} incomplete`));
  need(Array.isArray(n.diagrams) && n.diagrams.length >= 1, "notes.diagrams needs >= 1");
  (n.diagrams ?? []).forEach((g, i) => {
    const s = g.svg ?? "";
    if (!s.startsWith("<svg") || !s.trim().endsWith("</svg>")) errs.push(`diagram ${i}: not an <svg>`);
    if (!/viewBox=/.test(s)) errs.push(`diagram ${i}: missing viewBox`);
    if (/<script|foreignObject|<image|href=\"http/i.test(s)) errs.push(`diagram ${i}: forbidden element`);
    if (s.length > 8000) errs.push(`diagram ${i}: SVG too large (${s.length})`);
    if (s.length < 200) errs.push(`diagram ${i}: SVG suspiciously small`);
    if (!/<text/.test(s)) warn.push(`diagram ${i}: no labels`);
    if (!g.title || !g.caption) errs.push(`diagram ${i}: needs title and caption`);
  });
  need(Array.isArray(n.misconceptions) && n.misconceptions.length >= 3, "notes.misconceptions needs >= 3");
  need(Array.isArray(n.realWorld) && n.realWorld.length >= 2, "notes.realWorld needs >= 2");
  need(Array.isArray(n.practicals), "notes.practicals must be an array");
  const pids = (spec?.practicals ?? []).filter((p) => p.topic === d.topicId && p.subtopic === d.slug).map((p) => p.id);
  for (const p of pids) if (!(n.practicals ?? []).includes(p)) errs.push(`notes.practicals should include ${p}`);
  need(Array.isArray(n.higherTier), "notes.higherTier must be an array");
  need(Array.isArray(n.separateOnlyContent), "notes.separateOnlyContent must be an array");
  need(Array.isArray(n.examTips) && n.examTips.length >= 3, "notes.examTips needs >= 3");
  need(Array.isArray(n.summary) && n.summary.length >= 4, "notes.summary needs >= 4");

  const fc = d.flashcards ?? [];
  need(fc.length >= 10, `flashcards: ${fc.length} (need >= 10)`);
  fc.forEach((c, i) => need(c.front && c.back, `flashcard ${i} incomplete`));

  const qs = d.questions ?? [];
  need(qs.length >= 25, `questions: ${qs.length} (need >= 25)`);
  const ids = new Set();
  const texts = new Set();
  const count = { mcq: 0, numeric: 0, short: 0, extended: 0 };
  const diff = { 1: 0, 2: 0, 3: 0 };
  let mcqPos = [0, 0, 0, 0];
  qs.forEach((q, i) => {
    const tag = `q${i + 1} (${q.id})`;
    if (ids.has(q.id)) errs.push(`${tag}: duplicate id`);
    ids.add(q.id);
    if (!q.id?.startsWith(d.id + "-q")) errs.push(`${tag}: id should start ${d.id}-q`);
    const norm = (q.question ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    if (texts.has(norm)) errs.push(`${tag}: duplicate question text`);
    texts.add(norm);
    if (!(q.type in count)) errs.push(`${tag}: bad type ${q.type}`);
    else count[q.type]++;
    if (!["foundation", "higher", "both"].includes(q.tier)) errs.push(`${tag}: bad tier`);
    if (![1, 2, 3].includes(q.difficulty)) errs.push(`${tag}: bad difficulty`);
    else diff[q.difficulty]++;
    if (!(Number.isInteger(q.marks) && q.marks >= 1 && q.marks <= 6)) errs.push(`${tag}: bad marks`);
    if (!q.question || q.question.length < 12) errs.push(`${tag}: question text missing`);
    if (!Array.isArray(q.markScheme) || !q.markScheme.length) errs.push(`${tag}: markScheme missing`);
    if (!q.explanation || q.explanation.length < 20) errs.push(`${tag}: explanation missing/short`);
    if (q.type === "mcq") {
      if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(`${tag}: mcq needs 4 options`);
      else if (new Set(q.options).size !== 4) errs.push(`${tag}: duplicate options`);
      if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)) errs.push(`${tag}: mcq answer index`);
      else mcqPos[q.answer]++;
    }
    if (q.type === "numeric") {
      if (typeof q.numericAnswer !== "number" || !isFinite(q.numericAnswer)) errs.push(`${tag}: numericAnswer`);
      if (typeof q.tolerance !== "number" || q.tolerance < 0 || q.tolerance > 0.1) errs.push(`${tag}: tolerance`);
      if (typeof q.unit !== "string") errs.push(`${tag}: unit must be string`);
    }
    if (q.type === "short" && (!Array.isArray(q.acceptedAnswers) || !q.acceptedAnswers.length)) errs.push(`${tag}: short needs acceptedAnswers`);
    if (q.type === "extended" && ![4, 6].includes(q.marks)) errs.push(`${tag}: extended must be 4 or 6 marks`);
  });
  need(count.mcq >= 8, `mcq: ${count.mcq} (need >= 8)`);
  need(count.short >= 6, `short: ${count.short} (need >= 6)`);
  need(count.extended >= 2, `extended: ${count.extended} (need >= 2)`);
  need(qs.some((q) => q.type === "extended" && q.marks === 6), "need a 6-mark extended question");
  if (count.numeric > 0 && count.numeric < 4) warn.push(`numeric: only ${count.numeric}`);
  for (const k of [1, 2, 3]) need(diff[k] >= 5, `difficulty ${k}: ${diff[k]} (need >= 5)`);
  if (count.mcq >= 8 && Math.max(...mcqPos) > count.mcq * 0.6) warn.push(`mcq answers clustered: ${mcqPos}`);
  if (d.higherOnly && qs.some((q) => q.tier === "foundation")) errs.push("higherOnly subtopic has foundation questions");

  const raw = JSON.stringify(d);
  if (PLACEHOLDER.test(raw)) errs.push(`placeholder text found: ${raw.match(PLACEHOLDER)[0]}`);
  if (/—/.test(raw)) warn.push("contains em dashes");

  const rel = path.relative(root, file);
  if (errs.length) {
    totalErrors += errs.length;
    console.log(`✗ ${rel}\n   ${errs.join("\n   ")}${warn.length ? "\n   (warn) " + warn.join("\n   (warn) ") : ""}`);
  } else {
    console.log(`✓ ${rel}  ${qs.length} questions, ${fc.length} flashcards${warn.length ? "  (warn) " + warn.join("; ") : ""}`);
  }
}
console.log(totalErrors ? `\n${totalErrors} error(s)` : `\nAll ${files.length} file(s) valid`);
process.exit(totalErrors ? 1 : 0);
