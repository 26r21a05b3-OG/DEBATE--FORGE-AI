import { User, Swords } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "ai";
  content: string;
  turn: number;
  aiStanceLabel: string;
  userStanceLabel: string;
}

export function MessageBubble({
  role,
  content,
  turn,
  aiStanceLabel,
  userStanceLabel,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const stanceLabel = isUser ? userStanceLabel : aiStanceLabel;

  return (
    <div
      className={`flex gap-3 animate-fade-up ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-accent-500/15 text-accent-300"
            : "bg-gold-500/15 text-gold-400"
        }`}
      >
        {isUser ? <User className="w-4.5 h-4.5" /> : <Swords className="w-4.5 h-4.5" />}
      </div>
      <div className={`max-w-[78%] ${isUser ? "text-right" : "text-left"}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-300">
            {isUser ? "You" : "DebateForge AI"}
          </span>
          <span className="text-[10px] text-slate-600">
            {stanceLabel} · turn {turn}
          </span>
        </div>
        <div
          className={`inline-block text-left rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-accent-500/10 border border-accent-500/30 text-slate-100"
              : "bg-ink-800 border border-ink-700 text-slate-200"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
