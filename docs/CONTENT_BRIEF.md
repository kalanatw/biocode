# Content authoring brief (for research agents)

You are writing course content for **BIOCODE**, a curated resource guide for a 4-year BSc (Hons) path in Biochemistry & Molecular
Biology.
The goal: a student can open a course page and be *walked through it unit by unit* — story hook, objectives, concepts,
three depth layers, an inline animation (if one fits), curated YouTube videos, primary papers, free resources, a self-check.

## Deliverable
One JSON file per course: `app/src/content/courses/<CODE-without-space>.json`, e.g. `BC3022.json`.
It must validate against `app/src/types/content.ts` (`CourseSchema`). **Read that file first.** Look at the field limits
(e.g. 4-14 keyConcepts, 3-8 objectives, 1-5 videos per unit, 2-6 selfCheck questions, 4 options each).

Course metadata (code, title, level, semester, credits, hours, kind, provenance) comes from
`app/src/content/curriculum.ts` — copy it exactly.

## Size guidance
- 2-credit lecture course: 5-7 units. 3-credit: 7-9 units. Max 14. Units ≈ 4-6 lecture hours each.
- Practical / project / seminar courses (`kind` ≠ lecture): make units *skills & technique modules*
  (e.g. "Spectrophotometry & Beer-Lambert", "Writing a literature review", "Designing a research question").
  `hook` = why the skill matters in a real lab/project; objectives = things the student can *do*.
- Every unit: ≥1 verified video, ≥2 selfCheck questions. Papers: add where genuine landmark/primary or excellent
  review papers exist for the unit (0-4). Not every unit needs one — never pad.

## HARD RULES
1. **Never fabricate** a DOI, YouTube ID, URL, number or quote. Every video ID, DOI and URL must come from a real
   search/fetch you did, then pass the verifier. If you can't verify something, drop it.
2. **Copyright**: write all prose in your own words. No copied textbook/paper/slide text. Link out instead.
3. **Videos**: only embeddable, reputable educational uploads — e.g. Khan Academy, MIT OpenCourseWare, HHMI
   BioInteractive, iBiology, Ninja Nerd, Armando Hasudungan, Amoeba Sisters, Osmosis, CrashCourse, Professor Dave Explains,
   Kurzgesagt, Nature Video, yourgenome, Harvard (Inner Life of the Cell), academic channels, Bozeman Science,
   Dr Matt & Dr Mike, Lecturio, etc. Prefer 3-20 min videos; a full-lecture OCW video is fine for `courseVideos`.
   Use `startSeconds` to jump into a long lecture where the relevant part starts (only if you confirmed it).
   `whyWatch` = one concrete sentence on what the student gets.
4. **Papers**: prefer landmark primary papers (beginner-friendly "why it matters" explanation) and a few excellent,
   recent (≤ 5 yrs) reviews. `whyItMatters` is your own explanation, not the abstract. Use
   `https://api.crossref.org/works?query.bibliographic=<title>&rows=3` (via curl) to find/confirm DOIs.
   Use `openAccessUrl` only for a verified OA copy (PMC / Europe PMC / publisher OA page).
5. **Resources**: free, authoritative (NCBI Bookshelf, OpenStax, LibreTexts, MIT OCW, EMBL-EBI training, PDB-101, Khan,
   databases/tools). Mark `free` honestly. `note` explains why a student should use it.
6. **Accuracy**: numbers and mechanisms must be standard-textbook-correct. Where unsure, say less. Analogies must say where
   they break.
7. **Positioning**: this is a resource guide, not a syllabus mirror. Cover standard content for the course title at BSc Honours
   level, benchmarked to international curricula (e.g. MIT OCW, EMBL-EBI, HHMI), and add current practice and where the
   field is heading. Never mention any particular institution in prose. For optional/advanced/selected-topics courses,
   choose well-established frontier topics and say topics vary by year in `overview`. Do not add "no syllabus found"
   or "check your handbook" caveats to course prose.
8. **Warm but precise tone**: the site has a gentle "love vibe" — hooks should be vivid and human, never kitsch,
   never inaccurate.

## `animation` field
Optional per unit. Pick from `AnimationIdEnum` in content.ts **only if the unit's content is truly what that animation
shows** (the engineer is building these inline widgets): dna-helix, central-dogma, genetic-code, lac-operon,
glycolysis-flow, chemiosmosis, michaelis-menten, protein-folding, pcr-cycles, cloning-cut-paste, sequence-alignment,
titration-curve, immune-response, cell-scale-zoom. Don't force one — omit when none fits.

## Workflow
1. Read `content.ts`, `curriculum.ts`, and (if present) one existing course JSON in `src/content/courses/` for style.
2. Research each course (WebSearch / WebFetch / curl for APIs). Find videos by searching, then confirm each ID with:
   `curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json"`.
3. Write the JSON files.
4. From `app/`, run `npx tsx scripts/verify-content.ts <CODE> <CODE> ...` (codes without spaces). Fix every FAIL and
   schema error (replace or drop the item). Repeat until it exits 0. Bot-wall 403/429 URLs are tolerated.
5. Final reply (≤ 150 words): per course — number of units, videos, papers, resources; 
   anything you dropped or are unsure about. Do NOT paste the JSON back.
