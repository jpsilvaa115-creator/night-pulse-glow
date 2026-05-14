import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type GeoVenue = {
  name: string;
  city: string;
  time: string;
  nightId: string;
  lat: number;
  lng: number;
};

const CACHE_KEY = "destrava.geocache.v1";

type Cache = Record<string, { lat: number; lng: number } | null>;

function loadCache(): Cache {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function saveCache(c: Cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

// Geocode via Nominatim (no key, public). Throttle: 1 req/sec.
async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  } catch { return null; }
}

// Custom neon pin
const neonIcon = L.divIcon({
  className: "destrava-pin",
  html: `<div style="position:relative;transform:translate(-50%,-100%);">
    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#3b82f6);box-shadow:0 0 20px rgba(168,85,247,.7);display:grid;place-items:center;border:2px solid rgba(255,255,255,.9);">
      <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
    </div>
    <div style="position:absolute;left:50%;top:24px;width:2px;height:10px;background:linear-gradient(180deg,#3b82f6,transparent);transform:translateX(-50%);"></div>
  </div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

type Input = { name: string; city: string; time: string; nightId: string };

export function NightMap({ venues }: { venues: Input[] }) {
  const [geo, setGeo] = useState<GeoVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const lastReq = useRef(0);

  // Stable signature so the effect only re-runs when the set changes
  const sig = useMemo(
    () => venues.map((v) => `${v.name}|${v.city}`).join("§"),
    [venues],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const cache = loadCache();
      const out: GeoVenue[] = [];
      for (const v of venues) {
        const key = `${v.name}, ${v.city}`.toLowerCase();
        let coords = cache[key];
        if (coords === undefined) {
          // throttle ~1 req/s for Nominatim's usage policy
          const wait = Math.max(0, 1100 - (Date.now() - lastReq.current));
          if (wait) await new Promise((r) => setTimeout(r, wait));
          lastReq.current = Date.now();
          coords = await geocode(`${v.name}, ${v.city}`);
          cache[key] = coords;
          saveCache(cache);
        }
        if (cancelled) return;
        if (coords) out.push({ ...v, lat: coords.lat, lng: coords.lng });
      }
      if (!cancelled) {
        setGeo(out);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const points: [number, number][] = geo.map((v) => [v.lat, v.lng]);
  // Default to São Paulo if nothing geocoded yet
  const center: [number, number] = points[0] ?? [-23.5489, -46.6388];

  return (
    <div className="relative aspect-[16/10] rounded-3xl overflow-hidden glass">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="absolute inset-0 w-full h-full"
        style={{ background: "#0b0b16" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.length > 1 && (
          <Polyline
            positions={points}
            pathOptions={{ color: "#a855f7", weight: 4, opacity: 0.85, dashArray: "8 8" }}
          />
        )}
        {geo.map((v, i) => (
          <Marker key={`${v.nightId}-${i}`} position={[v.lat, v.lng]} icon={neonIcon}>
            <Popup>
              <div style={{ fontWeight: 700 }}>{v.name}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{v.city}</div>
              <div style={{ opacity: 0.6, fontSize: 11, marginTop: 4 }}>
                {new Date(v.time).toLocaleString("pt-BR")}
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds points={points} />
      </MapContainer>

      {loading && (
        <div className="absolute top-3 right-3 z-[1000] glass px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          localizando lugares…
        </div>
      )}
      {!loading && geo.length === 0 && venues.length > 0 && (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground bg-background/60">
          não consegui localizar esses lugares no mapa
        </div>
      )}
    </div>
  );
}
