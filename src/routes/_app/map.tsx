import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { getNights } from "@/lib/destrava-store";

export const Route = createFileRoute("/_app/map")({
  head: () => ({ meta: [{ title: "Mapa — Destrava" }] }),
  component: MapPage,
});

function MapPage() {
  const nights = getNights();
  const venues = nights.flatMap((n) => n.venues.map((v) => ({ ...v, city: n.city, neighborhood: n.neighborhood, nightId: n.id })));

  // Pseudo-random coords by hash so the same name lands in same place
  const hash = (s: string) => {
    let h = 0; for (const c of s) h = (h*31 + c.charCodeAt(0)) | 0;
    return Math.abs(h);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-3xl font-display font-bold">Mapa da noite</h1>
        <p className="text-sm text-muted-foreground mt-1">locais visitados e rotas recentes</p>
      </div>

      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden glass">
        {/* stylized map */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(0.18_0.05_280)_0,transparent_60%),radial-gradient(circle_at_70%_70%,oklch(0.16_0.04_270)_0,transparent_60%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 60" preserveAspectRatio="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i*5} x2="100" y2={i*5} stroke="currentColor" strokeWidth="0.1" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={i*5} y1="0" x2={i*5} y2="60" stroke="currentColor" strokeWidth="0.1" />
          ))}
        </svg>

        {/* route */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          <polyline
            points={venues.map(v => `${(hash(v.name) % 90) + 5},${(hash(v.name+v.city) % 50) + 5}`).join(" ")}
            fill="none" stroke="url(#g)" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1.5 1"
          />
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0" stopColor="oklch(0.65 0.3 300)" />
              <stop offset="1" stopColor="oklch(0.75 0.18 220)" />
            </linearGradient>
          </defs>
        </svg>

        {/* pins */}
        {venues.map((v) => {
          const x = (hash(v.name) % 90) + 5;
          const y = (hash(v.name+v.city) % 50) + 5;
          return (
            <div
              key={v.name + v.time}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="h-9 w-9 rounded-full bg-gradient-neon grid place-items-center glow-neon animate-fade-up">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="text-[10px] glass px-2 py-1 rounded-md mt-1 whitespace-nowrap">{v.name}</div>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {venues.map((v, i) => (
          <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 grid place-items-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{v.name}</div>
              <div className="text-xs text-muted-foreground truncate">{v.neighborhood} · {v.city}</div>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(v.time).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
