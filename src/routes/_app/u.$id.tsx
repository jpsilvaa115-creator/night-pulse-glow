import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, UserPlus, UserCheck, UserX, Clock } from "lucide-react";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  computeBadges,
  declineFriendRequest,
  findUser,
  friendshipStatus,
  getNights,
  getUser,
  removeFriend,
  sendFriendRequest,
  type PublicUser,
} from "@/lib/destrava-store";

export const Route = createFileRoute("/_app/u/$id")({
  head: () => ({ meta: [{ title: "Perfil — Destrava" }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [u, setU] = useState<PublicUser | null>(null);
  const [tick, setTick] = useState(0);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    setU(findUser(id) ?? null);
    setMeId(getUser()?.id ?? null);
  }, [id, tick]);

  if (!u) {
    return (
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-10 text-center">
        <p className="text-muted-foreground">usuário não encontrado</p>
        <Link to="/friends" className="mt-3 inline-block text-primary text-sm hover:underline">voltar</Link>
      </div>
    );
  }

  const status = friendshipStatus(u.id);
  const isMe = status === "self";
  const nights = getNights().filter((n) => n.userId === u.id);
  const badges = Array.from(new Set(nights.flatMap(computeBadges)));
  const venues = new Set(nights.flatMap((n) => n.venues.map((v) => v.name))).size;

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <button onClick={() => navigate({ to: "/friends" })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> voltar
      </button>

      <section className="glass rounded-3xl p-6 text-center">
        <div className="h-24 w-24 mx-auto rounded-full bg-gradient-neon grid place-items-center text-3xl font-display font-bold glow-neon">
          {u.username.slice(0, 1).toUpperCase()}
        </div>
        <h1 className="text-2xl font-display font-bold mt-4">@{u.username}</h1>
        <p className="text-sm text-muted-foreground mt-1">{u.bio || "sem bio"}</p>
        {u.city && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" /> {u.city}
          </p>
        )}

        {!isMe && (
          <div className="mt-4 flex justify-center">
            {status === "none" && (
              <button onClick={() => { sendFriendRequest(u.id); refresh(); }} className="px-5 py-2.5 rounded-xl bg-gradient-neon font-semibold glow-neon flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Adicionar amigo
              </button>
            )}
            {status === "outgoing" && (
              <button onClick={() => { cancelFriendRequest(u.id); refresh(); }} className="px-5 py-2.5 rounded-xl bg-secondary font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pedido enviado
              </button>
            )}
            {status === "incoming" && (
              <div className="flex gap-2">
                <button onClick={() => { acceptFriendRequest(u.id); refresh(); }} className="px-5 py-2.5 rounded-xl bg-gradient-neon font-semibold">Aceitar pedido</button>
                <button onClick={() => { declineFriendRequest(u.id); refresh(); }} className="px-5 py-2.5 rounded-xl bg-secondary font-semibold text-muted-foreground">Recusar</button>
              </div>
            )}
            {status === "friends" && (
              <button onClick={() => { removeFriend(u.id); refresh(); }} className="px-5 py-2.5 rounded-xl bg-success/20 text-success font-semibold flex items-center gap-2 hover:bg-destructive/20 hover:text-destructive group">
                <UserCheck className="h-4 w-4 group-hover:hidden" />
                <UserX className="h-4 w-4 hidden group-hover:block" />
                <span className="group-hover:hidden">Amigos</span>
                <span className="hidden group-hover:inline">Remover amigo</span>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Noites" value={nights.length} />
          <Stat label="Badges" value={badges.length} />
          <Stat label="Locais" value={venues} />
        </div>
      </section>

      {badges.length > 0 && (
        <section className="glass rounded-3xl p-6">
          <h2 className="font-display font-bold text-lg mb-3">Conquistas</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b} className="px-3 py-2 rounded-full bg-gradient-neon/20 border border-primary/30 text-sm">{b}</span>
            ))}
          </div>
        </section>
      )}

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display font-bold text-lg mb-3">Noites públicas</h2>
        {nights.length === 0 ? (
          <p className="text-sm text-muted-foreground">esse usuário ainda não publicou noites</p>
        ) : (
          <div className="space-y-2">
            {nights.map((n) => (
              <Link to="/night/$id" params={{ id: n.id }} key={n.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <div className="h-10 w-10 rounded-lg bg-gradient-neon grid place-items-center font-bold">{n.title.slice(0, 1)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{n.city} · {n.drinks.length} drinks</div>
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
