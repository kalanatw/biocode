import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

// localStorage can throw (private mode, blocked). Fall back to memory so the app still works.
const mem = new Map<string, string>();
const safe: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return mem.get(k) ?? null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { mem.set(k, v); } },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { mem.delete(k); } },
};

interface Progress {
  /** "bc3022/glycolysis" → true */
  done: Record<string, true>;
  /** "bc3022/glycolysis" → best selfCheck score 0..1 */
  quiz: Record<string, number>;
  toggleDone: (key: string) => void;
  setQuiz: (key: string, score: number) => void;
  reset: () => void;
}

export const useProgress = create<Progress>()(
  persist(
    (set) => ({
      done: {},
      quiz: {},
      toggleDone: (key) => set((s) => {
        const done = { ...s.done };
        if (done[key]) delete done[key]; else done[key] = true;
        return { done };
      }),
      setQuiz: (key, score) => set((s) => ({ quiz: { ...s.quiz, [key]: Math.max(s.quiz[key] ?? 0, score) } })),
      reset: () => set({ done: {}, quiz: {} }),
    }),
    { name: "biocode-progress-v1", storage: createJSONStorage(() => safe) },
  ),
);

export const courseDoneCount = (done: Record<string, true>, courseSlug: string) =>
  Object.keys(done).filter((k) => k.startsWith(courseSlug + "/")).length;
