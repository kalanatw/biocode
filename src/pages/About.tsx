export default function About() {
  return (
    <div className="wrap" style={{ paddingTop: 32, maxWidth: 780 }}>
      <h1>About BIOCODE</h1>
      <p className="script">A resource guide for people who want to really understand what they are doing.</p>
      <p>
        BIOCODE gathers the best freely available material in biochemistry and molecular biology and puts it in a sensible order:
        short units that run from first principles to the research frontier. Each unit pairs an original explanation with
        carefully chosen videos, landmark and recent papers, free references and an interactive animation — so you learn the
        idea, see it move, and know where to read more.
      </p>

      <h2>What you will find</h2>
      <ul>
        <li><b>Videos</b> from Khan Academy, MIT OpenCourseWare, HHMI-style explainers and respected science educators, with a one-line reason to watch each.</li>
        <li><b>Papers</b> from Nature, Science, Cell, PNAS and others — the originals behind the ideas, each with a plain-language “why it matters”.</li>
        <li><b>Free references</b> such as NCBI Bookshelf, OpenStax, MIT OpenCourseWare, EMBL-EBI training, PDB-101 and LibreTexts.</li>
        <li><b>Interactive animations</b> — DNA, the genetic code, enzymes, metabolism, PCR, cloning, alignment and more — each labelled with what it simplifies.</li>
        <li><b>Techniques, ethics and critical reading</b> alongside the science, because knowing <i>why</i> you are doing something matters as much as knowing how.</li>
      </ul>

      <h2>How we keep it honest</h2>
      <ul>
        <li><b>Verified links.</b> Every DOI is checked against Crossref and every video against YouTube before the site builds. A video check confirms it exists and matches its title — it cannot judge the teaching, so treat recommendations as curated, not infallible.</li>
        <li><b>Original writing.</b> Explanations are written fresh; papers and videos are linked, never copied.</li>
        <li><b>“Simplified for story”.</b> Every animation says what it simplifies, and where an analogy breaks.</li>
        <li><b>Foundation modules</b> in Years 1–2 are designed for this guide to build the background that later topics assume.</li>
        <li><b>Topics that change.</b> Optional and advanced topics are chosen from well-established frontier areas; the field moves quickly, so check recent literature too.</li>
      </ul>

      <h2>How to use it</h2>
      <p>Pick a topic, start at unit 1, read the story, try the animation, watch one video, skim a paper with its guiding questions, then test yourself. Mark units complete to track progress — it is saved in your browser only. Always cross-check with your own notes.</p>
    </div>
  );
}
