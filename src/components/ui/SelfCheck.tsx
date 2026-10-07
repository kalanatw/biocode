import { useState } from "react";
import type { Unit } from "../../types/content";
import { useProgress } from "../../lib/store";

export function SelfCheck({ unit, storeKey }: { unit: Unit; storeKey: string }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const setQuiz = useProgress((s) => s.setQuiz);
  const total = unit.selfCheck.length;
  const answered = Object.keys(picked).length;
  const score = unit.selfCheck.filter((q, i) => picked[i] === q.answer).length;

  const pick = (qi: number, oi: number) => {
    if (picked[qi] !== undefined) return;
    const next = { ...picked, [qi]: oi };
    setPicked(next);
    if (Object.keys(next).length === total) setQuiz(storeKey, unit.selfCheck.filter((q, i) => next[i] === q.answer).length / total);
  };

  return (
    <div>
      {unit.selfCheck.map((q, qi) => {
        const chosen = picked[qi];
        return (
          <div className="quiz-q" key={qi}>
            <p><b>{qi + 1}. {q.question}</b></p>
            {q.options.map((o, oi) => {
              const cls = chosen === undefined ? "" : oi === q.answer ? "right" : oi === chosen ? "wrong" : "";
              return (
                <button key={oi} className={`opt ${cls}`} disabled={chosen !== undefined} onClick={() => pick(qi, oi)}>
                  {o}
                </button>
              );
            })}
            {chosen !== undefined && (
              <p className="dim" role="status">
                {chosen === q.answer ? "Yes — " : "So close — here's the secret: "}
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}
      {answered === total && (
        <p className="notice" role="status">
          {score === total ? "Perfect — you're doing beautifully. " : `You got ${score} of ${total}. `}
          {score === total ? "✨" : "Re-read the concepts above and try again by reopening the unit."}
        </p>
      )}
    </div>
  );
}
