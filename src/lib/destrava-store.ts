// Types and pure helpers for Destrava.
// All persistence (nights, profiles, social) lives in `nights-api.ts` / `social-api.ts`.

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
  // Widmark: BAC (g/L) = grams / (weight_kg * r) - eliminação * horas
  // 70kg, r=0.68 (homem médio), taxa real de eliminação ~0.12 g/L por hora
  const bac = totalG / (70 * 0.68) - 0.12 * hours;
  return Math.max(0, Math.round(bac * 100) / 100);
}

export function recommendedRestH(drinks: Drink[]) {
  const totalG = drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  // ~8g de álcool puro metabolizados por hora
  const metabolizeH = totalG / 8;
  return Math.max(6, Math.ceil(metabolizeH));
}

export function intensity(drinks: Drink[]): { pct: number; label: string; color: string } {
  const g = drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  // 100g de álcool puro = topo da escala (noite muito pesada)
  const pct = Math.min(100, Math.round((g / 100) * 100));
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

// ============= Rankings (pure compute over real profiles + nights) =============
import type { Profile } from "./social-api";

export type RankRow = { user: Profile; value: number; label: string };
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
  const totalHydration = ns.reduce((a, n) => a + (n.hydrationMl || 0), 0);
  const venues = new Set(ns.flatMap((n) => n.venues.map((v) => v.name))).size;
  const badges = ns.flatMap(computeBadges).length;
  const longest = Math.max(
    0,
    ...ns.map(
      (n) => (new Date(n.endedAt ?? n.startedAt).getTime() - new Date(n.startedAt).getTime()) / 3600000,
    ),
  );
  return { totalNights: ns.length, totalHydration, venues, badges, longest };
}

export function computeRanking(
  cat: RankCategory,
  nights: Night[],
  profiles: Profile[],
): RankRow[] {
  const rows: RankRow[] = profiles.map((u) => {
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
  return rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
}
