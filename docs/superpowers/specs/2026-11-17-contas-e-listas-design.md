# Contas e listas pessoais ("Quero assistir" / "Já assisti") — Design

Data: 2026-11-17
Status: aprovado

## 1. Intenção e o porquê

Cada pessoa do grupo (família e amigos) passa a ter **memória própria** no CineCasa: entra com **email e senha** e encontra, em qualquer aparelho, as **suas** decisões — os filmes que quer assistir, os que já assistiu e os seus streamings marcados. Nas palavras do usuário: "para que o usuário memorize cada decisão e personalize cada lista de acordo com o login".

As listas são **privadas**: ninguém vê as listas de outra pessoa.

Isto altera uma decisão do design original (`2026-11-16-catalogo-filmes-design.md`), que deixava "login, contas, listas pessoais" fora do escopo. O anti-objetivo de lá continua valendo: **o site não pode exigir login para ser usado**. O login só é pedido para marcar filmes e para ver "Minhas listas".

## 2. Objetivos (nível escolhido pelo usuário: "listas + Meus streamings na conta")

- Criar conta e entrar com **email e senha**; sair; recuperar senha esquecida.
- Na página do filme, botões **"Quero assistir"** e **"Já assisti"**.
- Nova aba **"Minhas listas"** no cabeçalho, com as duas listas.
- **"Meus streamings" salvo na conta** — quem está logado encontra a mesma escolha em qualquer aparelho.
- Quem não entra na conta usa o site exatamente como hoje.

## 3. Não-objetivos (fora desta versão)

- Selo "✓ visto" / "na sua lista" nos pôsteres das prateleiras (proposto e **não escolhido** pelo usuário).
- Esconder das prateleiras filmes já assistidos.
- Ver ou compartilhar listas de outras pessoas; qualquer recurso social.
- Notas, avaliações ou comentários pessoais sobre filmes.
- Login com Google/Apple/link mágico — só email e senha.
- Trocar email, excluir conta pela interface, foto de perfil.
- Séries (continua só filmes).

## 4. Anti-objetivos

- Exigir conta para navegar, buscar ou ver um filme.
- Uma pessoa conseguir ler ou alterar as listas de outra (mesmo manipulando o navegador).
- Perder a escolha de "Meus streamings" que a pessoa já tinha no aparelho ao criar conta.
- Botões que "piscam" ou mostram o estado errado até carregar.

## 5. Restrições

- **Backend: Supabase** (escolha do usuário; ele já criou a conta). Supabase Auth para email/senha e Postgres do Supabase para os dados. Plano gratuito.
- Hospedagem continua na Vercel (plano gratuito).
- **Next.js 16**: o antigo `middleware.ts` agora se chama **`proxy.ts`** (`src/proxy.ts`). Ler `node_modules/next/dist/docs/01-app/02-guides/authentication.md` e `01-getting-started/16-proxy.md` antes de codar (ver `AGENTS.md`).
- O projeto **não** usa `cacheComponents`; as páginas já leem `cookies()` no servidor.
- Variáveis novas (públicas, seguras no navegador): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou a "anon key", conforme o painel do projeto). Nenhuma chave secreta (`service_role`) é usada pelo app.
- O plano gratuito do Supabase **pausa o projeto após ~1 semana sem uso**; documentar no README como reativar.
- Envio de emails: o SMTP embutido do Supabase só entrega para emails da equipe do projeto e poucos por hora. Por isso a recuperação de senha usa um **SMTP próprio** (§7.6).

## 6. Abordagens consideradas

| Abordagem | Vantagens | Desvantagens |
|---|---|---|
| **A. Sessão reconhecida pelo servidor (`@supabase/ssr`)** — escolhida | Páginas do servidor e Server Actions sabem quem está logado; botões chegam já no estado certo; "Meus streamings" da conta alimenta o cookie que as prateleiras já usam, sem reescrever a home; regras de acesso (RLS) no banco | Mais peças: `proxy.ts` para renovar a sessão, clientes Supabase de servidor e navegador |
| B. Login só no navegador (`supabase-js` puro) | Mais simples de montar | Servidor não sabe quem está logado; botões e listas carregam depois (piscam); sincronizar streamings com prateleiras feitas no servidor fica remendado |
| C. Supabase só como banco + Auth.js para login | — | Mais trabalho para ter menos; o Supabase já tem login por email/senha. Descartada |

**Escolha do usuário:** A.

## 7. O que foi decidido

### 7.1 Dados (Postgres no Supabase)

```sql
-- Uma linha por filme marcado. A chave (user_id, movie_id) garante que
-- um filme está em no máximo UMA lista por pessoa.
create table public.movie_marks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  movie_id    integer not null,               -- id do TMDB
  status      text not null check (status in ('quero', 'visto')),
  title       text not null,                  -- cópia para listar sem chamar o TMDB
  poster_path text,                           -- idem
  updated_at  timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create table public.user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  streamings text[] not null default '{}',    -- mesmos ids do cookie: 'netflix', 'p1234'…
  updated_at timestamptz not null default now()
);
```

- **RLS ligado nas duas tabelas**, com políticas "a pessoa só vê/insere/altera/apaga linhas onde `user_id = auth.uid()`".
- O SQL fica versionado em `supabase/migrations/` e é aplicado colando no **SQL Editor** do Supabase (sem exigir a CLI do Supabase). Passo a passo no README.

### 7.2 Regras das listas

- Um filme fica em **uma lista só**. Marcar "Já assisti" num filme que está em "Quero assistir" **move** o filme.
- Tocar de novo no botão já ativo **tira** o filme da lista.
- Ao marcar, guardar `title` e `poster_path` atuais do filme (vêm da página do filme).
- Listas ordenadas pelo **mais recente marcado primeiro** (`updated_at desc`).

### 7.3 Página do filme

Os botões ficam junto de "Ver trailer" / "Compartilhar":

```
[▶ Ver trailer] [＋ Quero assistir] [✓ Já assisti] [↗ Compartilhar]
```

- Estado ativo visível (preenchido, `aria-pressed`). O estado inicial vem do servidor.
- Atualização otimista: muda na hora, e volta atrás com uma mensagem curta se der erro.
- Sem login: tocar em qualquer botão leva para `/entrar?next=/filme/<slug>`. Depois de entrar, a pessoa volta para o filme. **Chamada do construtor-padrão:** não aplicar a marcação automaticamente; ela toca de novo.

### 7.4 Aba "Minhas listas" (`/minhas-listas`)

```
┌─────────────────────────────┐
│ CineCasa  Início Buscar Minhas listas   🔍 👤 │
│ Minhas listas               │
│ [Quero assistir (12)] [Já assisti (30)] │  ← alternar (?lista=quero|visto)
│ [▢][▢][▢][▢]                │
│ [▢][▢][▢][▢]   grade de pôsteres │
└─────────────────────────────┘
```

- Grade de pôsteres (mesmo `PosterCard`, sem nota), tocar abre o filme.
- A sub-aba ativa fica na URL (`?lista=quero` padrão, `?lista=visto`).
- Lista vazia: texto curto convidando a marcar filmes, com link para o Início.
- Sem login: redireciona para `/entrar?next=/minhas-listas`.

### 7.5 Cabeçalho

- Novo item **"Minhas listas"** na navegação.
- A navegação de texto hoje some no celular (`hidden sm:flex`). Para a aba ser alcançável no celular, adicionar um **ícone de lista** ao lado da lupa, visível só em telas pequenas.
- Canto direito: **"Entrar"** (sem login) ou um botão de conta que abre um menu com o email da pessoa e **"Sair"**.

### 7.6 Entrar, criar conta, recuperar senha

- `/entrar`: formulário de email + senha, com alternância "Entrar" / "Criar conta" e o link "Esqueci minha senha". Mensagens de erro em português (senha errada, email já cadastrado, senha curta…).
- **Sem confirmação de email** (decisão do usuário; "Confirm email" já está **desligado** no painel do Supabase). Ao criar conta, `signUp` já devolve a sessão: a pessoa entra na hora e é levada para o `next`. A sincronização de streamings (§7.7) roda logo após `signUp`/`signIn`, dentro da própria action.
- Senha mínima: o padrão do Supabase (6 caracteres).
- Recuperar senha (decisão do usuário: **funciona por email**): o Supabase envia um email com link → a pessoa volta para `/redefinir-senha` e escolhe uma senha nova.
  - Envio via **SMTP próprio configurado no Supabase** (Authentication → Emails → SMTP Settings). Sugestão para o README: o Gmail do dono do site com uma "senha de app" (exige verificação em 2 etapas; sem domínio próprio; ~500 emails/dia). O email sai com esse endereço como remetente.
  - Traduzir o modelo do email "Reset Password" para pt-BR no painel (passo no README).
  - O link volta por uma rota `/auth/confirm`. **Chamada do construtor-padrão:** usar o formato `token_hash` + `verifyOtp` (ajustando o link no modelo do email), e não o código PKCE, para o link funcionar mesmo se for aberto em outro aparelho/navegador que não o que pediu a recuperação.
- Respeitar `?next=` só para caminhos internos (começando com `/`, sem `//`), para evitar redirecionamento aberto.

### 7.7 "Meus streamings" na conta

A conta é a fonte da verdade. O cookie `meus_streamings` continua existindo como **cópia local**, porque a home, a página do filme e a categoria já leem esse cookie. Assim essas páginas não mudam.

- **Ao entrar ou criar conta:**
  - se a conta já tem streamings salvos → **sobrescreve o cookie** com os da conta;
  - se a conta não tem nada salvo e o cookie tem → **salva o cookie na conta** (a pessoa não perde o que já tinha marcado).
- **Logado, ao tocar um chip:** grava o cookie (como hoje) e também salva na conta (Server Action).
- **Ao sair:** o cookie fica no aparelho como está (o site continua personalizado do mesmo jeito para quem não está logado).
- Caso raro aceito: a pessoa muda os streamings no celular enquanto está logada no computador. O computador só atualiza no próximo login. **Chamada do construtor-padrão:** não sincronizar a cada visita nesta versão.

### 7.8 Estrutura técnica (para o construtor)

- Pacotes: `@supabase/supabase-js`, `@supabase/ssr`.
- `src/lib/supabase/server.ts` (cliente com `cookies()` do Next), `src/lib/supabase/client.ts` (navegador), `src/proxy.ts` (renova a sessão; `matcher` exclui `_next/static`, imagens e favicon).
- Autorização real nas Server Actions e nas páginas (`supabase.auth.getUser()`), nunca só no proxy.
- Server Actions: `setMark(movie, status | null)`, `saveStreamings(ids)`, `signIn`, `signUp`, `signOut`, `requestPasswordReset`, `updatePassword`.
- Testes (Vitest, padrão do projeto): regras puras (transições de status, regra de sincronização de streamings, validação do `next`) e componentes (botões, abas da lista) com as actions simuladas. Sem testes contra o Supabase real.
- README: criar o projeto no Supabase, aplicar o SQL, configurar as URLs de redirecionamento (Auth → URL Configuration: localhost e o domínio da Vercel), e as variáveis novas em `.env.example` e na Vercel.

## 8. Em aberto para o construtor / para decidir

- Visual exato dos botões, do menu de conta e da tela `/entrar`: seguir o estilo atual (tokens `projetor`, `poltrona`, `sala`, fontes `font-display`).
