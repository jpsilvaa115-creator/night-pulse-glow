import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ShieldAlert, ArrowRight } from "lucide-react";
import { getUser, getAgeOk, setAgeOk, saveUser } from "@/lib/destrava-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Destrava — o tracker da sua noite" },
      { name: "description", content: "O oposto do Strava: registre noites, festas e rolês com estatísticas, hidratação e resumo visual." },
      { property: "og:title", content: "Destrava — tracker social da vida noturna" },
      { property: "og:description", content: "Premium, social e divertido. Apenas para maiores de 18 anos." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"hero" | "age" | "signup">("hero");
  const [year, setYear] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getAgeOk() && getUser()) navigate({ to: "/feed" });
  }, [navigate]);

  const checkAge = () => {
    const y = parseInt(year);
    const age = new Date().getFullYear() - y;
    if (!y || isNaN(y) || age < 18) {
      setError("Somente para maiores de 18 anos.");
      return;
    }
    setError("");
    setAgeOk();
    setStep("signup");
  };

  const finishSignup = () => {
    if (!username.trim()) { setError("Escolha um username."); return; }
    saveUser({
      id: "u_" + Math.random().toString(36).slice(2, 8),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      birthYear: parseInt(year),
    });
    navigate({ to: "/feed" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/30 blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-6 py-10 max-w-xl">
        {step === "hero" && (
          <div className="animate-fade-up">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold mb-6">
              <Sparkles className="h-4 w-4" /> Beta · Apenas 18+
            </div>
            <h1 className="text-5xl sm:text-6xl font-display font-bold leading-[1.05]">
              <span className="text-gradient-neon">Destrava.</span><br />
              Sua noite, seu replay.
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-md">
              Destrava é o tracker social da sua noite. Registre rolês, mapeie festas, monitore hidratação e tenha um resumo visual estilo <em>Wrapped</em> para compartilhar.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-10">
              {[
                { k: "Resumo", v: "estilo Wrapped" },
                { k: "Mapa", v: "rota da noite" },
                { k: "Hidratação", v: "lembretes smart" },
                { k: "Badges", v: "humor + social" },
              ].map((f) => (
                <div key={f.k} className="glass rounded-2xl p-4">
                  <div className="text-sm font-semibold">{f.k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.v}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("age")}
              className="mt-10 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold text-base glow-neon hover:scale-[1.02] transition-transform"
            >
              Começar <ArrowRight className="h-5 w-5" />
            </button>

            <p className="text-xs text-muted-foreground/70 mt-6 text-center">
              Beba com responsabilidade. O Destrava não incentiva consumo excessivo.
            </p>
          </div>
        )}

        {step === "age" && (
          <div className="animate-scale-in pt-10">
            <div className="glass rounded-3xl p-8 border border-warning/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-warning/20 grid place-items-center">
                  <ShieldAlert className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <div className="font-display font-bold text-xl">Confirmação de idade</div>
                  <div className="text-xs text-muted-foreground">Somente para maiores de 18 anos</div>
                </div>
              </div>

              <label className="block text-sm font-medium mt-6 mb-2">Ano de nascimento</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2000"
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-lg"
              />
              {error && <p className="text-destructive text-sm mt-3">{error}</p>}

              <button
                onClick={checkAge}
                className="w-full mt-6 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold glow-neon hover:scale-[1.02] transition-transform"
              >
                Confirmar
              </button>
              <button
                onClick={() => setStep("hero")}
                className="w-full mt-2 px-6 py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground"
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {step === "signup" && (
          <div className="animate-scale-in pt-10">
            <div className="glass rounded-3xl p-8">
              <div className="font-display font-bold text-2xl">Crie seu perfil</div>
              <p className="text-sm text-muted-foreground mt-1">Falta pouco para destravar 🚀</p>

              <label className="block text-sm font-medium mt-6 mb-2">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@vc"
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />

              <label className="block text-sm font-medium mt-4 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="rolê é vida"
                rows={3}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
              />

              {error && <p className="text-destructive text-sm mt-3">{error}</p>}

              <button
                onClick={finishSignup}
                className="w-full mt-6 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold glow-neon hover:scale-[1.02] transition-transform"
              >
                Entrar no Destrava
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
