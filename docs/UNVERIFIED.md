# Items that could not be machine-verified

NCBI Bookshelf sits behind a reCAPTCHA for every automated route (HTTP, E-utilities for whole books, Europe PMC), so
the verifier can only see "bot-wall" and counts those URLs as pass-with-warning. Check these by opening them in a browser.

| URL | Cited as | Basis |
|---|---|---|
| https://www.ncbi.nlm.nih.gov/books/NBK21154/ | Berg, Tymoczko, Stryer — Biochemistry, 5th ed. | widely cited canonical ID; not machine-confirmed |
| https://www.ncbi.nlm.nih.gov/books/NBK21475/ | Lodish et al. — Molecular Cell Biology, 4th ed. | recalled by authoring agents; not machine-confirmed |
| https://www.ncbi.nlm.nih.gov/books/NBK21766/ | Introduction to Genetic Analysis | recalled by authoring agent; not machine-confirmed |
| https://www.ncbi.nlm.nih.gov/books/NBK143764/ | NCBI Handbook | E-utilities returned a chapter of a book with this ID ("References", 2013) |

Confirmed via E-utilities chapter lookups: NBK21054 (Alberts, Molecular Biology of the Cell — "Cells and Genomes"), NBK9839
(Cooper, The Cell — "An Overview of Cells and Cell Research"), NBK10757 (Immunobiology 5th ed — "Basic Concepts in
Immunology"), NBK1762 (BLAST Help), NBK92007 (Assay Guidance Manual), NBK10799 (Purves, Neuroscience), NBK201 (Clinical
Methods), NBK7627 (Medical Microbiology).

## Other known limits of the automated checks
- YouTube: oEmbed proves the video exists, is embeddable and that its title matches. It does **not** prove the content is
  correct — a human subject-matter pass is still needed (see REVIEW.md once written).
- Khan Academy returns HTTP 200 for any path, so its links are not proof the page exists.
- Several videos come from small or individual channels; their `whyWatch` text says so.
- "Helpful background" course codes were chosen by authoring agents; treat them as suggestions.
- Level 1–2 modules (FD codes) are foundation modules designed for this guide; the codes are placeholders.
- Open-access links were re-checked against OpenAlex (`is_oa`), not each page by hand.
