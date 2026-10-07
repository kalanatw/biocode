import { CourseSchema, type Course } from "../types/content";
import { CURRICULUM, slug, type CurriculumEntry } from "../content/curriculum";
import manifest from "../content/manifest.json";

const loaders = import.meta.glob("../content/courses/*.json");
const keyOf = (path: string) => path.split("/").pop()!.replace(".json", "").toLowerCase();

export type Manifest = Record<string, { units: number; videos: number; papers: number; resources: number }>;
export const MANIFEST = manifest as Manifest;

export const entryBySlug = (s: string): CurriculumEntry | undefined => CURRICULUM.find((c) => slug(c.code) === s);
export const hasContent = (s: string) => Object.keys(loaders).some((p) => keyOf(p) === s);
export const manifestFor = (code: string) => MANIFEST[code.replace(/\s+/g, "")];

const cache = new Map<string, Promise<Course>>();
export function loadCourse(s: string): Promise<Course> {
  const path = Object.keys(loaders).find((p) => keyOf(p) === s);
  if (!path) return Promise.reject(new Error("No content yet for " + s));
  if (!cache.has(s)) {
    cache.set(
      s,
      (loaders[path]() as Promise<{ default: unknown }>).then((m) => {
        const r = CourseSchema.safeParse(m.default);
        if (!r.success) throw new Error(`Course ${s} failed validation: ` + r.error.issues[0]?.message);
        return r.data;
      }),
    );
  }
  return cache.get(s)!;
}

export async function loadAllCourses(): Promise<Course[]> {
  const keys = Object.keys(loaders).map(keyOf);
  const res = await Promise.allSettled(keys.map(loadCourse));
  return res.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
}
