import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Droplet, Clock, MapPin, AlertTriangle, Share2, Sparkles, LogIn, LogOut, Moon } from "lucide-react";
import {
  getNight, saveNight, intensity, recommendedWaterMl, estimateBAC,
  computeBadges, pureAlcoholG, recommendedRestH,
} from "@/lib/destrava-store";

export const Route = createFileRoute("/_app/night/$id")({
  head: () => ({ meta: [{ title: "Resumo da noite — Destrava" }] }),
  component: NightSummary,
  notFoundComponent: () => <NotFound />,
});

function NotFound() {
  return (
    <div className="p-10 text-center">
      <p className="text-muted-foreground">Noite não encontrada.</p>
      <Link to="/feed" className="text-primary mt-3 inline-block">Voltar ao feed</Link>
    </div>
  );
}

function NightSummary() {
  const { id } = useParams({ from: "/_app/night/$id" });
  const [night, setNight] = useState(() => getNight(id));

  if (!night) return <NotFound />;

  const ints = intensity(night.drinks);
  const water = recommendedWaterMl(night.drinks);
  const bac = estimateBAC(night.drinks);
  const badges = computeBadges(night);
  const totalAlcoholG = night.drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  const hydrationPct = Math.min(100, Math.round((night.hydrationMl / water) * 100));

  const drink250 = () => {
    const next = { ...night, hydrationMl: night.hydrationMl + 250 };
    setNight(next); saveNight(next);
  };

  const start = new Date(night.startedAt).getTime();
  const end = new Date(night.endedAt ?? Date.now()).getTime();
  const hours = Math.max(1, Math.round((end - start) / 3600000));
  const metabolizeH = Math.ceil(totalAlcoholG / 8);
  const restH = recommendedRestH(night.drinks);

  // build timeline
  const events = [
    ...night.drinks.map((d) => ({ time: d.time, label: d.type, kind: "drink" as const })),
    ...night.venues.map((v) => ({ time: v.time, label: `📍 ${v.name}`, kind: "venue" as const })),
  ].sort((a, b) => +new Date(a.time) - +new Date(b.time));

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      {/* Wrapped-style hero */}
      <section className="relative rounded-3xl overflow-hidden p-8 text-center bg-gradient-to-br from-primary via-accent to-background animate-fade-up">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 h-40 w-40 rounded-full bg-cyan blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-neon blur-3xl animate-float" style={{animationDelay:"1.5s"}} />
        </div>
        <div className="relative">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-semibold mb-3 text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> Resumo da noite
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight">{night.title}</h1>
          <p className="text-sm text-white/80 mt-2 flex items-center justify-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {night.city}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="glass rounded-2xl py-3 px-3 flex items-center gap-2 justify-center">
              <LogIn className="h-4 w-4 text-cyan" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-white/70">Chegada</div>
                <div className="text-sm font-mono font-bold">{new Date(night.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
            <div className="glass rounded-2xl py-3 px-3 flex items-center gap-2 justify-center">
              <LogOut className="h-4 w-4 text-neon" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-white/70">Saída</div>
                <div className="text-sm font-mono font-bold">{night.endedAt ? new Date(night.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-7">
            <Hero label="Duração" value={`${hours}h`} />
            <Hero label="Drinks" value={night.drinks.length} />
            <Hero label="Intensidade" value={ints.label} />
          </div>
          <button className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-sm font-semibold hover:scale-105 transition">
            <Share2 className="h-4 w-4" /> Compartilhar
          </button>
        </div>
      </section>

      {/* Intensity bar */}
      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold">Intensidade da noite</h3>
          <span className="text-sm font-mono" style={{ color: ints.color }}>{ints.pct}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${ints.pct}%`, background: `linear-gradient(90deg, var(--success), var(--cyan), var(--warning), var(--destructive))` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 uppercase">
          <span>leve</span><span>social</span><span>intenso</span><span>cuidado</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <Mini label="Álcool puro" value={`${Math.round(totalAlcoholG)}g`} />
          <Mini label="BAC estimado" value={`${bac.toFixed(2)}‰`} />
        </div>
      </section>

      {/* Hydration */}
      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-cyan" />
            <h3 className="font-display font-bold">Hidratação</h3>
          </div>
          <span className="text-sm text-muted-foreground">{night.hydrationMl} / {water} ml</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="h-full bg-cyan rounded-full glow-cyan transition-all" style={{ width: `${hydrationPct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          💧 Recomendado: <strong className="text-foreground">{(water/1000).toFixed(1)}L</strong> — pequenas pausas ajudam.
        </p>
        <button onClick={drink250} className="w-full px-4 py-3 rounded-xl bg-cyan/20 border border-cyan/40 text-cyan font-semibold hover:bg-cyan/30 transition-colors">
          + 250ml — Já bebi água
        </button>
      </section>

      {/* Responsible alerts */}
      {ints.pct > 60 && (
        <section className="rounded-3xl p-5 border border-warning/40 bg-warning/10 flex gap-3 animate-fade-up">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-warning">Nível elevado de álcool detectado.</p>
            <p className="text-muted-foreground mt-1">
              Considere beber água e fazer uma pausa. Seu corpo pode levar cerca de <strong>{metabolizeH}h</strong> para metabolizar. Não dirija.
            </p>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold">Timeline da noite</h3>
        </div>
        <div className="space-y-3 relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
          {events.map((e, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div className={`h-10 w-10 rounded-full grid place-items-center text-xs font-mono shrink-0 z-10 ${
                e.kind === "drink" ? "bg-gradient-neon" : "bg-secondary border border-border"
              }`}>
                {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex-1 pt-2 text-sm">{e.label}</div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos ainda.</p>}
        </div>
      </section>

      {/* Badges */}
      <section className="glass rounded-3xl p-6">
        <h3 className="font-display font-bold mb-3">Badges desbloqueadas</h3>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b} className="px-3 py-2 rounded-full bg-gradient-neon/20 border border-primary/30 text-sm font-medium">
              {b}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function Hero({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass rounded-2xl py-3 px-2">
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/70 mt-1">{label}</div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-display font-bold mt-0.5">{value}</div>
    </div>
  );
}
