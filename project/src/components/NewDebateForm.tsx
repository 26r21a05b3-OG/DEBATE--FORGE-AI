import { useState, type FormEvent } from "react";
import { Swords, Loader2, AlertCircle } from "lucide-react";
import type { Stance } from "@/types";

interface NewDebateFormProps {
  onStart: (topic: string, userStance: Stance) => void;
  starting: boolean;
}

export function NewDebateForm({ onStart, starting }: NewDebateFormProps) {
  const [topic, setTopic] = useState("");
  const [stance, setStance] = useState<Stance>("for");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (topic.trim().length < 5) {
      setError("Please enter a topic of at least 5 characters.");
      return;
    }
    setError(null);
    onStart(topic.trim(), stance);
  }

  return (
    <div className="bg-ink-900/80 backdrop-blur rounded-2xl border border-ink-700 p-6 shadow-xl animate-fade-up">
      <h2 className="font-serif text-xl text-white mb-1">Start a New Debate</h2>
      <p className="text-sm text-slate-400 mb-5">
        Choose any topic and a side. The AI will take the opposing position.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Debate topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Should artificial intelligence replace traditional education?"
            rows={2}
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Your position
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStance("for")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                stance === "for"
                  ? "bg-accent-500/15 border-accent-500 text-accent-300"
                  : "bg-ink-800 border-ink-700 text-slate-400 hover:text-white"
              }`}
            >
              In Favor
            </button>
            <button
              type="button"
              onClick={() => setStance("against")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                stance === "against"
                  ? "bg-gold-500/15 border-gold-500 text-gold-400"
                  : "bg-ink-800 border-ink-700 text-slate-400 hover:text-white"
              }`}
            >
              Against
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={starting}
          className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-60 text-ink-950 font-semibold py-2.5 rounded-lg transition-colors"
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting debate...
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" />
              Start Debate
            </>
          )}
        </button>
      </form>
    </div>
  );
}
