import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { fetchAllNights } from "@/lib/nights-api";
import type { Night } from "@/lib/destrava-store";

const NightMap = lazy(() =>
  import("@/components/NightMap").then((m) => ({ default: m.NightMap })),
);

export const Route = createFileRoute("/_app/map")({
  head: () => ({ meta: [{ title: "Mapa — Destrava" }] }),
  component: MapPage,
});

function MapPage() {
  const [nights, setNights] = useState<Night[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAllNights().then(setNights);
  }, []);

  const venues = nights.flatMap((n) =>
    n.venues.map((v) => ({ name: v.name, city: n.city, time: v.time, nightId: n.id })),
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-3xl font-display font-bold">Mapa da noite</h1>
        <p className="text-sm text-muted-foreground mt-1">
          locais reais visitados e rotas — mapa interativo (OpenStreetMap)
        </p>
      </div>

      {mounted ? (
        <Suspense
          fallback={
            <div className="aspect-[16/10] rounded-3xl glass grid place-items-center text-sm text-muted-foreground">
              carregando mapa…
            </div>
          }
        >
          <NightMap venues={venues} />
        </Suspense>
      ) : (
        <div className="aspect-[16/10] rounded-3xl glass" />
      )}

      {venues.length === 0 && mounted && (
        <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
          nenhum lugar registrado ainda — comece criando uma noite
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {venues.map((v, i) => (
          <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 grid place-items-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{v.name}</div>
              <div className="text-xs text-muted-foreground truncate">{v.city}</div>
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
