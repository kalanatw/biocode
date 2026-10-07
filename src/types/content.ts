import { z } from "zod";

export const LevelEnum = z.enum(["beginner", "intermediate", "advanced"]);
export type Level = z.infer<typeof LevelEnum>;

/** A YouTube video. `youtubeId` MUST be verified through YouTube oEmbed (scripts/verify-content.ts). */
export const VideoSchema = z.object({
  youtubeId: z.string().regex(/^[\w-]{11}$/),
  title: z.string().min(3),
  channel: z.string().min(2),
  startSeconds: z.number().int().nonnegative().optional(),
  level: LevelEnum,
  whyWatch: z.string().min(10), // one sentence on what the student gets from it
});
export type Video = z.infer<typeof VideoSchema>;

/** A paper. `doi` MUST resolve on Crossref and the title must match (scripts/verify-content.ts). */
export const PaperSchema = z.object({
  doi: z.string().regex(/^10\.\d{4,9}\/\S+$/),
  title: z.string().min(5),
  authors: z.string().min(2), // "Watson JD, Crick FH"
  year: z.number().int().min(1800).max(2100),
  journal: z.string().min(2),
  level: LevelEnum,
  openAccessUrl: z.string().url().optional(),
  whyItMatters: z.string().min(20), // original wording, 1-3 sentences
  readingQuestions: z.array(z.string()).max(5).optional(),
});
export type Paper = z.infer<typeof PaperSchema>;

export const ResourceSchema = z.object({
  title: z.string().min(3),
  provider: z.string().min(2),
  type: z.enum(["textbook", "course", "database", "tool", "interactive", "tutorial", "reference"]),
  url: z.string().url(),
  free: z.boolean(),
  level: LevelEnum,
  note: z.string().min(10),
});
export type Resource = z.infer<typeof ResourceSchema>;

/** IDs of inline interactive animations implemented in src/components/viz/registry.ts */
export const AnimationIdEnum = z.enum([
  "dna-helix",
  "central-dogma",
  "genetic-code",
  "lac-operon",
  "glycolysis-flow",
  "chemiosmosis",
  "michaelis-menten",
  "protein-folding",
  "pcr-cycles",
  "cloning-cut-paste",
  "sequence-alignment",
  "titration-curve",
  "immune-response",
  "cell-scale-zoom",
]);
export type AnimationId = z.infer<typeof AnimationIdEnum>;

export const UnitSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  hours: z.number().nonnegative().optional(),
  hook: z.string().min(30), // 2-3 sentence story opener, original
  learningObjectives: z.array(z.string()).min(3).max(8), // "After this you can ..."
  keyConcepts: z.array(z.object({ term: z.string(), definition: z.string() })).min(4).max(14),
  deeper: z.object({
    beginner: z.string().min(40),
    intermediate: z.string().min(40),
    advanced: z.string().min(40),
  }),
  commonMistakes: z.array(z.string()).min(1).max(6),
  animation: AnimationIdEnum.optional(),
  videos: z.array(VideoSchema).min(1).max(5),
  papers: z.array(PaperSchema).max(6),
  resources: z.array(ResourceSchema).max(6),
  selfCheck: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        answer: z.number().int().min(0).max(3),
        explanation: z.string().min(20),
      }),
    )
    .min(2)
    .max(6),
});
export type Unit = z.infer<typeof UnitSchema>;

export const CourseSchema = z.object({
  code: z.string().regex(/^[A-Z]{2} \d{4}$/),
  title: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  semester: z.union([z.literal(1), z.literal(2)]),
  credits: z.number(),
  hours: z.string(), // "30L", "15L 30P"
  kind: z.enum(["lecture", "practical", "project", "seminar"]),
  /** "official" = supplied by the user from the department handbook; "provisional" = inferred, must be confirmed */
  provenance: z.enum(["official", "provisional"]),
  tagline: z.string().min(10),
  overview: z.string().min(60),
  whyItMatters: z.string().min(40),
  prerequisites: z.array(z.string()), // course codes
  careerLinks: z.array(z.string()).max(5),
  studyTips: z.array(z.string()).min(2).max(6),
  units: z.array(UnitSchema).max(14),
  courseVideos: z.array(VideoSchema).max(4), // overview / playlist-level (e.g. MIT OCW lectures)
  textbooks: z.array(ResourceSchema).max(5),
});
export type Course = z.infer<typeof CourseSchema>;
