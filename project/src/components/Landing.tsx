import { Swords, Sparkles, Shield, MessageSquareText, ArrowRight } from "lucide-react";

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-ink-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
            <Swords className="w-5 h-5 text-ink-950" />
          </div>
          <span className="font-serif text-lg text-white">DebateForge</span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-sm text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-ink-700 hover:border-accent-500/50 hover:bg-ink-800/50 transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-800/60 border border-ink-700 text-xs text-accent-300 mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          AI-powered debate practice
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white leading-[1.1] max-w-3xl mx-auto animate-fade-up">
          Sharpen your arguments against an{" "}
          <span className="bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">
            AI debater
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mx-auto mt-5 animate-fade-up [animation-delay:0.1s]">
          Pick any topic, choose a side, and go head-to-head with an AI that
          argues the opposing position in real time.
        </p>

        <div className="mt-8 animate-fade-up [animation-delay:0.2s]">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-ink-950 font-semibold px-6 py-3 rounded-xl transition-colors group"
          >
            Start Debating
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-20 max-w-3xl mx-auto">
          <FeatureCard
            icon={<MessageSquareText className="w-5 h-5" />}
            title="Real-time responses"
            text="The AI generates a live opening argument and replies to each of your counterpoints."
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Pick your side"
            text="Argue in favor or against. The AI takes the opposite stance and stays on its side."
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Save your debates"
            text="Every debate is stored to your account, so you can revisit and continue anytime."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="text-left bg-ink-900/60 backdrop-blur border border-ink-700 rounded-2xl p-5 hover:border-accent-500/40 transition-colors animate-fade-up">
      <div className="w-10 h-10 rounded-xl bg-accent-500/10 text-accent-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-white font-medium text-sm mb-1">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
    </div>
  );
}
