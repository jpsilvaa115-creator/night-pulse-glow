import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, MapPin, Share2, Flame, Sparkles } from "lucide-react";
import { intensity, computeBadges, type Night } from "@/lib/destrava-store";
import { fetchAllNights } from "@/lib/nights-api";
import {
  fetchMyLikedNightIds,
  fetchProfilesByIds,
  toggleLike,
  type Profile,
} from "@/lib/social-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/feed")({
  head: () => ({ meta: [{ title: "Feed — Destrava" }] }),
  component: Feed,
});

function Feed() {
  const { user } = useAuth();
  const [nights, setNights] = useState<Night[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchAllNights();
      if (cancelled) return;
      setNights(data);
      const profMap = await fetchProfilesByIds(data.map((n) => n.userId));
      if (cancelled) return;
      setProfiles(profMap);
      if (user) {
        const s = await fetchMyLikedNightIds(user.id);
        if (!cancelled) setLiked(s);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleLike = async (id: string) => {
    if (!user) return;
    const isLiked = liked.has(id);
    setLiked((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    setNights((prev) => prev.map((n) => n.id === id ? { ...n, likes: n.likes + (isLiked ? -1 : 1) } : n));
    await toggleLike(user.id, id, isLiked);
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
        const isLiked = liked.has(n.id);
        const author = profiles.get(n.userId);
        return (
          <article
            key={n.id}
            className="glass rounded-3xl overflow-hidden animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="p-5 flex items-center gap-3">
              <Link to="/u/$id" params={{ id: n.userId }} className="h-11 w-11 rounded-full bg-gradient-neon grid place-items-center text-sm font-bold overflow-hidden shrink-0">
                {author?.photo_url
                  ? <img src={author.photo_url} alt={author.username} className="h-full w-full object-cover" />
                  : (author?.username ?? n.userId).slice(0, 1).toUpperCase()}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to="/u/$id" params={{ id: n.userId }} className="font-semibold text-sm hover:underline">
                  @{author?.username ?? n.userId.slice(0, 6)}
                </Link>
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
              <button
                onClick={() => handleLike(n.id)}
                disabled={!user}
                className={`flex items-center gap-1.5 transition-colors ${isLiked ? "text-destructive" : "hover:text-destructive"}`}
                aria-label="Curtir"
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} /> {n.likes}
              </button>
              <Link
                to="/night/$id"
                params={{ id: n.id }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-5 w-5" /> comentar
              </Link>
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
