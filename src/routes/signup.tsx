import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta — Destrava" },
      { name: "description", content: "Crie sua conta no Destrava. Apenas para maiores de 18 anos." },
    ],
  }),
  component: SignupPage,
});

const CURRENT_YEAR = new Date().getFullYear();

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/feed" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(u)) {
      setError("Username: 3–30 caracteres, apenas letras, números e _.");
      return;
    }
    const y = parseInt(birthYear, 10);
    if (!y || isNaN(y) || CURRENT_YEAR - y < 18) {
      setError("Você precisa ter 18 anos ou mais.");
      return;
    }
    if (password.length < 6) {
      setError("Senha precisa ter ao menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        data: {
          username: u,
          birth_year: y,
          bio: bio.trim(),
          city: city.trim() || null,
        },
      },
    });
    setSubmitting(false);

    if (err) {
      if (err.message.toLowerCase().includes("already") || err.message.toLowerCase().includes("registered")) {
        setError("Este email já está cadastrado. Faça login.");
      } else {
        setError(err.message);
      }
      return;
    }

    if (data.session) {
      navigate({ to: "/feed" });
    } else {
      // Email confirmation required
      navigate({ to: "/login", search: { confirm: "1" } as never });
    }
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
          <h1 className="font-display font-bold text-2xl">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-1">Falta pouco para destravar 🚀</p>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-warning/10 border border-warning/30 p-3 text-xs text-warning-foreground">
            <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <span>Apenas para maiores de 18 anos. Beba com responsabilidade.</span>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                placeholder="vc_lendario"
              />
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="6+ caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ano nasc.</label>
                <input
                  type="number"
                  required
                  min={1900}
                  max={CURRENT_YEAR - 18}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="2000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cidade (opcional)</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bio (opcional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="rolê é vida"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold glow-neon hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
            </button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
