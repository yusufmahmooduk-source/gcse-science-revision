# Content authoring guide

Every subtopic is one JSON file at `content/<science>/<topicId>/<slug>.json`
(e.g. `content/biology/b1/microscopy.json`). The slug, specRef and title MUST
match `content/spec/<science>.json` exactly. Run `node scripts/validate.mjs <file>`
after writing each file and fix every error before moving on.

Audience: UK GCSE students (age 14 to 16) sitting AQA 8461/8462/8463 (separate)
or 8464 (Combined Science Trilogy). British English spelling (haemoglobin,
sulphur is "sulfur" per AQA, colour, analyse). Content must be accurate to the
AQA specification: no content beyond the spec, and nothing missing from it.
Write clearly and concretely, for a student revising alone.

## File shape

```json
{
  "id": "b1-microscopy",
  "science": "biology",
  "topicId": "b1",
  "slug": "microscopy",
  "specRef": "4.1.1.5",
  "title": "Microscopy",
  "separateOnly": false,
  "higherOnly": false,
  "notes": {
    "definition": "One or two sentence definition of the core idea.",
    "explanation": ["paragraph", "paragraph", "... (3 to 7 paragraphs, each 40 to 120 words)"],
    "keyFacts": ["short fact", "... (6 to 12)"],
    "keyTerms": [{ "term": "Resolution", "definition": "..." }],
    "equations": [
      { "name": "Magnification", "formula": "magnification = size of image ÷ size of real object", "symbols": "M = I ÷ A", "units": "no units (it is a ratio)", "recall": true }
    ],
    "workedExamples": [
      { "title": "...", "question": "...", "steps": ["step", "step"], "answer": "..." }
    ],
    "diagrams": [
      { "title": "...", "caption": "...", "svg": "<svg viewBox=\"0 0 400 250\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>" }
    ],
    "misconceptions": [{ "wrong": "Students often think ...", "right": "In fact ..." }],
    "realWorld": ["concrete real-world application", "..."],
    "practicals": ["bio-rp1"],
    "higherTier": ["content only Higher tier students need (empty array if none)"],
    "separateOnlyContent": ["content only in separate Biology, not Combined (empty if none)"],
    "examTips": ["specific, actionable exam technique tip", "..."],
    "summary": ["one-line recap", "... (4 to 8)"]
  },
  "flashcards": [{ "front": "question or term", "back": "answer" }],
  "questions": [ ... ]
}
```

### Rules for notes
- `equations` may be empty if the subtopic has none. `recall: true` only if AQA
  requires students to recall it (not given on the equation sheet).
- `workedExamples`: at least 2. For maths-heavy subtopics at least 3, including a
  unit conversion or rearrangement where relevant.
- `diagrams`: 1 to 3 inline SVGs. Requirements: `viewBox` set, no width/height
  attributes, no `<script>`, no external images, no `foreignObject`. Use
  `currentColor` for lines and text so the diagram works in dark mode. Fills may use
  these soft colours: `#86efac` (green), `#c4b5fd` (purple), `#93c5fd` (blue),
  `#fde68a` (yellow), `#fca5a5` (red), `#e5e7eb` (grey) with `fill-opacity="0.5"`.
  Label every important part with `<text font-size="12" fill="currentColor">`.
  Keep each SVG under 6000 characters. Diagrams must be scientifically correct.
- `misconceptions`: at least 3. `realWorld`: at least 2. `examTips`: at least 3.
- `practicals`: list required practical ids from the spec file for this subtopic
  (empty array otherwise).
- `flashcards`: 10 to 16 cards.

### Rules for questions (at least 25 per subtopic, aim for 26 to 30)

Each question:
```json
{
  "id": "b1-microscopy-q01",
  "type": "mcq | numeric | short | extended",
  "tier": "foundation | higher | both",
  "difficulty": 1,
  "marks": 1,
  "question": "Question text. Use \n for line breaks.",
  "options": ["A", "B", "C", "D"],
  "answer": 2,
  "numericAnswer": 400,
  "tolerance": 0.01,
  "unit": "μm",
  "acceptedAnswers": ["for short answers only: accepted key words or phrases"],
  "markScheme": ["1 mark: ...", "1 mark: ..."],
  "explanation": "Why the answer is right, and why common wrong answers are wrong."
}
```
- `mcq`: exactly 4 `options`, `answer` is the 0-based index. Distractors must be
  plausible (common misconceptions), not silly. Vary the correct position.
- `numeric`: `numericAnswer` (number), `tolerance` (fractional, e.g. 0.02 = 2%),
  `unit` (string, may be empty). Check every calculation carefully; compute it twice.
- `short`: 1 to 3 marks, written answer; `acceptedAnswers` lists key words the
  marker looks for.
- `extended`: 4 or 6 marks, levels-of-response style. `markScheme` gives
  indicative content and the level descriptors.
- Every question needs `markScheme` (non-empty) and `explanation`.
- Mix required per subtopic: at least 8 mcq, at least 6 short, at least 2 extended
  (one worth 6 marks). Include numeric questions wherever the subtopic has maths
  (at least 4 then). At least 2 questions on the required practical if the
  subtopic has one.
- `difficulty`: 1 = grades 1 to 3, 2 = grades 4 to 6, 3 = grades 7 to 9. Spread:
  at least 6 of each difficulty.
- `tier`: "higher" for Higher-only content or grade 7 to 9 questions, otherwise
  "both" or "foundation".
- Questions must be original, AQA exam style (command words: state, describe,
  explain, calculate, evaluate, compare, suggest), and unambiguous. No duplicates.
- Never write placeholder text such as "TODO", "lorem", "...", "etc." as content.

## Style
- Do not use em dashes (—) anywhere. Use commas, colons, brackets or full stops.
- Use "μm", "cm³", "dm³", "°C", "×", "÷", "→" characters directly. Use <sub>/<sup>
  nowhere; write chemical formulae with Unicode subscripts (H₂O, CO₂, C₆H₁₂O₆) and
  powers with Unicode superscripts (10⁻⁶, m²) or "× 10^-6" in plain text.

## Required practicals

One file per practical at `content/practicals/<id>.json` (id from the spec file,
e.g. `bio-rp1`):

```json
{
  "id": "bio-rp1", "science": "biology", "number": 1,
  "title": "(exactly as in spec file)", "combined": true,
  "topicId": "b1", "subtopic": "microscopy",
  "aim": "...",
  "background": ["paragraph", "paragraph"],
  "hypothesis": "example hypothesis",
  "variables": { "independent": "...", "dependent": "...", "control": ["...", "..."] },
  "equipment": ["...", "..."],
  "method": ["numbered step text", "... (8 to 15 steps)"],
  "safety": [{ "hazard": "...", "risk": "...", "precaution": "..." }],
  "results": { "headers": ["col", "col"], "rows": [["...", "..."]], "notes": "how to process/graph the data" },
  "analysis": ["how to analyse and what the expected result is", "..."],
  "errors": [{ "error": "source of error", "improvement": "how to reduce it" }],
  "diagram": { "title": "...", "caption": "...", "svg": "<svg viewBox=...>...</svg>" },
  "examTips": ["...", "..."],
  "questions": [ at least 12 questions, same format as subtopic questions, ids "<id>-q01" ... ]
}
```
Sample data must be realistic and consistent with the expected result.
Run `node scripts/validate-practicals.mjs` after writing.
