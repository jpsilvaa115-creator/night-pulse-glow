import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, MapPin, Camera } from "lucide-react";
import { DRINK_PRESETS, saveNight, getUser, type Drink } from "@/lib/destrava-store";

export const Route = createFileRoute("/_app/new-night")({
  head: () => ({ meta: [{ title: "Nova noite — Destrava" }] }),
  component: NewNight,
});

function NewNight() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [venue, setVenue] = useState("");
  const [vibe, setVibe] = useState<"chill"|"social"|"lendaria"|"after">("social");
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [photoDataUrl, setPhoto] = useState<string|undefined>();

  const addDrink = (preset: typeof DRINK_PRESETS[number]) => {
    setDrinks((d) => [...d, {
      id: "d_" + Math.random().toString(36).slice(2,7),
      type: preset.label, abv: preset.abv, amountMl: preset.defaultMl,
      time: new Date().toISOString(),
    }]);
  };
  const removeDrink = (id: string) => setDrinks((d) => d.filter(x => x.id !== id));

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const finish = () => {
    const user = getUser();
    if (!user) return;
    const id = "n_" + Math.random().toString(36).slice(2, 8);
    saveNight({
      id,
      userId: user.id,
      title: title || "Minha noite",
      city: city || "Cidade",
      neighborhood: neighborhood || "—",
      venues: venue ? [{ name: venue, time: new Date().toISOString() }] : [],
      drinks,
      hydrationMl: 0,
      startedAt: drinks[0]?.time ?? new Date().toISOString(),
      endedAt: new Date().toISOString(),
      photoDataUrl,
      vibe,
      likes: 0,
      comments: [],
    });
    navigate({ to: "/night/$id", params: { id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-3xl font-display font-bold">Nova noite</h1>
        <p className="text-sm text-muted-foreground mt-1">Registre seu rolê — sem julgamento, com responsa.</p>
      </div>

      <section className="glass rounded-3xl p-6 space-y-4">
        <Field label="Título da noite">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Sexta na Vila"
            className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade"><input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="São Paulo"
            className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></Field>
          <Field label="Bairro"><input value={neighborhood} onChange={(e)=>setNeighborhood(e.target.value)} placeholder="Vila Madalena"
            className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></Field>
        </div>
        <Field label="Local / bar / balada">
          <div className="relative">
            <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={venue} onChange={(e)=>setVenue(e.target.value)} placeholder="Bar Astor"
              className="w-full bg-input rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </Field>

        <Field label="Vibe">
          <div className="grid grid-cols-4 gap-2">
            {(["chill","social","lendaria","after"] as const).map((v) => (
              <button key={v} onClick={()=>setVibe(v)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  vibe === v ? "bg-gradient-neon glow-neon" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>{v}</button>
            ))}
          </div>
        </Field>

        <Field label="Foto da noite (opcional)">
          <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-border bg-secondary/40 cursor-pointer hover:border-primary transition-colors">
            <Camera className="h-5 w-5" />
            <span className="text-sm">{photoDataUrl ? "Foto adicionada — trocar" : "Adicionar foto"}</span>
            <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </label>
          {photoDataUrl && <img src={photoDataUrl} alt="" className="mt-3 rounded-xl w-full max-h-64 object-cover" />}
        </Field>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">Bebidas</h2>
          <span className="text-xs text-muted-foreground">{drinks.length} adicionadas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {DRINK_PRESETS.map((p) => (
            <button key={p.label} onClick={()=>addDrink(p)}
              className="px-3 py-3 rounded-xl bg-secondary hover:bg-primary/20 hover:border-primary border border-transparent text-sm font-medium transition-all flex items-center justify-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {drinks.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60">
              <div className="h-8 w-8 rounded-lg bg-gradient-neon grid place-items-center text-xs font-bold">{i+1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{d.type}</div>
                <div className="text-xs text-muted-foreground">{d.amountMl}ml · {Math.round(d.abv*100)}%</div>
              </div>
              <input type="number" value={d.amountMl} min={10}
                onChange={(e)=>setDrinks(prev=>prev.map(x=>x.id===d.id?{...x, amountMl: parseInt(e.target.value)||0}:x))}
                className="w-20 bg-input rounded-lg px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={()=>removeDrink(d.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <button onClick={finish} disabled={drinks.length === 0}
        className="w-full px-6 py-4 rounded-2xl bg-gradient-neon font-semibold glow-neon disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform">
        Finalizar e ver resumo
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">{label}</span>
      {children}
    </label>
  );
}
