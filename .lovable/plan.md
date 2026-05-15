## Contexto honesto

Hoje o Destrava roda **100% no navegador** (localStorage). Não existe banco de dados, autenticação real, nem sessão de servidor. Para entregar o que você pediu — cadastro real, login persistente estilo Instagram, dados salvos de verdade, amizades funcionais, segurança — precisamos **ativar o Lovable Cloud** (banco PostgreSQL + auth gerenciado + storage de imagens).

Tudo isso em uma única mensagem é inviável (seriam ~40 arquivos novos, migrações de schema, refatoração de cada tela). Vou dividir em **4 fases** entregáveis. Cada fase deixa o app funcional ao final.

---

## Fase 1 — Fundação: Cloud + Auth real (esta mensagem)

1. **Ativar Lovable Cloud** (PostgreSQL + Auth + Storage).
2. Criar schema inicial:
   - `profiles` (id → auth.users, username, bio, photo_url, birth_year, created_at)
   - Trigger para auto-criar profile no signup
   - RLS: usuário só edita o próprio profile, profiles são públicos para leitura
3. **Auth real** com email/senha + Google:
   - `/login`, `/signup`, `/forgot-password`, `/reset-password`
   - Verificação obrigatória de idade (18+) no signup, salva em `birth_year`
   - Sessão persistente automática (Supabase já faz isso — usuário fica logado)
   - `onAuthStateChange` no root invalida cache ao logar/deslogar
4. Refatorar `_app.tsx` para usar sessão real (não mais `localStorage`).
5. Tela de perfil lê/edita `profiles` no banco.
6. Corrigir os erros de hidratação React #418 já reportados (causados por leitura de `localStorage` durante SSR).

**Resultado:** cadastro funcional, login persistente real, perfil salvo no banco.

---

## Fase 2 — Migrar dados core para o banco

- Tabelas: `nights`, `drinks`, `venues`, `night_photos` (com Storage para imagens)
- RLS: cada usuário só edita as próprias noites; feed mostra noites públicas
- Refatorar `destrava-store.ts` → server functions (`getNights`, `saveNight`, `getNight`)
- Upload real de foto da noite via Supabase Storage
- Migrar `dashboard`, `feed`, `new-night`, `night/$id` para usar dados reais
- Manter cálculos de álcool/hidratação/descanso (já estão corretos — Widmark)

---

## Fase 3 — Social real

- Tabelas: `friendships`, `likes`, `comments`, `notifications`
- RLS apropriadas (não vazar dados privados)
- Refatorar `friends`, `rankings`, `u/$id` para query real
- Curtidas e comentários no feed funcionando de verdade
- Notificações in-app

---

## Fase 4 — Polimento e publicação

- Mapa: melhorar zoom/pinch em mobile, loading states, fallback quando geocode falha
- Responsividade: revisar cada tela em 375px (iPhone SE) e 1440px
- Performance: lazy-load rotas pesadas, otimizar imagens
- SEO + meta tags por rota
- Empty states, loading skeletons, toasts de erro
- Revisão de segurança (RLS, validação Zod em todos os server functions)
- Pronto para publicar

---

## Detalhes técnicos (Fase 1)

- Stack já correta: TanStack Start + React 19 + Tailwind v4
- Auth: `supabase.auth.signUp/signInWithPassword` no cliente; `requireSupabaseAuth` middleware nos server functions
- `attachSupabaseAuth` em `src/start.ts` para anexar bearer token nas chamadas
- Migração SQL com `profiles` + função `handle_new_user()` + trigger `on_auth_user_created`
- `_app/profile.tsx` passa a usar `useQuery` com server function `getMyProfile`
- Login Google via broker `lovable.auth.signInWithOAuth("google", ...)` + `configure_social_auth`

---

## Confirmação

Posso começar pela **Fase 1 agora** (ativar Cloud + auth real + perfis no banco). As fases seguintes vêm em mensagens separadas conforme você for validando. Confirma?