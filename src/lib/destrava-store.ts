// Mock client-side store for Destrava (no backend yet).
// Persists to localStorage so the app feels real.

export type Drink = {
  id: string;
  type: string; // e.g. "Gin + tônica"
  amountMl: number;
  abv: number; // alcohol by volume 0..1
  time: string; // ISO
  location?: string;
};

export type Night = {
  id: string;
  userId: string;
  title: string;
  city: string;
  neighborhood: string;
  venues: { name: string; time: string }[];
  drinks: Drink[];
  hydrationMl: number;
  startedAt: string;
  endedAt?: string;
  photoDataUrl?: string;
  vibe: "chill" | "social" | "lendaria" | "after";
  likes: number;
  comments: { user: string; text: string }[];
};

export type User = {
  id: string;
  username: string;
  bio: string;
  photoDataUrl?: string;
  birthYear: number;
};

export type PublicUser = {
  id: string;
  username: string;
  bio: string;
  city?: string;
};

const KEY_USER = "destrava.user";
const KEY_NIGHTS = "destrava.nights";
const KEY_AGE_OK = "destrava.age_ok";
const KEY_FRIENDS = "destrava.friends";
const KEY_REQUESTS_OUT = "destrava.requests.out";
const KEY_REQUESTS_IN = "destrava.requests.in";

export function getAgeOk(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_AGE_OK) === "1";
}
export function setAgeOk() {
  localStorage.setItem(KEY_AGE_OK, "1");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_USER);
  return raw ? JSON.parse(raw) : null;
}
export function saveUser(u: User) {
  localStorage.setItem(KEY_USER, JSON.stringify(u));
}
export function logout() {
  localStorage.removeItem(KEY_USER);
}

export function getNights(): Night[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY_NIGHTS);
  if (raw) return JSON.parse(raw);
  // seed feed
  const seed = seedNights();
  localStorage.setItem(KEY_NIGHTS, JSON.stringify(seed));
  return seed;
}
export function saveNight(n: Night) {
  const all = getNights();
  const idx = all.findIndex((x) => x.id === n.id);
  if (idx >= 0) all[idx] = n;
  else all.unshift(n);
  localStorage.setItem(KEY_NIGHTS, JSON.stringify(all));
}
export function getNight(id: string): Night | undefined {
  return getNights().find((n) => n.id === id);
}

// ABV by drink type (rough)
export const DRINK_PRESETS: { label: string; abv: number; defaultMl: number }[] = [
  { label: "Cerveja", abv: 0.05, defaultMl: 350 },
  { label: "Vinho", abv: 0.12, defaultMl: 150 },
  { label: "Gin + tônica", abv: 0.1, defaultMl: 250 },
  { label: "Vodka + energético", abv: 0.12, defaultMl: 250 },
  { label: "Whisky + energético", abv: 0.13, defaultMl: 250 },
  { label: "Caipirinha", abv: 0.15, defaultMl: 250 },
  { label: "Shot", abv: 0.4, defaultMl: 50 },
];

// Pure alcohol grams (Widmark inputs)
export function pureAlcoholG(d: Drink) {
  return d.amountMl * d.abv * 0.789;
}

// Estimated BAC in g/L (‰) — Widmark, assumes avg 70kg / r=0.68, β=0.15‰/h
export function estimateBAC(drinks: Drink[], hours = 3) {
  const totalG = drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  const bac = totalG / (70 * 0.68) - 0.15 * hours;
  return Math.max(0, Math.round(bac * 100) / 100);
}

// Recommended rest hours to fully metabolize alcohol (~8g/h) + minimum sleep
export function recommendedRestH(drinks: Drink[]) {
  const totalG = drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  const metabolizeH = totalG / 8;
  return Math.max(7, Math.ceil(metabolizeH + 6));
}

export function intensity(drinks: Drink[]): { pct: number; label: string; color: string } {
  const g = drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  const pct = Math.min(100, Math.round((g / 80) * 100));
  let label = "Leve", color = "var(--success)";
  if (pct > 30) { label = "Social"; color = "var(--cyan)"; }
  if (pct > 60) { label = "Intenso"; color = "var(--warning)"; }
  if (pct > 85) { label = "Cuidado"; color = "var(--destructive)"; }
  return { pct, label, color };
}

export function recommendedWaterMl(drinks: Drink[]) {
  const totalG = drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  // ~250ml de água por dose padrão (10g de álcool puro), mínimo 500ml
  return Math.max(500, Math.round((totalG / 10) * 250 / 50) * 50);
}

function seedNights(): Night[] {
  const now = Date.now();
  return [
    {
      id: "n_seed1",
      userId: "u_lua",
      title: "Sexta na Vila",
      city: "São Paulo",
      neighborhood: "Vila Madalena",
      venues: [{ name: "Bar Astor", time: new Date(now - 1000*60*60*5).toISOString() }, { name: "Balada Lab", time: new Date(now - 1000*60*60*2).toISOString() }],
      drinks: [
        { id: "d1", type: "Gin + tônica", amountMl: 250, abv: 0.1, time: new Date(now - 1000*60*60*5).toISOString() },
        { id: "d2", type: "Cerveja", amountMl: 350, abv: 0.05, time: new Date(now - 1000*60*60*3).toISOString() },
      ],
      hydrationMl: 750,
      startedAt: new Date(now - 1000*60*60*6).toISOString(),
      endedAt: new Date(now - 1000*60*60*1).toISOString(),
      vibe: "social",
      likes: 42,
      comments: [{ user: "rafa", text: "que noite 🔥" }],
    },
    {
      id: "n_seed2",
      userId: "u_theo",
      title: "After até o sol nascer",
      city: "Rio de Janeiro",
      neighborhood: "Lapa",
      venues: [{ name: "Rio Scenarium", time: new Date(now - 1000*60*60*30).toISOString() }],
      drinks: [
        { id: "d3", type: "Caipirinha", amountMl: 250, abv: 0.15, time: new Date(now - 1000*60*60*30).toISOString() },
        { id: "d4", type: "Cerveja", amountMl: 350, abv: 0.05, time: new Date(now - 1000*60*60*28).toISOString() },
      ],
      hydrationMl: 1500,
      startedAt: new Date(now - 1000*60*60*32).toISOString(),
      vibe: "lendaria",
      likes: 128,
      comments: [],
    },
  ];
}

// Badges
export function computeBadges(n: Night): string[] {
  const badges: string[] = [];
  const hours = (new Date(n.endedAt ?? Date.now()).getTime() - new Date(n.startedAt).getTime()) / 3600000;
  if (hours >= 7) badges.push("Sobreviveu até 5AM");
  if (n.hydrationMl >= recommendedWaterMl(n.drinks)) badges.push("Hidratado 💧");
  if (n.venues.length >= 3) badges.push("Tour da cidade");
  if (n.vibe === "lendaria") badges.push("Noite lendária");
  if (n.vibe === "after") badges.push("Modo after");
  if (badges.length === 0) badges.push("Primeira parada");
  return badges;
}
