import { Loader2 } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gold-500/15 text-gold-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
      <div className="flex items-center gap-1.5 pt-3">
        <span className="text-xs text-slate-400 mr-1">DebateForge AI is thinking</span>
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse-dot [animation-delay:0.2s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse-dot [animation-delay:0.4s]" />
      </div>
    </div>
  );
}
