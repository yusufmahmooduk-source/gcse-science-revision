# GCSE Science Revision

AQA GCSE Biology, Chemistry and Physics revision site (specs 8461, 8462, 8463 and Combined Science Trilogy 8464).

## Working on it

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # checks every content file against the authoring rules
npm run build      # static site in out/
```

Content lives in `content/` as JSON (one file per subtopic). The spec structure is in
`content/spec/`, and the rules every file must meet are in `content/AUTHORING.md`.

## Deploying

Railway builds with `npm run build` and serves `out/` with `npm start` (see `railway.json`).
