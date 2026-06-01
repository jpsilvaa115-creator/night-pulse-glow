// Backend-backed API for nights, drinks, venues and photos.
// Uses the browser Supabase client; RLS enforces ownership.
import { supabase } from "@/integrations/supabase/client";
import type { Night, Drink } from "./destrava-store";

type DrinkRow = { id: string; type: string; amount_ml: number; abv: number | string; time: string };
type VenueRow = { name: string; time: string };
type NightRow = {
  id: string;
  user_id: string;
  title: string;
  city: string;
  neighborhood: string;
  vibe: "chill" | "social" | "lendaria" | "after";
  hydration_ml: number;
  started_at: string;
  ended_at: string | null;
  photo_url: string | null;
  likes_count: number;
  drinks: DrinkRow[] | null;
  night_venues: VenueRow[] | null;
};

const SELECT =
  "id, user_id, title, city, neighborhood, vibe, hydration_ml, started_at, ended_at, photo_url, likes_count, drinks(id, type, amount_ml, abv, time), night_venues(name, time)";

function mapRow(r: NightRow): Night {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    city: r.city,
    neighborhood: r.neighborhood,
    venues: (r.night_venues ?? []).map((v) => ({ name: v.name, time: v.time })),
    drinks: (r.drinks ?? []).map((d) => ({
      id: d.id,
      type: d.type,
      amountMl: d.amount_ml,
      abv: Number(d.abv),
      time: d.time,
    })),
    hydrationMl: r.hydration_ml,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    photoDataUrl: r.photo_url ?? undefined,
    vibe: r.vibe,
    likes: r.likes_count,
    comments: [],
  };
}

export async function fetchAllNights(): Promise<Night[]> {
  const { data, error } = await supabase
    .from("nights")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchAllNights", error);
    return [];
  }
  return (data as unknown as NightRow[]).map(mapRow);
}

export async function fetchNightsByUser(userId: string): Promise<Night[]> {
  const { data, error } = await supabase
    .from("nights")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchNightsByUser", error);
    return [];
  }
  return (data as unknown as NightRow[]).map(mapRow);
}

export async function fetchNight(id: string): Promise<Night | null> {
  const { data, error } = await supabase
    .from("nights")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as unknown as NightRow);
}

export async function addHydration(nightId: string, ml: number): Promise<number> {
  const { data: cur } = await supabase
    .from("nights")
    .select("hydration_ml")
    .eq("id", nightId)
    .maybeSingle();
  const next = (cur?.hydration_ml ?? 0) + ml;
  await supabase.from("nights").update({ hydration_ml: next }).eq("id", nightId);
  return next;
}

export async function updateNightTimes(
  nightId: string,
  startedAt: string,
  endedAt: string | null,
): Promise<boolean> {
  const { error } = await supabase
    .from("nights")
    .update({ started_at: startedAt, ended_at: endedAt })
    .eq("id", nightId);
  if (error) { console.error("updateNightTimes", error); return false; }
  return true;
}

export async function deleteNight(nightId: string): Promise<boolean> {
  await supabase.from("drinks").delete().eq("night_id", nightId);
  await supabase.from("night_venues").delete().eq("night_id", nightId);
  await supabase.from("comments").delete().eq("night_id", nightId);
  await supabase.from("likes").delete().eq("night_id", nightId);
  const { error } = await supabase.from("nights").delete().eq("id", nightId);
  if (error) { console.error("deleteNight", error); return false; }
  return true;
}

// Likes are owned by social-api.ts (Phase 3): `toggleLike(meId, nightId, liked)`.

export type CreateNightInput = {
  title: string;
  city: string;
  vibe: "chill" | "social" | "lendaria" | "after";
  venue?: string;
  drinks: Drink[];
  photoFile?: File | null;
};

export async function createNight(
  userId: string,
  input: CreateNightInput,
): Promise<string | null> {
  let photoUrl: string | null = null;
  if (input.photoFile) {
    const ext = (input.photoFile.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("night-photos")
      .upload(path, input.photoFile, {
        contentType: input.photoFile.type || "image/jpeg",
        upsert: false,
      });
    if (upErr) {
      console.error("upload photo", upErr);
    } else {
      photoUrl = supabase.storage.from("night-photos").getPublicUrl(path).data.publicUrl;
    }
  }

  const startedAt = input.drinks[0]?.time ?? new Date().toISOString();
  const endedAt = new Date().toISOString();

  const { data: nightRow, error } = await supabase
    .from("nights")
    .insert({
      user_id: userId,
      title: input.title || "Minha noite",
      city: input.city || "",
      neighborhood: "",
      vibe: input.vibe,
      hydration_ml: 0,
      started_at: startedAt,
      ended_at: endedAt,
      photo_url: photoUrl,
    })
    .select("id")
    .single();

  if (error || !nightRow) {
    console.error("createNight", error);
    return null;
  }
  const nightId = nightRow.id;

  if (input.drinks.length) {
    const { error: dErr } = await supabase.from("drinks").insert(
      input.drinks.map((d) => ({
        night_id: nightId,
        type: d.type,
        amount_ml: d.amountMl,
        abv: d.abv,
        time: d.time,
      })),
    );
    if (dErr) console.error("insert drinks", dErr);
  }
  if (input.venue && input.venue.trim()) {
    const { error: vErr } = await supabase.from("night_venues").insert({
      night_id: nightId,
      name: input.venue.trim(),
      time: startedAt,
    });
    if (vErr) console.error("insert venue", vErr);
  }
  return nightId;
}
