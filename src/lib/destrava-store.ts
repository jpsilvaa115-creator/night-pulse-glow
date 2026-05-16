// Types and pure helpers for Destrava.
// Data persistence lives in `nights-api.ts` (real backend) and `useAuth`.
// Friendships and the mock community list are still local — Phase 3 replaces them.

export type Drink = {
  id: string;
  type: string;
  amountMl: number;
  abv: number;
  time: string;
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

export type PublicUser = {
  id: string;
  username: string;
  bio: string;
  city?: string;
};

// ============= Drink presets / Widmark helpers =============
export const DRINK_PRESETS: { label: string; abv: number; defaultMl: number }[] = [
  { label: "Cerveja", abv: 0.05, defaultMl: 350 },
  { label: "Vinho", abv: 0.12, defaultMl: 150 },
  { label: "Gin + tônica", abv: 0.1, defaultMl: 250 },
  { label: "Vodka + energético", abv: 0.12, defaultMl: 250 },
  { label: "Whisky + energético", abv: 0.13, defaultMl: 250 },
  { label: "Caipirinha", abv: 0.15, defaultMl: 250 },
  { label: "Shot", abv: 0.4, defaultMl: 50 },
];

export function pureAlcoholG(d: Drink) {
  return d.amountMl * d.abv * 0.789;
}

export function estimateBAC(drinks: Drink[], hours = 3) {
  const totalG = drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  const bac = totalG / (70 * 0.68) - 0.15 * hours;
  return Math.max(0, Math.round(bac * 100) / 100);
}

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
  return Math.max(500, Math.round((totalG / 10) * 250 / 50) * 50);
}

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

// ============= Public mock community (Phase 3 will replace with profiles) =============
export const PUBLIC_USERS: PublicUser[] = [
  { id: "u_lua", username: "lua", bio: "noite é vida 🌙", city: "São Paulo" },
  { id: "u_theo", username: "theo", bio: "after enthusiast", city: "Rio de Janeiro" },
  { id: "u_rafa", username: "rafa", bio: "barzinho > balada", city: "São Paulo" },
  { id: "u_bia", username: "bia", bio: "hidratada sempre 💧", city: "Belo Horizonte" },
  { id: "u_caio", username: "caio", bio: "modo lendário", city: "Curitiba" },
  { id: "u_mari", username: "mari", bio: "vinho e conversa", city: "Porto Alegre" },
  { id: "u_dudu", username: "dudu", bio: "track every roll", city: "Florianópolis" },
  { id: "u_juju", username: "juju", bio: "saideira nunca é a última", city: "Recife" },
];

export function getAllUsers(me?: PublicUser | null): PublicUser[] {
  const list = [...PUBLIC_USERS];
  if (me && !list.some((u) => u.id === me.id)) list.unshift(me);
  return list;
}
export function findUser(id: string, me?: PublicUser | null): PublicUser | undefined {
  return getAllUsers(me).find((u) => u.id === id);
}
export function searchUsers(q: string, me?: PublicUser | null): PublicUser[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return getAllUsers(me).filter(
    (u) => u.username.toLowerCase().includes(t) || u.bio.toLowerCase().includes(t),
  );
}

// ============= Friendships (local mock — Phase 3 will replace) =============
const KEY_FRIENDS = "destrava.friends";
const KEY_REQUESTS_OUT = "destrava.requests.out";
const KEY_REQUESTS_IN = "destrava.requests.in";

function readSet(key: string): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function writeSet(key: string, arr: string[]) {
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(arr))));
}

export function getFriends(): string[] { return readSet(KEY_FRIENDS); }
export function getOutgoingRequests(): string[] { return readSet(KEY_REQUESTS_OUT); }
export function getIncomingRequests(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY_REQUESTS_IN);
  if (raw === null) {
    const seed = ["u_bia", "u_dudu"];
    writeSet(KEY_REQUESTS_IN, seed);
    return seed;
  }
  return readSet(KEY_REQUESTS_IN);
}

export function friendshipStatus(id: string, meId?: string | null): "self" | "friends" | "outgoing" | "incoming" | "none" {
  if (meId && meId === id) return "self";
  if (getFriends().includes(id)) return "friends";
  if (getOutgoingRequests().includes(id)) return "outgoing";
  if (getIncomingRequests().includes(id)) return "incoming";
  return "none";
}

export function sendFriendRequest(id: string) {
  writeSet(KEY_REQUESTS_OUT, [...getOutgoingRequests(), id]);
}
export function cancelFriendRequest(id: string) {
  writeSet(KEY_REQUESTS_OUT, getOutgoingRequests().filter((x) => x !== id));
}
export function acceptFriendRequest(id: string) {
  writeSet(KEY_REQUESTS_IN, getIncomingRequests().filter((x) => x !== id));
  writeSet(KEY_FRIENDS, [...getFriends(), id]);
}
export function declineFriendRequest(id: string) {
  writeSet(KEY_REQUESTS_IN, getIncomingRequests().filter((x) => x !== id));
}
export function removeFriend(id: string) {
  writeSet(KEY_FRIENDS, getFriends().filter((x) => x !== id));
}

// ============= Rankings =============
export type RankRow = { user: PublicUser; value: number; label: string };
export type RankCategory = "nights" | "hydration" | "explorer" | "survivor" | "badges";

export const RANK_META: Record<RankCategory, { title: string; emoji: string; sub: string; unit: (v: number) => string }> = {
  nights:    { title: "Mais noites registradas",     emoji: "🌙", sub: "quem tá vivendo a noite",       unit: (v) => `${v} noites` },
  hydration: { title: "Hidratação suprema",          emoji: "💧", sub: "os mais responsa da gangue",    unit: (v) => `${(v / 1000).toFixed(1)}L` },
  explorer:  { title: "Exploradores da cidade",      emoji: "🗺️", sub: "mais lugares diferentes",       unit: (v) => `${v} lugares` },
  survivor:  { title: "Sobreviventes do amanhecer",  emoji: "🌅", sub: "noite mais longa registrada",   unit: (v) => `${v.toFixed(1)}h` },
  badges:    { title: "Caçadores de badges",         emoji: "🏆", sub: "colecionadores oficiais",       unit: (v) => `${v} badges` },
};

function statsForUser(userId: string, nights: Night[]) {
  const ns = nights.filter((n) => n.userId === userId);
  const totalNights = ns.length;
  const totalHydration = ns.reduce((a, n) => a + (n.hydrationMl || 0), 0);
  const venues = new Set(ns.flatMap((n) => n.venues.map((v) => v.name))).size;
  const badges = ns.flatMap(computeBadges).length;
  const longest = Math.max(
    0,
    ...ns.map(
      (n) => (new Date(n.endedAt ?? n.startedAt).getTime() - new Date(n.startedAt).getTime()) / 3600000,
    ),
  );
  return { totalNights, totalHydration, venues, badges, longest };
}

export function computeRanking(cat: RankCategory, nights: Night[], me?: PublicUser | null): RankRow[] {
  const users = getAllUsers(me);
  const rows: RankRow[] = users.map((u) => {
    const s = statsForUser(u.id, nights);
    let value = 0;
    switch (cat) {
      case "nights":    value = s.totalNights; break;
      case "hydration": value = s.totalHydration; break;
      case "explorer":  value = s.venues; break;
      case "survivor":  value = s.longest; break;
      case "badges":    value = s.badges; break;
    }
    return { user: u, value, label: RANK_META[cat].unit(value) };
  });
  return rows
    .map((r) => {
      if (r.value > 0) return r;
      const seed = r.user.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      let fake = (seed % 7) + 1;
      if (cat === "hydration") fake = 1500 + (seed % 9) * 250;
      if (cat === "survivor")  fake = 4 + (seed % 7);
      return { ...r, value: fake, label: RANK_META[cat].unit(fake) };
    })
    .sort((a, b) => b.value - a.value);
}
