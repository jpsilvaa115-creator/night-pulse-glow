import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Crown, Medal, Sparkles } from "lucide-react";
import {
  RANK_META,
  computeRanking,
  type RankCategory,
  type RankRow,
  type Night,
} from "@/lib/destrava-store";
import { fetchAllNights } from "@/lib/nights-api";
import { fetchAllProfiles, type Profile } from "@/lib/social-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/rankings")({
  head: () => ({ meta: [{ title: "Rankings — Destrava" }] }),
  component: Rankings,
});

const CATEGORIES: RankCategory[] = ["nights", "hydration", "explorer", "survivor", "badges"];

function Rankings() {
  const { user } = useAuth();
  const meId = user?.id ?? null;
  const [cat, setCat] = useState<RankCategory>("nights");
  const [nights, setNights] = useState<Night[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rows, setRows] = useState<RankRow[]>([]);

  useEffect(() => {
    Promise.all([fetchAllNights(), fetchAllProfiles()]).then(([n, p]) => {
      setNights(n);
      setProfiles(p);
    });
  }, []);

  useEffect(() => {
    setRows(computeRanking(cat, nights, profiles));
  }, [cat, nights, profiles]);

  const meta = RANK_META[cat];
  const myIndex = rows.findIndex((r) => r.user.id === meId);

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5">
      <header>
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-display font-bold">Rankings</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          rankings leves e zoeira — sem cobrar ninguém, só pra rir
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((c) => {
          const m = RANK_META[c];
          const active = c === cat;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all border ${
                active
                  ? "bg-gradient-neon glow-neon border-transparent text-white"
                  : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="mr-1.5">{m.emoji}</span>
              {m.title.split(" ")[0]}
            </button>
          );
        })}
      </div>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-4xl">{meta.emoji}</div>
            <h2 className="font-display font-bold text-2xl mt-2">{meta.title}</h2>
            <p className="text-sm text-muted-foreground">{meta.sub}</p>
          </div>
          {myIndex >= 0 && (
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">sua posição</div>
              <div className="text-3xl font-display font-bold text-gradient-neon">#{myIndex + 1}</div>
            </div>
          )}
        </div>

        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            ainda sem dados para esse ranking — registre noites pra começar.
          </p>
        )}

        {rows.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3 items-end">
            {[1, 0, 2].map((order) => {
              const r = rows[order];
              if (!r) return <div key={order} />;
              const isFirst = order === 0;
              const heights = isFirst ? "h-32" : order === 1 ? "h-24" : "h-20";
              const icons = [<Crown key="c" className="h-4 w-4" />, <Medal key="m" className="h-4 w-4" />, <Medal key="m2" className="h-4 w-4" />];
              return (
                <Link
                  to="/u/$id"
                  params={{ id: r.user.id }}
                  key={r.user.id}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`h-14 w-14 rounded-full bg-gradient-neon grid place-items-center font-display font-bold text-lg overflow-hidden ${isFirst ? "glow-neon scale-110" : ""}`}>
                    {r.user.photo_url
                      ? <img src={r.user.photo_url} alt={r.user.username} className="h-full w-full object-cover" />
                      : r.user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold truncate max-w-full">@{r.user.username}</div>
                  <div className="text-xs text-muted-foreground">{r.label}</div>
                  <div className={`w-full ${heights} rounded-t-2xl bg-gradient-to-t ${isFirst ? "from-primary/40 to-primary/10" : "from-secondary to-secondary/30"} border border-border border-b-0 grid place-items-center`}>
                    <div className="flex items-center gap-1 text-xs font-bold">
                      {icons[order]} {order + 1}º
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section className="glass rounded-3xl p-2">
          {rows.map((r, i) => {
            const me = r.user.id === meId;
            return (
              <Link
                to="/u/$id"
                params={{ id: r.user.id }}
                key={r.user.id}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  me ? "bg-primary/15 border border-primary/30" : "hover:bg-secondary/60"
                }`}
              >
                <div className={`w-8 text-center font-display font-bold ${i < 3 ? "text-gradient-neon" : "text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-neon grid place-items-center text-sm font-bold overflow-hidden">
                  {r.user.photo_url
                    ? <img src={r.user.photo_url} alt={r.user.username} className="h-full w-full object-cover" />
                    : r.user.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    @{r.user.username} {me && <span className="text-xs text-primary">(você)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{r.user.bio || "sem bio"}</div>
                </div>
                <div className="text-sm font-mono font-bold">{r.label}</div>
              </Link>
            );
          })}
        </section>
      )}

      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
        <Sparkles className="h-3 w-3" /> rankings semanais — zera toda segunda 😉
      </p>
    </div>
  );
}
