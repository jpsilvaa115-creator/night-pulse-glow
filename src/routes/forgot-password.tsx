import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha — Destrava" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[120px] animate-float" />
      </div>
      <div className="container mx-auto px-6 py-10 max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 mb-8 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> voltar
        </Link>
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-neon grid place-items-center glow-neon">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl">Recuperar senha</h1>
          </div>

          {sent ? (
            <div className="text-sm">
              <p className="text-success mb-2">📨 Email enviado!</p>
              <p className="text-muted-foreground">
                Confira sua caixa de entrada (e o spam) e clique no link para criar uma nova senha.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Digite o email da sua conta. Vamos te enviar um link para redefinir a senha.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  placeholder="voce@email.com"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-neon font-semibold glow-neon hover:scale-[1.02] transition-transform disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
