import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { DatabaseDebate, DatabaseMessage, Stance } from "@/types";
import { NewDebateForm } from "@/components/NewDebateForm";
import { Swords, MessageSquare, LogOut, Loader2, Clock } from "lucide-react";

interface DashboardProps {
  onOpenDebate: (debate: DatabaseDebate) => void;
}

export function Dashboard({ onOpenDebate }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [debates, setDebates] = useState<DatabaseDebate[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDebates() {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("debates")
      .select("id, user_id, topic, user_stance, ai_stance, status, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (dbError) {
      setError("Could not load your debates.");
      setLoading(false);
      return;
    }
    setDebates((data ?? []) as DatabaseDebate[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadDebates();
  }, []);

  async function handleStart(topic: string, userStance: Stance) {
    setStarting(true);
    setError(null);
    const aiStance: Stance = userStance === "for" ? "against" : "for";

    const { data, error: insertError } = await supabase
      .from("debates")
      .insert({
        topic,
        user_stance: userStance,
        ai_stance: aiStance,
      })
      .select("id, user_id, topic, user_stance, ai_stance, status, created_at, updated_at")
      .single();

    if (insertError) {
      setError("Could not create the debate. Please try again.");
      setStarting(false);
      return;
    }

    const newDebate = data as unknown as DatabaseDebate;
    setStarting(false);
    onOpenDebate(newDebate);
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Top bar */}
      <header className="border-b border-ink-800 bg-ink-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
              <Swords className="w-5 h-5 text-ink-950" />
            </div>
            <span className="font-serif text-lg text-white">DebateForge</span>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-slate-400 hidden sm:inline">
            {user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-ink-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-[380px_1fr]">
          {/* Left column: new debate */}
          <div className="md:sticky md:top-20 md:self-start">
            <NewDebateForm onStart={handleStart} starting={starting} />
          </div>

          {/* Right column: history */}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              <MessageSquare className="w-4 h-4" />
              Your Debates
            </h2>

            {error && (
              <p className="text-sm text-red-400 mb-4">{error}</p>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-12">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : debates.length === 0 ? (
              <div className="text-center py-16 px-6 border border-dashed border-ink-700 rounded-2xl">
                <Swords className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  No debates yet. Start your first one on the left.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {debates.map((debate) => (
                  <li key={debate.id}>
                    <button
                      onClick={() => onOpenDebate(debate)}
                      className="w-full text-left bg-ink-900/70 hover:bg-ink-800 border border-ink-700 hover:border-accent-500/50 rounded-xl p-4 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium text-white text-sm leading-snug flex-1">
                          {debate.topic}
                        </h3>
                        {debate.status === "archived" && (
                          <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-ink-800 shrink-0">
                            Ended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-500/15 text-accent-300">
                          You: {debate.user_stance === "for" ? "In Favor" : "Against"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-400">
                          AI: {debate.ai_stance === "for" ? "In Favor" : "Against"}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatDate(debate.updated_at)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}
