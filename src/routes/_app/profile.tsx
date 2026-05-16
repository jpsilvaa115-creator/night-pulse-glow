import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { computeBadges, type Night } from "@/lib/destrava-store";
import { fetchNightsByUser } from "@/lib/nights-api";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Profile = { username: string; bio: string };

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Perfil — Destrava" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [nights, setNights] = useState<Night[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from("profiles").select("username, bio").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setProfile(data);
        setBio(data.bio ?? "");
      });
    fetchNightsByUser(user.id).then((ns) => { if (!cancelled) setNights(ns); });
    return () => { cancelled = true; };
  }, [user]);

  const badges = Array.from(new Set(nights.flatMap(computeBadges)));

  const save = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ bio }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    setProfile({ ...profile, bio });
    setEditing(false);
    toast.success("Bio atualizada");
  };

  if (!user || !profile) {
    return (
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <div className="glass rounded-3xl h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <section className="glass rounded-3xl p-6 text-center">
        <div className="h-24 w-24 mx-auto rounded-full bg-gradient-neon grid place-items-center text-3xl font-display font-bold glow-neon">
          {profile.username.slice(0, 1).toUpperCase()}
        </div>
        <h1 className="text-2xl font-display font-bold mt-4">@{profile.username}</h1>
        {editing ? (
          <div className="mt-3">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
              className="w-full bg-input rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm" />
            <div className="flex gap-2 mt-2 justify-center">
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-neon text-sm font-semibold disabled:opacity-50">
                {saving ? "Salvando…" : "Salvar"}
              </button>
              <button onClick={() => { setEditing(false); setBio(profile.bio ?? ""); }} className="px-4 py-2 rounded-lg bg-secondary text-sm">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mt-2">{profile.bio || "sem bio"}</p>
            <button onClick={() => setEditing(true)} className="mt-3 text-xs text-primary hover:underline">Editar bio</button>
          </>
        )}

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Noites" value={nights.length} />
          <Stat label="Badges" value={badges.length} />
          <Stat label="Locais" value={new Set(nights.flatMap(n => n.venues.map(v => v.name))).size} />
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display font-bold text-lg mb-3">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {badges.length === 0 && <p className="text-sm text-muted-foreground">Crie sua primeira noite para desbloquear badges.</p>}
          {badges.map((b) => (
            <span key={b} className="px-3 py-2 rounded-full bg-gradient-neon/20 border border-primary/30 text-sm">{b}</span>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display font-bold text-lg mb-3">Suas noites</h2>
        {nights.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Nenhuma noite registrada ainda.</p>
            <Link to="/new-night" className="mt-3 inline-block px-4 py-2 rounded-xl bg-gradient-neon text-sm font-semibold">
              Registrar primeira noite
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {nights.map((n) => (
              <Link to="/night/$id" params={{ id: n.id }} key={n.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <div className="h-10 w-10 rounded-lg bg-gradient-neon grid place-items-center font-bold">{n.title.slice(0, 1)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.city} · {n.drinks.length} drinks</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
