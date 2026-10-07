# BIOCODE — Biochemistry & Molecular Biology resource guide

A static React + TypeScript site: a curated, link-verified resource guide organised by topic and year, unit by unit:
story hook → objectives → key concepts → inline animation → three depth layers → verified YouTube videos →
landmark papers → free resources → self-check.

```bash
npm install
npm run dev        # builds the manifest, starts Vite
npm run verify     # validates every course against the Zod schema + checks every DOI (Crossref), video (YouTube oEmbed), URL
npm test           # unit tests + render tests for all 14 animations and every unit of every course
npm run build      # manifest + typecheck + production build (deploy dist/ to any static host)
```

- Topic map: `src/content/curriculum.ts` (Years 3–4 topics supplied; Years 1–2 are foundation modules with placeholder `FD` codes).
- Course content: `src/content/courses/<CODE>.json`, schema in `src/types/content.ts`. Authoring rules: `docs/CONTENT_BRIEF.md`.
- Animations: `src/components/viz/` (spec in `docs/VIZ_BRIEF.md`); register in `registry.ts`.
- Known gaps and unverifiable links: `docs/UNVERIFIED.md`. Link report: `docs/link-report.json`.
