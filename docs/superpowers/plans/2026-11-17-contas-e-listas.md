# Contas e Listas Pessoais — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Login com email e senha (Supabase); botões "Quero assistir" / "Já assisti" na página do filme; aba `/minhas-listas`; "Meus streamings" salvo na conta.

**Architecture:** `@supabase/ssr` com sessão em cookies: `src/proxy.ts` renova a sessão e as páginas e Server Actions leem o usuário com `supabase.auth.getUser()`. Duas tabelas com RLS (`movie_marks` e `user_settings`). O cookie `meus_streamings` continua sendo o que as prateleiras leem. A conta é a fonte da verdade e copia para o cookie no login.

**Tech Stack:** Next.js 16 (App Router, Server Actions, `proxy.ts`), TypeScript, `@supabase/supabase-js` + `@supabase/ssr`, Tailwind (tokens `sala/poltrona/cortina/texto/apagado/projetor/assina`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-17-contas-e-listas-design.md`

## Global Constraints

- Ler `node_modules/next/dist/docs/01-app/02-guides/authentication.md` e `01-getting-started/16-proxy.md` antes de codar (Next 16: `middleware` virou `proxy`, função exportada `proxy`).
- O site **nunca** exige login para navegar. Se as variáveis do Supabase não existirem, tudo funciona como hoje: usuário = `null`, proxy não faz nada, botões levam ao login.
- Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nenhuma `service_role` no app.
- Autorização sempre no servidor (`getUser()` nas actions e páginas), nunca só no proxy. RLS `user_id = auth.uid()` nas duas tabelas.
- Status de filme: `"quero"` | `"visto"`; um filme em no máximo uma lista (PK `(user_id, movie_id)`).
- Listas ordenadas por `updated_at desc`.
- Sem confirmação de email: `signUp` já devolve a sessão.
- Recuperação de senha: link `token_hash` → `/auth/confirm` → `verifyOtp` → `/redefinir-senha`.
- `?next=` aceito só se começar com `/` e não com `//` nem `/\`; senão `/`.
- Todos os textos em pt-BR; visual com os tokens de cor e `font-display` existentes.
- Componentes cliente não importam `src/lib/supabase/*` nem `src/lib/tmdb/*`; recebem actions por prop (padrão `load = loadCategoryPage` do `CategoryGrid`).

## Review Focus

1. **Sessão expirada com a página aberta** (aba antiga; `setMark` responde `reason: "auth"`) → o botão volta ao estado anterior e a pessoa vai para `/entrar?next=<página atual>`. *(Task 5)*
2. **`?next=` malicioso** (`//evil.com`, `https://evil.com`, `/\evil.com`, vazio) → redireciona para `/`. *(Task 1)*
3. **Dados adulterados vindos do navegador** (`movieId` -1, 2.5 ou "abc"; título vazio ou com mais de 300 caracteres; streamings `"<script>,p190"`) → `setMark` rejeita sem tocar no banco; `saveStreamings` grava só os ids válidos (`["p190"]`). *(Tasks 5, 7)*
4. **Erros de cadastro/login** (email já cadastrado, senha < 6, credenciais erradas, limite de tentativas) → mensagem em pt-BR e o email digitado continua no campo. *(Tasks 2, 3)*
5. **Link de recuperação expirado ou já usado** → `/entrar?erro=link` mostra "Esse link expirou ou já foi usado. Peça um novo." *(Task 3)*

---

### Task 1: Base do Supabase (cliente, proxy, banco) e regras puras

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/proxy.ts`, `src/lib/auth/next.ts`, `src/lib/account/streamings-sync.ts`, `supabase/migrations/20261117000000_contas_e_listas.sql`
- Modify: `package.json` (deps), `.env.example`, `README.md`
- Test: `tests/lib/auth/next.test.ts`, `tests/lib/account/streamings-sync.test.ts`

**Interfaces — Produces:**
- `isSupabaseConfigured(): boolean`: as duas variáveis estão definidas e não vazias.
- `createClient(): Promise<SupabaseClient>` (server.ts): `createServerClient` com `cookies()` do Next (`getAll`/`setAll`; o `setAll` ignora o erro quando chamado de Server Component). Lança erro se não estiver configurado.
- `getCurrentUser(): Promise<{ id: string; email: string } | null>` (server.ts): `null` se não estiver configurado, sem sessão ou se der erro.
- `safeNext(value: string | string[] | null | undefined): string` (`src/lib/auth/next.ts`)
- `resolveStreamingsOnLogin(account: string[] | null, device: string[]): { cookie: string[]; saveToAccount: string[] | null }` (`streamings-sync.ts`). Conta com itens → `{ cookie: account, saveToAccount: null }`. Conta `null`/vazia e aparelho com itens → `{ cookie: device, saveToAccount: device }`. Ambos vazios → `{ cookie: [], saveToAccount: null }`.

- [ ] **Step 1: Testes que falham**
  - `safeNext("/filme/1-x") === "/filme/1-x"`, `safeNext("/minhas-listas?lista=visto") === "/minhas-listas?lista=visto"`, `safeNext(["/a","/b"]) === "/a"`; `"/"` para `"//evil.com"`, `"https://evil.com"`, `"/\\evil.com"`, `""`, `undefined`, `null`, `"filme"`.
  - `resolveStreamingsOnLogin(["max"], ["netflix"])` → `{ cookie: ["max"], saveToAccount: null }`; `(null, ["netflix"])` e `([], ["netflix"])` → `{ cookie: ["netflix"], saveToAccount: ["netflix"] }`; `(null, [])` → `{ cookie: [], saveToAccount: null }`.
- [ ] **Step 2:** `npm test -- tests/lib/auth tests/lib/account` → FAIL (módulos inexistentes).
- [ ] **Step 3:** Implementar `next.ts` e `streamings-sync.ts`.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5: Infra.**
  - `npm install @supabase/supabase-js @supabase/ssr`.
  - `server.ts` conforme as interfaces.
  - `src/proxy.ts`: `export async function proxy(request)` segue o padrão `updateSession` do guia Next.js SSR do Supabase, que renova a sessão e repassa os cookies. Retorna `NextResponse.next()` cedo se `!isSupabaseConfigured()`. O `matcher` exclui `_next/static`, `_next/image`, `favicon.ico` e arquivos de imagem.
  - SQL da migração: as duas tabelas exatamente como em spec §7.1, mais `enable row level security` e políticas `select/insert/update/delete` com `auth.uid() = user_id` em cada tabela.
  - `.env.example` ganha as duas variáveis.
  - README, nova seção "Contas (Supabase)":
    1. criar o projeto e copiar URL e publishable key;
    2. colar o SQL da migração no SQL Editor;
    3. em Authentication → Sign In / Providers, deixar Email ligado e "Confirm email" desligado;
    4. em Authentication → URL Configuration, Site URL = domínio da Vercel e Redirect URLs com `http://localhost:3000/**` e o domínio;
    5. SMTP: Gmail com senha de app (verificação em 2 etapas → myaccount.google.com/apppasswords; host `smtp.gmail.com`, porta 465 ou 587, usuário = o Gmail);
    6. modelo "Reset Password" em pt-BR, com o link `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha`;
    7. variáveis na Vercel;
    8. o projeto gratuito pausa após ~1 semana sem uso (reativar no painel).
- [ ] **Step 6:** `npm test` e `npm run build` (sem as variáveis do Supabase no ambiente) → passam.
- [ ] **Step 7:** Commit `feat: base do Supabase (sessão, proxy, tabelas) e regras de login`

---

### Task 2: Ações de autenticação

**Files:** Create `src/app/entrar/actions.ts`, `src/lib/auth/messages.ts`, `src/lib/account/streamings-cookie.ts` · Test `tests/app/entrar-actions.test.ts`, `tests/lib/auth/messages.test.ts`

**Interfaces:**
- Consumes: `createClient`, `safeNext`, `resolveStreamingsOnLogin` (T1); `COOKIE_NAME`, `parseMyStreamings`, `serializeMyStreamings` (`src/lib/streamings.ts`); `siteUrl()` (`src/lib/site.ts`).
- Produces:
  - `type AuthState = { error?: string; info?: string; email?: string } | undefined`
  - `authErrorMessage(code: string | undefined): string`:
    - `invalid_credentials` → "Email ou senha incorretos."
    - `user_already_exists` / `email_exists` → "Já existe uma conta com esse email. Tente entrar."
    - `weak_password` → "A senha precisa ter pelo menos 6 caracteres."
    - `email_address_invalid` → "Esse email não parece válido."
    - `over_request_rate_limit` / `over_email_send_rate_limit` → "Muitas tentativas. Espere alguns minutos e tente de novo."
    - `same_password` → "A nova senha precisa ser diferente da atual."
    - qualquer outro → "Algo deu errado. Tente de novo."
  - `syncStreamingsAfterLogin(supabase: SupabaseClient, userId: string): Promise<void>` (`streamings-cookie.ts`): lê `user_settings.streamings` e o cookie, aplica `resolveStreamingsOnLogin`, faz upsert se `saveToAccount` vier preenchido e grava o cookie via `(await cookies()).set(COOKIE_NAME, serializeMyStreamings(ids), { path: "/", maxAge: 31536000, sameSite: "lax" })`. Confirmar no teste que o valor gravado, lido de volta por `parseMyStreamings`, dá os mesmos ids. Uma falha aqui **não** impede o login (captura e segue).
  - Actions para `useActionState(action, undefined)`. Todas recebem `(prev: AuthState, form: FormData)`:
    - `signIn` (campos `email`, `password`, `next`) → `signInWithPassword` → sync → `redirect(safeNext(next))`.
    - `signUp` (mesmos campos) → `auth.signUp` → sync → `redirect(safeNext(next))`.
    - `requestPasswordReset` (`email`) → `resetPasswordForEmail(email)`. Sempre devolve `{ info: "Se existir uma conta com esse email, enviamos um link para criar uma nova senha.", email }`, exceto em limite de tentativas, que devolve o erro.
    - `updatePassword` (`password`) → `auth.updateUser({ password })` → `redirect("/")`.
  - `signOut(): Promise<void>` → `auth.signOut()` → `redirect("/")`. O cookie de streamings fica.
  - Em erro, devolve `{ error: authErrorMessage(error.code), email }`.

- [ ] **Step 1: Testes que falham.** Simular `@/lib/supabase/server`, `next/headers` (cookie store em memória) e `next/navigation` (`redirect` lança um erro com a URL). Casos:
  - `authErrorMessage` para cada código acima e para um desconhecido.
  - `signIn` com credenciais erradas → `{ error: "Email ou senha incorretos.", email: "a@b.com" }`, sem redirect.
  - `signIn` ok com `next=//evil.com` → redirect para `/`. Com `next=/filme/1-x` → redirect para `/filme/1-x`.
  - `signUp` ok, conta sem streamings e cookie `netflix` → upsert de `{ user_id, streamings: ["netflix"] }` e cookie mantido.
  - `signIn` ok, conta com `["max"]` e cookie `netflix` → cookie vira `max`, sem upsert.
  - Falha ao ler `user_settings` → o login segue para o redirect.
  - `requestPasswordReset` para email inexistente → mesma mensagem `info`.
- [ ] **Step 2:** `npm test -- tests/app/entrar-actions.test.ts tests/lib/auth/messages.test.ts` → FAIL.
- [ ] **Step 3:** Implementar os três arquivos.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit `feat: ações de entrar, criar conta, sair e recuperar senha`

---

### Task 3: Telas de entrar e redefinir senha, e rota `/auth/confirm`

**Files:** Create `src/app/entrar/page.tsx`, `src/components/AuthForm.tsx`, `src/app/redefinir-senha/page.tsx`, `src/components/NewPasswordForm.tsx`, `src/app/auth/confirm/route.ts` · Test `tests/components/AuthForm.test.tsx`, `tests/app/auth-confirm.test.ts`

**Interfaces:**
- Consumes: actions e `AuthState` (T2); `getCurrentUser`, `createClient`, `safeNext` (T1).
- Produces:
  - `AuthForm({ next, initialError, signInAction, signUpAction, resetAction }: { next: string; initialError?: string; signInAction; signUpAction; resetAction })`, com três modos: `"entrar"` (padrão), `"criar"` e `"esqueci"`. Títulos e botões:
    - "Entrar" / "Entrar"
    - "Criar conta" / "Criar conta"
    - "Recuperar senha" / "Enviar link"
    - Links de troca: "Não tem conta? Criar conta", "Já tem conta? Entrar", "Esqueci minha senha".
    - Campo hidden `next`. O email usa `defaultValue={state?.email}`. A senha tem `minLength={6}` e `autoComplete` `current-password`/`new-password` conforme o modo.
    - Erro em `role="alert"`, info em `role="status"`. Botão desabilitado enquanto `pending`.
  - `/entrar` (server): se já logado → `redirect(safeNext(next))`. `?erro=link` → `initialError` "Esse link expirou ou já foi usado. Peça um novo."
  - `/redefinir-senha` (server): sem usuário → `redirect("/entrar?erro=link")`. Senão, `NewPasswordForm` (campo "Nova senha", botão "Salvar nova senha", usa `updatePassword`).
  - `GET /auth/confirm`: lê `token_hash`, `type` (aceita só `"recovery"` e `"email"`) e `next`. Chama `verifyOtp({ type, token_hash })`. Se der certo → redirect `safeNext(next)`. Faltando parâmetro, com tipo inválido ou com erro → redirect `/entrar?erro=link`.

- [ ] **Step 1: Testes que falham**
  - AuthForm: começa em "Entrar". Clicar "Não tem conta? Criar conta" troca o título e o botão. "Esqueci minha senha" esconde o campo de senha. O erro devolvido pela action aparece em `alert` e o email continua preenchido. `initialError` aparece. O hidden `next` tem o valor passado.
  - `/auth/confirm`: com token ok → redirect para `/redefinir-senha`. `verifyOtp` com erro → `/entrar?erro=link`. Sem `token_hash` → `/entrar?erro=link` sem chamar `verifyOtp`. `type=signup` → `/entrar?erro=link`. `next=//evil.com` → `/`.
- [ ] **Step 2:** `npm test -- tests/components/AuthForm.test.tsx tests/app/auth-confirm.test.ts` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit `feat: telas de entrar, criar conta e redefinir senha`

---

### Task 4: Cabeçalho com "Minhas listas" e conta

**Files:** Modify `src/components/SiteHeader.tsx`, `src/app/layout.tsx` · Test `tests/components/SiteHeader.test.tsx`

**Interfaces:**
- Consumes: `getCurrentUser` (T1), `signOut` (T2).
- Produces: `SiteHeader({ userEmail, signOutAction }: { userEmail: string | null; signOutAction: () => Promise<void> })`. O `layout.tsx` (já async) passa `(await getCurrentUser())?.email ?? null` e `signOut`.
  - `NAV` ganha `{ href: "/minhas-listas", label: "Minhas listas" }`.
  - Só no celular (`sm:hidden`), ao lado da lupa: link com ícone de lista, `aria-label="Minhas listas"`, para `/minhas-listas`.
  - Sem login: link "Entrar" para `/entrar`.
  - Logado: botão de conta (`aria-label="Conta"`, `aria-expanded`) que abre um menu com o email e um `<form action={signOutAction}>` com o botão "Sair". O menu fecha com Esc e com clique fora.

- [ ] **Step 1: Testes que falham** (simular `usePathname`):
  - Sem login → link "Entrar" com `href="/entrar"` e nenhum botão "Conta".
  - Logado → sem "Entrar". Clicar em "Conta" mostra o email e o botão "Sair".
  - Há dois links "Minhas listas" para `/minhas-listas` (texto e ícone).
  - Em `/minhas-listas`, o item de texto tem `aria-current="page"`.
- [ ] **Step 2:** `npm test -- tests/components/SiteHeader.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Mesmo comando → PASS; `npm test` inteiro → PASS.
- [ ] **Step 5:** Commit `feat: aba Minhas listas e menu de conta no cabeçalho`

---

### Task 5: Marcar filmes na página do filme

**Files:** Create `src/lib/marks.ts`, `src/lib/marks-rules.ts`, `src/app/filme/actions.ts`, `src/components/MarkButtons.tsx` · Modify `src/app/filme/[slug]/page.tsx` (bloco de botões, ~linha 92-109) · Test `tests/lib/marks-rules.test.ts`, `tests/app/filme-actions.test.ts`, `tests/components/MarkButtons.test.tsx`

**Interfaces:**
- Consumes: `createClient`, `getCurrentUser` (T1).
- Produces:
  - `marks-rules.ts` (puro, pode ser importado pelo cliente):
    - `type MarkStatus = "quero" | "visto"`
    - `type MarkMovie = { movieId: number; title: string; posterPath: string | null }`
    - `toggleStatus(current: MarkStatus | null, clicked: MarkStatus): MarkStatus | null`: mesmo status → `null`; senão → `clicked`.
    - `isValidMarkMovie(m: unknown): m is MarkMovie`: `movieId` inteiro > 0; `title` string com 1 a 300 caracteres; `posterPath` `null` ou string que começa com `/` e tem até 200 caracteres.
  - `marks.ts` (servidor):
    - `type Mark = MarkMovie & { status: MarkStatus; updatedAt: string }`
    - `getMarkStatus(movieId: number): Promise<MarkStatus | null>`: `null` sem login ou sem configuração.
    - `listMarks(): Promise<Mark[]>`: `updated_at desc`; `[]` sem login.
  - `setMark(movie: MarkMovie, status: MarkStatus | null): Promise<{ ok: true } | { ok: false; reason: "auth" | "invalid" | "error" }>` (`src/app/filme/actions.ts`, `"use server"`):
    - Valida com `isValidMarkMovie` e `status ∈ {quero, visto, null}`; se falhar → `invalid`.
    - Sem usuário → `auth`.
    - `status` não nulo → upsert `{ user_id, movie_id, status, title, poster_path, updated_at: now }`. `null` → delete.
    - Erro do banco → `error`.
  - `MarkButtons({ movie, initialStatus, loggedIn, loginHref, save = setMark })`:
    - Dois botões com `aria-pressed`: "Quero assistir" (ícone +) e "Já assisti" (ícone ✓).
    - Sem login → `router.push(loginHref)`.
    - Logado → atualização otimista com `toggleStatus`. Em `reason: "auth"` → reverte e `router.push(loginHref)`. Em outro erro → reverte e mostra "Não foi possível salvar. Tente de novo." em `role="alert"`.
    - Ignora cliques enquanto um salvamento está em andamento.
  - Página do filme: em paralelo com o que já carrega, busca `getCurrentUser()` e `getMarkStatus(movie.id)`. Renderiza `<MarkButtons>` entre o trailer e o `ShareButton`, com `loginHref = "/entrar?next=" + encodeURIComponent("/filme/" + slug)`.

- [ ] **Step 1: Testes que falham**
  - `toggleStatus`: `(null,"quero")→"quero"`, `("quero","quero")→null`, `("quero","visto")→"visto"`.
  - `isValidMarkMovie`: válido `{movieId:1,title:"X",posterPath:"/a.jpg"}`; inválidos com `movieId` -1, 2.5 ou "1"; `title` "" ou com 301 caracteres; `posterPath` "http://x".
  - `setMark` (simular o cliente Supabase): com dados inválidos → `{ok:false,reason:"invalid"}` e nenhuma chamada ao banco. Sem usuário → `auth`. `"visto"` → upsert com `user_id` do usuário. `null` → delete filtrado por `movie_id`. Erro do banco → `error`.
  - `MarkButtons`:
    - deslogado: clicar → `push(loginHref)` e `save` não é chamado;
    - logado: clicar em "Quero assistir" → `aria-pressed=true` antes do `save` resolver, e `save` chamado com `(movie, "quero")`;
    - com `initialStatus="quero"`, clicar em "Já assisti" → "Já assisti" pressionado e "Quero assistir" solto;
    - `save` → `{ok:false,reason:"error"}` → volta ao estado anterior e mostra o alerta;
    - `save` → `{ok:false,reason:"auth"}` → volta ao estado anterior e chama `push(loginHref)`.
- [ ] **Step 2:** `npm test -- tests/lib/marks-rules.test.ts tests/app/filme-actions.test.ts tests/components/MarkButtons.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar e encaixar na página do filme.
- [ ] **Step 4:** Mesmo comando → PASS; `npm run build` → OK.
- [ ] **Step 5:** Commit `feat: marcar Quero assistir / Já assisti na página do filme`

---

### Task 6: Página "Minhas listas"

**Files:** Create `src/app/minhas-listas/page.tsx`, `src/lib/list-tab.ts`, `src/components/MyListGrid.tsx` · Test `tests/lib/list-tab.test.ts`, `tests/components/MyListGrid.test.tsx`

**Interfaces:**
- Consumes: `getCurrentUser` (T1), `listMarks`, `Mark` (T5), `PosterCard`.
- Produces:
  - `parseListTab(value: string | string[] | undefined): MarkStatus`: `"visto"` só se o primeiro valor for exatamente `"visto"`; senão `"quero"`.
  - `MyListGrid({ marks, tab }: { marks: Mark[]; tab: MarkStatus })`: grade de `PosterCard` (mapeia para `MovieSummary` com `voteAverage: 0` e `releaseDate: null`, sem nota). Vazia:
    - `quero` → "Nenhum filme em Quero assistir ainda. Marque filmes na página de cada um." + link "Ver filmes" para `/`;
    - `visto` → "Nenhum filme em Já assisti ainda." + o mesmo link.
  - Página (`metadata.title` "Minhas listas"):
    - sem usuário → `redirect("/entrar?next=" + encodeURIComponent("/minhas-listas"))`;
    - título `h1` "Minhas listas";
    - duas abas-link: "Quero assistir (n)" → `/minhas-listas` e "Já assisti (n)" → `/minhas-listas?lista=visto`, com `aria-current="page"` na ativa;
    - grade filtrada por `tab`, mantendo a ordem de `listMarks`.

- [ ] **Step 1: Testes que falham**
  - `parseListTab("visto")==="visto"`, `(["visto","x"])==="visto"`, e `"quero"` para `"abc"` e `undefined`.
  - MyListGrid: com 2 marks, renderiza 2 links `/filme/<id>-<slug>` na ordem recebida. Vazia em `quero` → texto e link `/`. Vazia em `visto` → texto próprio.
- [ ] **Step 2:** `npm test -- tests/lib/list-tab.test.ts tests/components/MyListGrid.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit `feat: página Minhas listas`

---

### Task 7: Salvar "Meus streamings" na conta ao tocar um chip

**Files:** Create `src/app/streamings-actions.ts` · Modify `src/components/StreamingSelector.tsx`, `src/app/page.tsx` · Test `tests/app/streamings-actions.test.ts`, `tests/components/StreamingSelector.test.tsx` (acrescentar)

**Interfaces:**
- Consumes: `createClient`, `getCurrentUser` (T1); `parseMyStreamings`.
- Produces:
  - `saveStreamings(ids: string[]): Promise<{ ok: boolean }>` (`"use server"`): sem usuário → `{ok:false}`. Senão, limpa com `parseMyStreamings(Array.isArray(ids) ? ids.filter(s => typeof s === "string").join(",") : "")` e faz upsert `{ user_id, streamings, updated_at }`.
  - `StreamingSelector` ganha a prop opcional `saveToAccount?: (ids: string[]) => Promise<unknown>`. No `toggle`, depois de gravar o cookie, chama `saveToAccount?.(next)` sem esperar e ignorando falhas (o cookie já garante a tela). O `router.refresh()` continua.
  - `page.tsx`: passa `saveToAccount={saveStreamings}` só quando `getCurrentUser()` não é `null`.

- [ ] **Step 1: Testes que falham**
  - `saveStreamings`: sem usuário → `{ok:false}` e sem upsert. `["netflix","<script>","p190"]` → upsert com `streamings: ["netflix","p190"]`.
  - StreamingSelector: com `saveToAccount` simulado, clicar em "HBO Max" partindo de `["netflix"]` → chamado com `["netflix","max"]`. Sem a prop → nada quebra (os testes atuais continuam passando).
- [ ] **Step 2:** `npm test -- tests/app/streamings-actions.test.ts tests/components/StreamingSelector.test.tsx` → FAIL nos novos.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test`, `npm run lint` e `npm run build` → tudo passa.
- [ ] **Step 5:** Commit `feat: Meus streamings salvo na conta`

---

### Task 8: Verificação de ponta a ponta (manual, com o Supabase real)

- [ ] Com `.env.local` preenchido e a migração aplicada: `npm run dev`. Conferir:
  1. Criar conta em `/entrar` e já entrar.
  2. Marcar "Quero assistir" num filme. Marcar "Já assisti" no mesmo filme e ver que ele muda de lista em `/minhas-listas`.
  3. Sair. Os botões levam ao login, e `/minhas-listas` também.
  4. Num navegador anônimo com outro cookie de streamings, entrar e ver que os streamings da conta aparecem.
  5. "Esqueci minha senha": o email chega (via Gmail SMTP), o link abre `/redefinir-senha`, a nova senha funciona, e reabrir o mesmo link cai em `/entrar?erro=link`.
  6. No celular (DevTools), o ícone de lista no cabeçalho abre `/minhas-listas`.
- [ ] Registrar problemas encontrados e corrigir antes do merge.
