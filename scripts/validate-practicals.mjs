#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dir = path.join(root, "content/practicals");
const all = {};
for (const f of fs.readdirSync(path.join(root, "content/spec"))) {
  const s = JSON.parse(fs.readFileSync(path.join(root, "content/spec", f), "utf8"));
  for (const p of s.practicals) all[p.id] = { ...p, science: s.science };
}
let bad = 0;
const files = process.argv.slice(2).length ? process.argv.slice(2) : (fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => path.join(dir, f)) : []);
for (const file of files) {
  const e = [];
  let d;
  try { d = JSON.parse(fs.readFileSync(file, "utf8")); } catch (x) { console.log(`✗ ${file}: ${x.message}`); bad++; continue; }
  const s = all[d.id];
  if (!s) e.push("id not in spec");
  else {
    if (s.title !== d.title) e.push(`title should be "${s.title}"`);
    if (s.number !== d.number || s.topic !== d.topicId || s.subtopic !== d.subtopic || s.combined !== d.combined || s.science !== d.science) e.push("number/topicId/subtopic/combined/science mismatch with spec");
  }
  for (const k of ["aim", "hypothesis"]) if (!d[k] || d[k].length < 20) e.push(`${k} missing`);
  if (!(d.background?.length >= 2)) e.push("background >= 2");
  if (!d.variables?.independent || !d.variables?.dependent || !(d.variables?.control?.length >= 2)) e.push("variables incomplete");
  if (!(d.equipment?.length >= 4)) e.push("equipment >= 4");
  if (!(d.method?.length >= 8)) e.push("method >= 8 steps");
  if (!(d.safety?.length >= 2) || !d.safety.every((x) => x.hazard && x.risk && x.precaution)) e.push("safety >= 2 complete rows");
  if (!(d.results?.headers?.length >= 2) || !(d.results?.rows?.length >= 3) || !d.results.rows.every((r) => r.length === d.results.headers.length)) e.push("results table incomplete/ragged");
  if (!(d.analysis?.length >= 2)) e.push("analysis >= 2");
  if (!(d.errors?.length >= 3) || !d.errors.every((x) => x.error && x.improvement)) e.push("errors >= 3");
  if (!d.diagram?.svg?.startsWith("<svg") || !/viewBox/.test(d.diagram.svg) || /<script|foreignObject|<image/.test(d.diagram.svg)) e.push("diagram svg invalid");
  if (!(d.examTips?.length >= 3)) e.push("examTips >= 3");
  const qs = d.questions ?? [];
  if (qs.length < 12) e.push(`questions ${qs.length} (need >= 12)`);
  const ids = new Set();
  qs.forEach((q, i) => {
    if (ids.has(q.id) || !q.id?.startsWith(d.id + "-q")) e.push(`q${i + 1}: bad/duplicate id`);
    ids.add(q.id);
    if (!["mcq", "numeric", "short", "extended"].includes(q.type)) e.push(`q${i + 1}: type`);
    if (!["foundation", "higher", "both"].includes(q.tier) || ![1, 2, 3].includes(q.difficulty) || !(q.marks >= 1 && q.marks <= 6)) e.push(`q${i + 1}: tier/difficulty/marks`);
    if (!q.markScheme?.length || !q.explanation) e.push(`q${i + 1}: markScheme/explanation`);
    if (q.type === "mcq" && (q.options?.length !== 4 || !(q.answer >= 0 && q.answer <= 3))) e.push(`q${i + 1}: mcq options/answer`);
    if (q.type === "numeric" && (typeof q.numericAnswer !== "number" || typeof q.tolerance !== "number" || typeof q.unit !== "string")) e.push(`q${i + 1}: numeric fields`);
    if (q.type === "short" && !q.acceptedAnswers?.length) e.push(`q${i + 1}: acceptedAnswers`);
  });
  if (/\b(TODO|lorem|TBD)\b/i.test(JSON.stringify(d))) e.push("placeholder text");
  const rel = path.relative(root, file);
  if (e.length) { bad += e.length; console.log(`✗ ${rel}\n   ${e.join("\n   ")}`); } else console.log(`✓ ${rel} (${qs.length} questions)`);
}
console.log(bad ? `\n${bad} error(s)` : `\nAll ${files.length} practical(s) valid`);
process.exit(bad ? 1 : 0);
