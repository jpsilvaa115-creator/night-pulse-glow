import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getUser, saveUser, getNights, computeBadges } from "@/lib/destrava-store";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Perfil — Destrava" }] }),
  component: Profile,
});

function Profile() {
  const [user, setUser] = useState(() => getUser());
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? "");
  const nights = getNights().filter((n) => n.userId === user?.id);
  const allBadges = Array.from(new Set(getNights().flatMap(computeBadges)));

  if (!user) return null;

  const save = () => {
    const u = { ...user, bio };
    saveUser(u); setUser(u); setEditing(false);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <section className="glass rounded-3xl p-6 text-center">
        <div className="h-24 w-24 mx-auto rounded-full bg-gradient-neon grid place-items-center text-3xl font-display font-bold glow-neon">
          {user.username.slice(0,1).toUpperCase()}
        </div>
        <h1 className="text-2xl font-display font-bold mt-4">@{user.username}</h1>
        {editing ? (
          <div className="mt-3">
            <textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={2}
              className="w-full bg-input rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm" />
            <div className="flex gap-2 mt-2 justify-center">
              <button onClick={save} className="px-4 py-2 rounded-lg bg-gradient-neon text-sm font-semibold">Salvar</button>
              <button onClick={()=>setEditing(false)} className="px-4 py-2 rounded-lg bg-secondary text-sm">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mt-2">{user.bio || "sem bio"}</p>
            <button onClick={()=>setEditing(true)} className="mt-3 text-xs text-primary hover:underline">Editar bio</button>
          </>
        )}

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Noites" value={nights.length} />
          <Stat label="Badges" value={allBadges.length} />
          <Stat label="Locais" value={new Set(nights.flatMap(n=>n.venues.map(v=>v.name))).size} />
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display font-bold text-lg mb-3">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {allBadges.length === 0 && <p className="text-sm text-muted-foreground">Crie sua primeira noite para desbloquear badges.</p>}
          {allBadges.map((b) => (
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
              <Link to="/night/$id" params={{id: n.id}} key={n.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <div className="h-10 w-10 rounded-lg bg-gradient-neon grid place-items-center font-bold">{n.title.slice(0,1)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.neighborhood} · {n.drinks.length} drinks</div>
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
