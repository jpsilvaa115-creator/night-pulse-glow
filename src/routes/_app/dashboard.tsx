import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplet, Wine, MapPin, TrendingUp } from "lucide-react";
import { intensity, recommendedWaterMl, type Night } from "@/lib/destrava-store";
import { fetchNightsByUser } from "@/lib/nights-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Destrava" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [nights, setNights] = useState<Night[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchNightsByUser(user.id).then((data) => {
      if (cancelled) return;
      setNights(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const totalNights = nights.length;
  const totalDrinks = nights.reduce((a, n) => a + n.drinks.length, 0);
  const totalHydration = nights.reduce((a, n) => a + n.hydrationMl, 0);
  const venues = new Set(nights.flatMap((n) => n.venues.map((v) => v.name)));

  const drinkCount: Record<string, number> = {};
  nights.forEach((n) => n.drinks.forEach((d) => { drinkCount[d.type] = (drinkCount[d.type] ?? 0) + 1; }));
  const topDrinks = Object.entries(drinkCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxDrink = Math.max(1, ...topDrinks.map(([, v]) => v));

  const dow = [0, 0, 0, 0, 0, 0, 0];
  nights.forEach((n) => { dow[new Date(n.startedAt).getDay()] += 1; });
  const maxDow = Math.max(1, ...dow);
  const dowLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">suas estatísticas, sem julgamento</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={TrendingUp} label="Noites" value={totalNights} accent="var(--neon)" />
        <Stat icon={Wine} label="Drinks" value={totalDrinks} accent="var(--cyan)" />
        <Stat icon={Droplet} label="Água (ml)" value={totalHydration} accent="var(--success)" />
        <Stat icon={MapPin} label="Locais" value={venues.size} accent="var(--warning)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Bebidas favoritas">
          <div className="space-y-3">
            {topDrinks.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {topDrinks.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{name}</span><span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-neon rounded-full" style={{ width: `${(count / maxDrink) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Frequência por dia">
          <div className="flex items-end justify-between gap-2 h-40">
            {dow.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-neon rounded-t-lg transition-all"
                    style={{ height: `${(v / maxDow) * 100}%`, minHeight: 4 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{dowLabels[i]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Noites recentes">
        {loading ? (
          <p className="text-sm text-muted-foreground">carregando…</p>
        ) : nights.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Você ainda não registrou nenhuma noite.</p>
            <Link to="/new-night" className="inline-block px-4 py-2 rounded-xl bg-gradient-neon text-sm font-semibold">
              Registrar primeira noite
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {nights.slice(0, 5).map((n) => {
              const ints = intensity(n.drinks);
              const water = recommendedWaterMl(n.drinks);
              return (
                <Link
                  to="/night/$id"
                  params={{ id: n.id }}
                  key={n.id}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary transition-colors"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-neon grid place-items-center font-bold">
                    {n.title.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {n.city} · {n.drinks.length} drinks · {n.hydrationMl}/{water}ml água
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${ints.color}20`, color: ints.color }}>
                    {ints.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: any) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} /> {label}
      </div>
      <div className="text-3xl font-display font-bold mt-2">{value}</div>
    </div>
  );
}
function Card({ title, children }: any) {
  return (
    <div className="glass rounded-3xl p-6">
      <h2 className="font-display font-bold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}
