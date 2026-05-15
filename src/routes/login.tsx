import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Destrava" },
      { name: "description", content: "Entre no Destrava e acesse seu replay da noite." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/feed" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Email ou senha inválidos." : err.message);
      return;
    }
    navigate({ to: "/feed" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/30 blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-6 py-10 max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-neon grid place-items-center glow-neon">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-gradient-neon">Destrava</span>
        </Link>

        <div className="glass rounded-3xl p-8">
          <h1 className="font-display font-bold text-2xl">Entrar</h1>
          <p className="text-sm text-muted-foreground mt-1">Bem-vindo de volta 🌙</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                placeholder="voce@email.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Senha</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">esqueci</Link>
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold glow-neon hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
            </button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Ainda não tem conta?{" "}
            <Link to="/signup" className="text-primary hover:underline font-semibold">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
