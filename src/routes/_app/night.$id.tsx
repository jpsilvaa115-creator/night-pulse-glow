import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplet, Clock, MapPin, AlertTriangle, Share2, Sparkles, LogIn, LogOut, Moon, Heart, MessageCircle, Send, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  intensity, recommendedWaterMl, estimateBAC,
  computeBadges, pureAlcoholG, recommendedRestH, type Night,
} from "@/lib/destrava-store";
import { fetchNight, addHydration, updateNightTimes, deleteNight } from "@/lib/nights-api";
import { toLocalInput, fromLocalInput } from "./new-night";
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchMyLikedNightIds,
  toggleLike,
  type CommentRow,
} from "@/lib/social-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/night/$id")({
  head: () => ({ meta: [{ title: "Resumo da noite — Destrava" }] }),
  component: NightSummary,
  notFoundComponent: () => <NotFound />,
});

function NotFound() {
  return (
    <div className="p-10 text-center">
      <p className="text-muted-foreground">Noite não encontrada.</p>
      <Link to="/feed" className="text-primary mt-3 inline-block">Voltar ao feed</Link>
    </div>
  );
}

function NightSummary() {
  const { id } = useParams({ from: "/_app/night/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [night, setNight] = useState<Night | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editingTimes, setEditingTimes] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [savingTimes, setSavingTimes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, cs] = await Promise.all([fetchNight(id), fetchComments(id)]);
      if (cancelled) return;
      setNight(n);
      setComments(cs);
      setLoading(false);
      if (user) {
        const s = await fetchMyLikedNightIds(user.id);
        if (!cancelled) setLiked(s.has(id));
      }
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  const handleLike = async () => {
    if (!user || !night) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setNight({ ...night, likes: night.likes + (wasLiked ? -1 : 1) });
    await toggleLike(user.id, id, wasLiked);
  };

  const handleComment = async () => {
    if (!user || !newComment.trim() || posting) return;
    setPosting(true);
    const c = await addComment(user.id, id, newComment);
    if (c) {
      setComments((prev) => [...prev, c]);
      setNewComment("");
    }
    setPosting(false);
  };

  const handleDeleteComment = async (cid: string) => {
    await deleteComment(cid);
    setComments((prev) => prev.filter((c) => c.id !== cid));
  };

  const startEditTimes = () => {
    if (!night) return;
    setEditStart(toLocalInput(new Date(night.startedAt)));
    setEditEnd(toLocalInput(new Date(night.endedAt ?? Date.now())));
    setEditingTimes(true);
  };

  const saveTimes = async () => {
    if (!night) return;
    const sISO = fromLocalInput(editStart);
    const eISO = fromLocalInput(editEnd);
    if (new Date(eISO).getTime() < new Date(sISO).getTime()) {
      toast.error("A saída deve ser depois da chegada");
      return;
    }
    setSavingTimes(true);
    const ok = await updateNightTimes(night.id, sISO, eISO);
    setSavingTimes(false);
    if (!ok) { toast.error("Não foi possível atualizar"); return; }
    setNight({ ...night, startedAt: sISO, endedAt: eISO });
    setEditingTimes(false);
    toast.success("Horários atualizados");
  };

  const handleDeleteNight = async () => {
    if (!night) return;
    if (!confirm("Apagar esta noite? Essa ação não pode ser desfeita.")) return;
    setDeleting(true);
    const ok = await deleteNight(night.id);
    setDeleting(false);
    if (!ok) { toast.error("Não foi possível apagar"); return; }
    toast.success("Noite apagada");
    navigate({ to: "/feed" });
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <div className="glass rounded-3xl h-64 animate-pulse" />
      </div>
    );
  }
  if (!night) return <NotFound />;

  const ints = intensity(night.drinks);
  const water = recommendedWaterMl(night.drinks);
  const bac = estimateBAC(night.drinks);
  const badges = computeBadges(night);
  const totalAlcoholG = night.drinks.reduce((a, d) => a + pureAlcoholG(d), 0);
  const hydrationPct = Math.min(100, Math.round((night.hydrationMl / water) * 100));

  const drink250 = async () => {
    const next = await addHydration(night.id, 250);
    setNight({ ...night, hydrationMl: next });
  };

  const start = new Date(night.startedAt).getTime();
  const end = new Date(night.endedAt ?? Date.now()).getTime();
  const hours = Math.max(1, Math.round((end - start) / 3600000));
  const metabolizeH = Math.ceil(totalAlcoholG / 8);
  const restH = recommendedRestH(night.drinks);

  const events = [
    ...night.drinks.map((d) => ({ time: d.time, label: d.type, kind: "drink" as const })),
    ...night.venues.map((v) => ({ time: v.time, label: `📍 ${v.name}`, kind: "venue" as const })),
  ].sort((a, b) => +new Date(a.time) - +new Date(b.time));

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <section className="relative rounded-3xl overflow-hidden p-8 text-center bg-gradient-to-br from-primary via-accent to-background animate-fade-up">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 h-40 w-40 rounded-full bg-cyan blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-neon blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="relative">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-semibold mb-3 text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> Resumo da noite
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold leading-tight">{night.title}</h1>
          <p className="text-sm text-white/80 mt-2 flex items-center justify-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {night.city}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="glass rounded-2xl py-3 px-3 flex items-center gap-2 justify-center">
              <LogIn className="h-4 w-4 text-cyan" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-white/70">Chegada</div>
                <div className="text-sm font-mono font-bold">{new Date(night.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
            <div className="glass rounded-2xl py-3 px-3 flex items-center gap-2 justify-center">
              <LogOut className="h-4 w-4 text-neon" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-white/70">Saída</div>
                <div className="text-sm font-mono font-bold">{night.endedAt ? new Date(night.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-7">
            <Hero label="Duração" value={`${hours}h`} />
            <Hero label="Drinks" value={night.drinks.length} />
            <Hero label="Intensidade" value={ints.label} />
          </div>
          <button className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-sm font-semibold hover:scale-105 transition">
            <Share2 className="h-4 w-4" /> Compartilhar
          </button>
        </div>
      </section>

      {user?.id === night.userId && (
        <section className="glass rounded-3xl p-5">
          {!editingTimes ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-display font-bold text-sm">Gerenciar noite</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Edite os horários ou apague o post.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={startEditTimes}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-sm font-semibold hover:bg-primary/20 transition">
                  <Pencil className="h-3.5 w-3.5" /> Editar horários
                </button>
                <button onClick={handleDeleteNight} disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/15 border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/25 transition disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Apagando…" : "Apagar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Chegada</span>
                  <input type="datetime-local" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                    className="mt-1 w-full bg-input rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Saída</span>
                  <input type="datetime-local" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                    className="mt-1 w-full bg-input rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingTimes(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-sm font-semibold">
                  <X className="h-3.5 w-3.5" /> Cancelar
                </button>
                <button onClick={saveTimes} disabled={savingTimes}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-neon text-sm font-semibold glow-neon disabled:opacity-50">
                  <Check className="h-3.5 w-3.5" /> {savingTimes ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}


      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold">Intensidade da noite</h3>
          <span className="text-sm font-mono" style={{ color: ints.color }}>{ints.pct}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${ints.pct}%`, background: `linear-gradient(90deg, var(--success), var(--cyan), var(--warning), var(--destructive))` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 uppercase">
          <span>leve</span><span>social</span><span>intenso</span><span>cuidado</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <Mini label="Álcool puro" value={`${Math.round(totalAlcoholG)}g`} />
          <Mini label="BAC estimado" value={`${bac.toFixed(2)}‰`} />
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-cyan" />
            <h3 className="font-display font-bold">Hidratação</h3>
          </div>
          <span className="text-sm text-muted-foreground">{night.hydrationMl} / {water} ml</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="h-full bg-cyan rounded-full glow-cyan transition-all" style={{ width: `${hydrationPct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          💧 Recomendado: <strong className="text-foreground">{(water / 1000).toFixed(1)}L</strong> — pequenas pausas ajudam.
        </p>
        <button onClick={drink250} className="w-full px-4 py-3 rounded-xl bg-cyan/20 border border-cyan/40 text-cyan font-semibold hover:bg-cyan/30 transition-colors">
          + 250ml — Já bebi água
        </button>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold">Tempo de descanso recomendado</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Mini label="Descanso ideal" value={`${restH}h`} />
          <Mini label="Metabolizar álcool" value={`${metabolizeH}h`} />
          <Mini label="Acordar a partir de" value={new Date(Date.now() + restH * 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Sono reparador acelera a recuperação. Evite cafeína nas próximas horas e priorize um ambiente escuro e silencioso.
        </p>
      </section>

      {ints.pct > 60 && (
        <section className="rounded-3xl p-5 border border-warning/40 bg-warning/10 flex gap-3 animate-fade-up">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-warning">Nível elevado de álcool detectado.</p>
            <p className="text-muted-foreground mt-1">
              Considere beber água e fazer uma pausa. Seu corpo pode levar cerca de <strong>{metabolizeH}h</strong> para metabolizar. Não dirija.
            </p>
          </div>
        </section>
      )}

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold">Timeline da noite</h3>
        </div>
        <div className="space-y-3 relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
          {events.map((e, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div className={`h-10 w-10 rounded-full grid place-items-center text-xs font-mono shrink-0 z-10 ${
                e.kind === "drink" ? "bg-gradient-neon" : "bg-secondary border border-border"
              }`}>
                {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex-1 pt-2 text-sm">{e.label}</div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos ainda.</p>}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h3 className="font-display font-bold mb-3">Badges desbloqueadas</h3>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b} className="px-3 py-2 rounded-full bg-gradient-neon/20 border border-primary/30 text-sm font-medium">
              {b}
            </span>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center gap-5 pb-4 border-b border-border">
          <button
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-2 transition-colors ${liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            <span className="font-mono font-bold">{night.likes}</span>
          </button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
            <span className="font-mono font-bold">{comments.length}</span>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">
              ainda sem comentários — sê o primeiro 👇
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 group">
              <Link to="/u/$id" params={{ id: c.user_id }} className="h-9 w-9 rounded-full bg-gradient-neon grid place-items-center text-xs font-bold shrink-0 overflow-hidden">
                {c.profile?.photo_url
                  ? <img src={c.profile.photo_url} alt="" className="h-full w-full object-cover" />
                  : (c.profile?.username ?? "?").slice(0, 1).toUpperCase()}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <Link to="/u/$id" params={{ id: c.user_id }} className="text-sm font-semibold hover:underline">
                    @{c.profile?.username ?? "anon"}
                  </Link>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 break-words">{c.text}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition"
                  aria-label="Apagar comentário"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {user ? (
          <div className="mt-4 flex items-center gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
              placeholder="adiciona um comentário…"
              maxLength={500}
              className="flex-1 bg-input rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim() || posting}
              className="h-10 w-10 rounded-xl bg-gradient-neon grid place-items-center disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center mt-4">
            <Link to="/login" className="text-primary hover:underline">entra</Link> pra comentar
          </p>
        )}
      </section>
    </div>
  );
}

function Hero({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass rounded-2xl py-3 px-2">
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/70 mt-1">{label}</div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-display font-bold mt-0.5">{value}</div>
    </div>
  );
}
