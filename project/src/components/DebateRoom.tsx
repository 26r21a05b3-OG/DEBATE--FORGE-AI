import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Send, Loader2, AlertCircle, X, Archive } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateArgument, AiApiError } from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import type { ChatMessage, DatabaseMessage, Stance } from "@/types";
import { MessageBubble } from "@/components/MessageBubble";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";

interface DebateRoomProps {
  debateId: string;
  topic: string;
  userStance: Stance;
  aiStance: Stance;
  onExit: () => void;
}

function stanceLabel(stance: Stance): string {
  return stance === "for" ? "In Favor" : "Against";
}

export function DebateRoom({
  debateId,
  topic,
  userStance,
  aiStance,
  onExit,
}: DebateRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userStanceLabel = stanceLabel(userStance);
  const aiStanceLabel = stanceLabel(aiStance);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      const { data, error: dbError } = await supabase
        .from("debate_messages")
        .select("id, role, content, turn, created_at")
        .eq("debate_id", debateId)
        .order("turn", { ascending: true })
        .order("created_at", { ascending: true });

      if (!active) return;

      if (dbError) {
        setError("Could not load the debate history.");
        setLoadingHistory(false);
        return;
      }

      setMessages((data ?? []) as ChatMessage[]);
      setLoadingHistory(false);

      // If the AI hasn't spoken yet, generate its opening argument.
      const hasAi = (data ?? []).some((m) => m.role === "ai");
      if (!hasAi && user) {
        void requestAiOpening();
      }
    }

    async function requestAiOpening() {
      if (!active) return;
      setThinking(true);
      setError(null);
      try {
        const argument = await generateArgument({
          topic,
          userStance,
          aiStance,
          history: [],
        });
        if (!active) return;

        const turn = 1;
        const { data: inserted, error: insertError } = await supabase
          .from("debate_messages")
          .insert({
            debate_id: debateId,
            role: "ai",
            content: argument,
            turn,
          })
          .select("id, role, content, turn")
          .single();

        if (insertError) throw insertError;
        if (!active) return;
        setMessages((prev) => [...prev, inserted as unknown as ChatMessage]);
      } catch (err) {
        if (!active) return;
        setError(formatAiError(err));
      } finally {
        if (active) setThinking(false);
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debateId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, error]);

  const sendMessage = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const content = input.trim();
      if (!content || thinking) return;

      setError(null);
      const userTurn = Math.max(0, ...messages.map((m) => m.turn)) + 1;

      const { data: insertedUser, error: userInsertError } = await supabase
        .from("debate_messages")
        .insert({
          debate_id: debateId,
          role: "user",
          content,
          turn: userTurn,
        })
        .select("id, role, content, turn")
        .single();

      if (userInsertError) {
        setError("Could not save your argument. Please try again.");
        return;
      }

      const userMessage = insertedUser as unknown as ChatMessage;
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      setThinking(true);
      try {
        const history = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const argument = await generateArgument({
          topic,
          userStance,
          aiStance,
          history,
        });

        const aiTurn = userTurn + 1;
        const { data: insertedAi, error: aiInsertError } = await supabase
          .from("debate_messages")
          .insert({
            debate_id: debateId,
            role: "ai",
            content: argument,
            turn: aiTurn,
          })
          .select("id, role, content, turn")
          .single();

        if (aiInsertError) throw aiInsertError;
        setMessages((prev) => [...prev, insertedAi as unknown as ChatMessage]);
      } catch (err) {
        setError(formatAiError(err));
      } finally {
        setThinking(false);
      }
    },
    [input, thinking, messages, debateId, topic, userStance, aiStance],
  );

  async function handleArchive() {
    setArchiving(true);
    const { error: updateError } = await supabase
      .from("debates")
      .update({ status: "archived" })
      .eq("id", debateId);
    setArchiving(false);
    if (updateError) {
      setError("Could not archive the debate.");
      return;
    }
    onExit();
  }

  return (
    <div className="flex flex-col h-screen bg-ink-950">
      {/* Header */}
      <header className="border-b border-ink-800 bg-ink-900/90 backdrop-blur px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onExit}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition-colors"
          aria-label="Back to debates"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">{topic}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-500/15 text-accent-300">
              You: {userStanceLabel}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-400">
              AI: {aiStanceLabel}
            </span>
          </div>
        </div>
        <button
          onClick={handleArchive}
          disabled={archiving}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-ink-800 transition-colors"
        >
          {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
          End
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-5"
      >
        <div className="max-w-3xl mx-auto space-y-5">
          {loadingHistory ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-12">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading debate...
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                turn={msg.turn}
                aiStanceLabel={aiStanceLabel}
                userStanceLabel={userStanceLabel}
              />
            ))
          )}

          {thinking && <ThinkingIndicator />}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3 max-w-3xl mx-auto">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    // If the AI never spoke, retry the opening.
                    if (!messages.some((m) => m.role === "ai")) {
                      void retryAiOpening();
                    } else if (messages.length > 0 && messages[messages.length - 1].role === "user") {
                      void retryAiReply();
                    }
                  }}
                  className="mt-1.5 text-accent-400 hover:text-accent-300 text-xs font-medium underline"
                >
                  Try again
                </button>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400/60 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <footer className="border-t border-ink-800 bg-ink-900/90 backdrop-blur px-4 py-3 shrink-0">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Make your argument..."
            disabled={thinking || loadingHistory}
            className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim() || loadingHistory}
            className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-ink-950 font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </footer>
    </div>
  );

  async function retryAiOpening() {
    setThinking(true);
    setError(null);
    try {
      const argument = await generateArgument({
        topic,
        userStance,
        aiStance,
        history: [],
      });
      const turn = 1;
      const { data: inserted, error: insertError } = await supabase
        .from("debate_messages")
        .insert({
          debate_id: debateId,
          role: "ai",
          content: argument,
          turn,
        })
        .select("id, role, content, turn")
        .single();
      if (insertError) throw insertError;
      setMessages((prev) => [...prev, inserted as unknown as ChatMessage]);
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setThinking(false);
    }
  }

  async function retryAiReply() {
    setThinking(true);
    setError(null);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const argument = await generateArgument({
        topic,
        userStance,
        aiStance,
        history,
      });
      const aiTurn = Math.max(0, ...messages.map((m) => m.turn)) + 1;
      const { data: inserted, error: insertError } = await supabase
        .from("debate_messages")
        .insert({
          debate_id: debateId,
          role: "ai",
          content: argument,
          turn: aiTurn,
        })
        .select("id, role, content, turn")
        .single();
      if (insertError) throw insertError;
      setMessages((prev) => [...prev, inserted as unknown as ChatMessage]);
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setThinking(false);
    }
  }
}

function formatAiError(err: unknown): string {
  if (err instanceof AiApiError) {
    return err.message;
  }
  const message = err instanceof Error ? err.message : "Something went wrong.";
  return `The AI could not respond: ${message}`;
}
