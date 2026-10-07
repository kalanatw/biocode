import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";

const CoursePage = lazy(() => import("./pages/Course"));
const Library = lazy(() => import("./pages/Library"));
const About = lazy(() => import("./pages/About"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div className="wrap dim" style={{ paddingTop: 40 }}>Loading…</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="course/:slug" element={<CoursePage />} />
            <Route path="library" element={<Library />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<div className="wrap" style={{ paddingTop: 40 }}>Page not found.</div>} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
