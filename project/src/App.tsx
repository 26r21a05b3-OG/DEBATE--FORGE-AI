import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Landing } from "@/components/Landing";
import { AuthForm } from "@/components/AuthForm";
import { Dashboard } from "@/components/Dashboard";
import { DebateRoom } from "@/components/DebateRoom";
import type { DatabaseDebate } from "@/types";
import { Loader2 } from "lucide-react";

type View =
  | { name: "landing" }
  | { name: "auth" }
  | { name: "dashboard" }
  | { name: "debate"; debate: DatabaseDebate };

function AppShell() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>({ name: "landing" });
  const [profileReady, setProfileReady] = useState(false);

  // Ensure a profile row exists for the signed-in user.
  useEffect(() => {
    if (!user) {
      setProfileReady(false);
      return;
    }
    let active = true;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (!data) {
        await supabase.from("profiles").insert({
          id: user.id,
          display_name: user.email?.split("@")[0] ?? "Debater",
        });
      }
      setProfileReady(true);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  // Route the view based on auth state.
  useEffect(() => {
    if (loading) return;
    if (user && profileReady) {
      setView((prev) =>
        prev.name === "debate" ? prev : { name: "dashboard" },
      );
    } else if (user && !profileReady) {
      // wait for profile to be ready
    } else {
      // signed out: keep landing unless user was on auth
      setView((prev) => (prev.name === "auth" ? prev : { name: "landing" }));
    }
  }, [user, loading, profileReady]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
      </div>
    );
  }

  if (view.name === "landing") {
    return <Landing onGetStarted={() => setView({ name: "auth" })} />;
  }

  if (view.name === "auth") {
    return <AuthForm onDone={() => {}} />;
  }

  if (view.name === "dashboard") {
    return (
      <Dashboard
        onOpenDebate={(debate) => setView({ name: "debate", debate })}
      />
    );
  }

  if (view.name === "debate") {
    return (
      <DebateRoom
        debateId={view.debate.id}
        topic={view.debate.topic}
        userStance={view.debate.user_stance}
        aiStance={view.debate.ai_stance}
        onExit={() => setView({ name: "dashboard" })}
      />
    );
  }

  return null;
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
