import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Destrava — o tracker da sua noite" },
      { name: "description", content: "Destrava — sua noite, seu replay. Registre rolês, mapeie festas, monitore hidratação e tenha um resumo visual da noite. 18+." },
      { property: "og:title", content: "Destrava — tracker social da vida noturna" },
      { property: "og:description", content: "Premium, social e divertido. Apenas para maiores de 18 anos." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/feed" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/30 blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <header className="container mx-auto px-6 py-5 max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-neon grid place-items-center glow-neon">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-gradient-neon">Destrava</span>
        </div>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-xl">
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold mb-6">
            <Sparkles className="h-4 w-4" /> Beta · Apenas 18+
          </div>
          <h1 className="text-5xl sm:text-6xl font-display font-bold leading-[1.05]">
            <span className="text-gradient-neon">Destrava.</span>
            <br />
            Sua noite, seu replay.
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-md">
            O tracker social da vida noturna. Registre rolês, mapeie festas,
            monitore hidratação e tenha um resumo visual estilo <em>Wrapped</em>{" "}
            para compartilhar.
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

          <Link
            to="/signup"
            className="mt-10 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold text-base glow-neon hover:scale-[1.02] transition-transform"
          >
            Criar conta <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="text-sm text-muted-foreground mt-4 text-center">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Entrar
            </Link>
          </p>

          <p className="text-xs text-muted-foreground/70 mt-6 text-center">
            Beba com responsabilidade. O Destrava não incentiva consumo excessivo.
          </p>
        </div>
      </main>
    </div>
  );
}
