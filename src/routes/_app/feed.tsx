import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, MapPin, Share2, Flame, Sparkles } from "lucide-react";
import { intensity, computeBadges, type Night } from "@/lib/destrava-store";
import { fetchAllNights, likeNight } from "@/lib/nights-api";

export const Route = createFileRoute("/_app/feed")({
  head: () => ({ meta: [{ title: "Feed — Destrava" }] }),
  component: Feed,
});

function Feed() {
  const [nights, setNights] = useState<Night[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAllNights().then((data) => {
      if (cancelled) return;
      setNights(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const like = async (id: string) => {
    setNights((prev) => prev.map((n) => n.id === id ? { ...n, likes: n.likes + 1 } : n));
    await likeNight(id).catch(() => {});
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-display font-bold">Feed</h1>
        <span className="text-xs text-muted-foreground">{nights.length} noites</span>
      </div>

      {loading && (
        <div className="space-y-5">
          {[0, 1].map((i) => (
            <div key={i} className="glass rounded-3xl h-96 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && nights.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
          <p className="font-semibold">Nenhuma noite por aqui ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a registrar um rolê.</p>
          <Link to="/new-night" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-gradient-neon font-semibold glow-neon">
            Registrar primeira noite
          </Link>
        </div>
      )}

      {nights.map((n, i) => {
        const ints = intensity(n.drinks);
        const badges = computeBadges(n);
        return (
          <article
            key={n.id}
            className="glass rounded-3xl overflow-hidden animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="p-5 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-neon grid place-items-center text-sm font-bold">
                {n.userId.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">@{n.userId.slice(0, 6)}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {n.city || "—"}
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: `${ints.color}20`, color: ints.color }}>
                <Flame className="h-3 w-3 inline mr-1" />{ints.label}
              </span>
            </div>

            <Link to="/night/$id" params={{ id: n.id }} className="block">
              {n.photoDataUrl ? (
                <img src={n.photoDataUrl} alt={n.title} className="w-full aspect-square object-cover" />
              ) : (
                <div className="aspect-square relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-accent/30 to-background" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center px-6">
                      <div className="text-4xl font-display font-bold text-gradient-neon">{n.title}</div>
                      <div className="text-sm text-muted-foreground mt-3">{n.venues.map(v => v.name).join(" → ")}</div>
                    </div>
                  </div>
                </div>
              )}
            </Link>

            <div className="px-5 pt-4 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground/90 border border-border">
                  {b}
                </span>
              ))}
            </div>

            <div className="p-5 flex items-center gap-5 text-sm">
              <button onClick={() => like(n.id)} className="flex items-center gap-1.5 hover:text-destructive transition-colors">
                <Heart className="h-5 w-5" /> {n.likes}
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-5 w-5" /> {n.comments.length}
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground ml-auto">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
