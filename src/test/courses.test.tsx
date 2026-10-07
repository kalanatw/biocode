import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CoursePage from "../pages/Course";
import Home from "../pages/Home";
import { CURRICULUM, slug } from "../content/curriculum";
import { hasContent, loadCourse } from "../lib/content";

afterEach(cleanup);

describe("curriculum coverage", () => {
  it("every curriculum entry has content, with metadata matching curriculum.ts", async () => {
    for (const e of CURRICULUM) {
      expect(hasContent(slug(e.code)), `no content for ${e.code}`).toBe(true);
      const c = await loadCourse(slug(e.code));
      expect({ code: c.code, title: c.title, level: c.level, semester: c.semester, credits: c.credits, hours: c.hours, provenance: c.provenance })
        .toEqual({ code: e.code, title: e.title, level: e.level, semester: e.semester, credits: e.credits, hours: e.hours, provenance: e.provenance });
    }
  });
  it("prerequisites only reference real courses", async () => {
    const codes = new Set(CURRICULUM.map((c) => c.code));
    for (const e of CURRICULUM) for (const p of (await loadCourse(slug(e.code))).prerequisites) expect(codes.has(p), `${e.code} -> ${p}`).toBe(true);
  });
});

describe("pages render", () => {
  it("home lists all courses as links", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(document.querySelectorAll("a.course-card").length).toBe(CURRICULUM.length);
  });

  for (const e of CURRICULUM) {
    it(`${e.code}: overview and every unit render with all videos, in the sidebar order`, async () => {
      const c = await loadCourse(slug(e.code));
      const ui = (unit?: string) => (
        <MemoryRouter initialEntries={[`/course/${slug(e.code)}${unit ? `?unit=${unit}` : ""}`]}>
          <Routes><Route path="course/:slug" element={<CoursePage />} /></Routes>
        </MemoryRouter>
      );
      let r = render(ui());
      await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: c.title })).toBeTruthy());
      expect(document.querySelectorAll(".side ol li").length).toBe(c.units.length);
      r.unmount();
      for (const u of c.units) {
        r = render(ui(u.id));
        await waitFor(() => expect(document.querySelector(".unit .hook")).toBeTruthy());
        expect(document.querySelectorAll(".video").length, `${c.code}/${u.id} videos`).toBe(u.videos.length);
        expect(document.querySelectorAll(".quiz-q").length).toBe(u.selfCheck.length);
        if (u.animation) await waitFor(() => expect(document.querySelector("figure.viz")).toBeTruthy(), { timeout: 8000 });
        r.unmount();
      }
    });
  }
});
