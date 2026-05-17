import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/lib/social-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notificações — Destrava" }] }),
  component: Notifications,
});

const ICONS = {
  like: Heart,
  comment: MessageCircle,
  friend_request: UserPlus,
  friend_accept: UserCheck,
} as const;

const LABELS = {
  like: "curtiu sua noite",
  comment: "comentou na sua noite",
  friend_request: "te enviou um pedido de amizade",
  friend_accept: "aceitou seu pedido de amizade",
} as const;

function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(setItems);
    markAllNotificationsRead(user.id);
  }, [user]);

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-center gap-2">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-display font-bold">Notificações</h1>
      </header>

      {items.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
          sem novidades por aqui ainda
        </div>
      ) : (
        <section className="glass rounded-3xl p-2">
          {items.map((n) => {
            const Icon = ICONS[n.type];
            const inner = (
              <div className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${n.read ? "" : "bg-primary/10"} hover:bg-secondary/60`}>
                <div className="h-10 w-10 rounded-full bg-gradient-neon grid place-items-center font-bold overflow-hidden shrink-0">
                  {n.actor?.photo_url
                    ? <img src={n.actor.photo_url} alt="" className="h-full w-full object-cover" />
                    : (n.actor?.username ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-semibold">@{n.actor?.username ?? "alguém"}</span>{" "}
                    <span className="text-muted-foreground">{LABELS[n.type]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <Icon className="h-4 w-4 text-primary shrink-0" />
              </div>
            );
            if (n.night_id) {
              return <Link to="/night/$id" params={{ id: n.night_id }} key={n.id}>{inner}</Link>;
            }
            if (n.actor_id) {
              return <Link to="/u/$id" params={{ id: n.actor_id }} key={n.id}>{inner}</Link>;
            }
            return <div key={n.id}>{inner}</div>;
          })}
        </section>
      )}
    </div>
  );
}
