import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, UserCheck, UserX, Clock, Users } from "lucide-react";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  findUser,
  friendshipStatus,
  getAllUsers,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  getUser,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  type PublicUser,
} from "@/lib/destrava-store";

export const Route = createFileRoute("/_app/friends")({
  head: () => ({ meta: [{ title: "Amigos — Destrava" }] }),
  component: Friends,
});

function Friends() {
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => { setMeId(getUser()?.id ?? null); }, []);

  const refresh = () => setTick((t) => t + 1);

  const friends = useMemo(() => getFriends().map(findUser).filter(Boolean) as PublicUser[], [tick]);
  const incoming = useMemo(() => getIncomingRequests().map(findUser).filter(Boolean) as PublicUser[], [tick]);
  const outgoing = useMemo(() => getOutgoingRequests().map(findUser).filter(Boolean) as PublicUser[], [tick]);
  const results = useMemo(() => (q ? searchUsers(q) : getAllUsers().filter((u) => u.id !== meId).slice(0, 8)), [q, meId, tick]);

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-display font-bold">Amigos</h1>
      </header>

      {/* Search */}
      <section className="glass rounded-3xl p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="buscar usuários por @ ou bio…"
            className="w-full bg-input rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <div className="mt-3 space-y-1">
          {results.length === 0 && q && (
            <p className="text-xs text-muted-foreground py-3 text-center">nenhum usuário encontrado</p>
          )}
          {results.map((u) => (
            <UserRow key={u.id} u={u} meId={meId} onChange={refresh} />
          ))}
        </div>
      </section>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section className="glass rounded-3xl p-4">
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Pedidos recebidos ({incoming.length})
          </h2>
          <div className="space-y-1">
            {incoming.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                <Link to="/u/$id" params={{ id: u.id }} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar u={u} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">@{u.username}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.bio}</div>
                  </div>
                </Link>
                <button
                  onClick={() => { acceptFriendRequest(u.id); refresh(); }}
                  className="px-3 py-1.5 rounded-lg bg-gradient-neon text-xs font-semibold"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => { declineFriendRequest(u.id); refresh(); }}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Recusar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <section className="glass rounded-3xl p-4">
          <h2 className="font-display font-bold text-lg mb-3">Pedidos enviados</h2>
          <div className="space-y-1">
            {outgoing.map((u) => (
              <UserRow key={u.id} u={u} meId={meId} onChange={refresh} />
            ))}
          </div>
        </section>
      )}

      {/* Friends */}
      <section className="glass rounded-3xl p-4">
        <h2 className="font-display font-bold text-lg mb-3">
          Seus amigos ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">
            ainda sem amigos por aqui — busca alguém ali em cima 👆
          </p>
        ) : (
          <div className="space-y-1">
            {friends.map((u) => (
              <UserRow key={u.id} u={u} meId={meId} onChange={refresh} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({ u }: { u: PublicUser }) {
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-neon grid place-items-center text-sm font-bold shrink-0">
      {u.username.slice(0, 1).toUpperCase()}
    </div>
  );
}

function UserRow({ u, meId, onChange }: { u: PublicUser; meId: string | null; onChange: () => void }) {
  const status = friendshipStatus(u.id);
  if (u.id === meId) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors">
      <Link to="/u/$id" params={{ id: u.id }} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar u={u} />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">@{u.username}</div>
          <div className="text-xs text-muted-foreground truncate">{u.bio}</div>
        </div>
      </Link>
      {status === "none" && (
        <button
          onClick={() => { sendFriendRequest(u.id); onChange(); }}
          className="px-3 py-1.5 rounded-lg bg-gradient-neon text-xs font-semibold flex items-center gap-1"
        >
          <UserPlus className="h-3.5 w-3.5" /> Adicionar
        </button>
      )}
      {status === "outgoing" && (
        <button
          onClick={() => { cancelFriendRequest(u.id); onChange(); }}
          className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Clock className="h-3.5 w-3.5" /> Pendente
        </button>
      )}
      {status === "incoming" && (
        <button
          onClick={() => { acceptFriendRequest(u.id); onChange(); }}
          className="px-3 py-1.5 rounded-lg bg-gradient-neon text-xs font-semibold"
        >
          Aceitar
        </button>
      )}
      {status === "friends" && (
        <button
          onClick={() => { removeFriend(u.id); onChange(); }}
          className="px-3 py-1.5 rounded-lg bg-success/20 text-xs font-semibold text-success flex items-center gap-1 hover:bg-destructive/20 hover:text-destructive group"
        >
          <UserCheck className="h-3.5 w-3.5 group-hover:hidden" />
          <UserX className="h-3.5 w-3.5 hidden group-hover:block" />
          <span className="group-hover:hidden">Amigos</span>
          <span className="hidden group-hover:inline">Remover</span>
        </button>
      )}
    </div>
  );
}
