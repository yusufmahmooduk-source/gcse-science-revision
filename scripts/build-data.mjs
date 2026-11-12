#!/usr/bin/env node
// Bundles question and flashcard data per science into public/data/ for the
// cross-topic tools (practice, flashcards, mock exams). Runs before `next build`.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "public/data");
fs.mkdirSync(out, { recursive: true });
const index = [];
for (const f of fs.readdirSync(path.join(root, "content/spec"))) {
  const spec = JSON.parse(fs.readFileSync(path.join(root, "content/spec", f), "utf8"));
  const questions = [];
  const cards = [];
  const topics = [];
  for (const t of spec.topics) {
    const subs = [];
    for (const st of t.subtopics) {
      const file = path.join(root, "content", spec.science, t.id, `${st.slug}.json`);
      if (!fs.existsSync(file)) continue;
      const d = JSON.parse(fs.readFileSync(file, "utf8"));
      const source = { science: spec.science, topicId: t.id, slug: st.slug, title: st.title, higherOnly: st.higherOnly, separateOnly: st.separateOnly };
      for (const q of d.questions) questions.push({ ...q, source });
      d.flashcards.forEach((c, i) => cards.push({ id: `${d.id}-f${i}`, front: c.front, back: c.back, label: `${t.code} ${st.title}`, topicId: t.id, separateOnly: st.separateOnly, higherOnly: st.higherOnly }));
      subs.push({ slug: st.slug, title: st.title, separateOnly: st.separateOnly, higherOnly: st.higherOnly, questionIds: d.questions.map((q) => q.id) });
    }
    topics.push({ id: t.id, code: t.code, name: t.name, subtopics: subs });
  }
  fs.writeFileSync(path.join(out, `${spec.science}.json`), JSON.stringify({ science: spec.science, topics, questions, cards }));
  index.push({ science: spec.science, name: spec.name, questions: questions.length, cards: cards.length });
  console.log(`${spec.science}: ${questions.length} questions, ${cards.length} flashcards`);
}
fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index));
