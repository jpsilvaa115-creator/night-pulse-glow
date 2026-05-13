import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, Home, BarChart3, Plus, User, MapPin, LogOut, Sparkles } from "lucide-react";
import { getUser, logout } from "@/lib/destrava-store";

const NAV = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/new-night", label: "Nova noite", icon: Plus, accent: true },
  { to: "/map", label: "Mapa", icon: MapPin },
  { to: "/profile", label: "Perfil", icon: User },
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = typeof window !== "undefined" ? getUser() : null;

  useEffect(() => { setOpen(false); }, [path]);

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r border-border transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="h-10 w-10 rounded-xl bg-gradient-neon grid place-items-center glow-neon">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">Destrava</div>
            <div className="text-xs text-muted-foreground mt-1">tracker da sua noite</div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-neon text-white glow-neon"
                    : item.accent
                    ? "border border-primary/40 text-primary hover:bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-neon grid place-items-center text-sm font-bold">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">@{user.username}</div>
                <div className="text-xs text-muted-foreground truncate">{user.bio || "sem bio"}</div>
              </div>
              <button
                onClick={() => { logout(); navigate({ to: "/" }); }}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-up"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/feed" className="flex items-center gap-2">
                <span className="font-display font-bold text-xl text-gradient-neon">Destrava</span>
              </Link>
            </div>
            <Link
              to="/new-night"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-neon text-sm font-semibold glow-neon hover:scale-105 transition-transform"
            >
              <Plus className="h-4 w-4" /> Registrar noite
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
