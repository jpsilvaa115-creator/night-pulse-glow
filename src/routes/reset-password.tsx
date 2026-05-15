import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — Destrava" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: "/feed" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[120px] animate-float" />
      </div>
      <div className="container mx-auto px-6 py-10 max-w-md">
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-neon grid place-items-center glow-neon">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl">Nova senha</h1>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nova senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold glow-neon hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
