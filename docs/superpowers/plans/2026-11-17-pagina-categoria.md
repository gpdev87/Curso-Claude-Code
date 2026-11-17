# Página de Categoria — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página `/categoria/<slug>?ordem=nota` com troca de categoria, ordem Em alta / Mais bem avaliados (nota TMDB), grade com nota e "Carregar mais", aberta pelo "Ver tudo ›" das prateleiras.

**Architecture:** Lista fixa de categorias em `src/lib/categories.ts`. Nova função `getCategoryPage` em `discover.ts` reaproveita os parâmetros do discover. A página é server component (lê o cookie "Meus streamings"); o "Carregar mais" chama uma **server action** que relê o cookie e devolve a próxima página — o token continua só no servidor.

**Tech Stack:** Next.js 16 (App Router, server actions), TypeScript, Tailwind (tokens `sala/poltrona/cortina/texto/apagado/projetor/assina`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-17-pagina-categoria-design.md` (base: `2026-11-16-catalogo-filmes-design.md`)

## Global Constraints

- Discover sempre com `watch_region=BR`, `with_watch_monetization_types=flatrate`, `with_watch_providers` dos "Meus streamings" (omitido se nenhum).
- "Em alta" = `sort_by=popularity.desc`. "Mais bem avaliados" = `sort_by=vote_average.desc` + `vote_count.gte=300`.
- URL: `/categoria/<slug>`; `?ordem=nota` = Mais bem avaliados; qualquer outro valor/ausente = Em alta.
- 20 filmes por página (página do TMDB). Páginas válidas: inteiros 1–500.
- Textos em português; visual com os tokens de cor e `font-display` existentes.
- Nenhum componente cliente importa `src/lib/tmdb/*`.

## Review Focus

1. **Slug ou ordem inválidos** (`/categoria/xyz`, `?ordem=abc`) → 404 para slug; ordem inválida vira Em alta. *(Task 1, Task 5)*
2. **Filme repetido entre páginas** (a popularidade muda entre uma página e outra) → a grade não mostra o mesmo filme duas vezes. *(Task 4)*
3. **Fim da lista / página adulterada na action** (`page` 0, -1, 501, 2.5) → botão some na última página; action rejeita página inválida sem chamar o TMDB. *(Task 4)*
4. **Categoria sem filmes nos streamings marcados** → mensagem "Nenhum filme desta categoria nos seus streamings." sem grade nem botão. *(Task 5)*
5. **Falha ao carregar mais** (TMDB fora) → filmes já exibidos ficam; botão vira "Tentar de novo". *(Task 4)*

---

### Task 1: Lista de categorias e ordem

**Files:** Create `src/lib/categories.ts` · Test `tests/lib/categories.test.ts`

**Interfaces — Produces:**
- `type CategoryOrder = "alta" | "nota"`
- `type Category = { slug: string; name: string; genreId: number | null }`
- `CATEGORIES: Category[]` nesta ordem: `todas` "Todas" `null`; as 8 da tela inicial — `comedia` "Comédia" 35, `acao` "Ação" 28, `terror` "Terror" 27, `familia` "Família" 10751, `drama` "Drama" 18, `animacao` "Animação" 16, `romance` "Romance" 10749, `ficcao-cientifica` "Ficção científica" 878; depois — `aventura` "Aventura" 12, `crime` "Crime" 80, `documentario` "Documentário" 99, `fantasia` "Fantasia" 14, `historia` "História" 36, `musica` "Música" 10402, `misterio` "Mistério" 9648, `suspense` "Suspense" 53, `guerra` "Guerra" 10752, `faroeste` "Faroeste" 37, `filme-de-tv` "Filme de TV" 10770.
- `categoryBySlug(slug: string): Category | undefined`
- `parseOrder(value: string | string[] | undefined): CategoryOrder` — `"nota"` só se o (primeiro) valor for exatamente `"nota"`.
- `categoryHref(slug: string, order: CategoryOrder): string` — `"/categoria/terror"` ou `"/categoria/terror?ordem=nota"`.

- [ ] **Step 1: Testes que falham:** 20 categorias, primeira `todas` com `genreId: null`, slugs únicos, 19 `genreId` únicos; `categoryBySlug("ficcao-cientifica")?.genreId === 878`; `categoryBySlug("xyz") === undefined`; `parseOrder("nota") === "nota"`, `parseOrder(["nota","x"]) === "nota"`, `parseOrder("abc")`/`undefined` → `"alta"`; `categoryHref("terror","nota") === "/categoria/terror?ordem=nota"`, `categoryHref("terror","alta") === "/categoria/terror"`.
- [ ] **Step 2:** `npm test -- tests/lib/categories.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar `src/lib/categories.ts`.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit `feat: lista de categorias e ordem da página de categoria`

---

### Task 2: Consulta paginada por categoria e "Ver tudo" nas prateleiras

**Files:** Modify `src/lib/tmdb/discover.ts` · Test `tests/lib/tmdb/discover.test.ts` (acrescentar)

**Interfaces:**
- Consumes: `CategoryOrder` (T1); `tmdbFetch`, `REVALIDATE_LISTS`, `toMovieSummary`.
- Produces:
  - `ShelfDef` ganha `seeAllHref?: string`. Valores: `mais-avaliados` → `/categoria/todas?ordem=nota`; prateleiras de gênero → `/categoria/<slug da T1>` (`comedia`, `acao`, `terror`, `familia`, `drama`, `animacao`, `romance`, `ficcao-cientifica`); `em-alta` e `recem-lancados` sem `seeAllHref`.
  - `buildCategoryParams(genreId: number | null, order: CategoryOrder, providerIds: number[], page: number): TmdbParams` — base BR/flatrate/providers como `buildDiscoverParams`; `with_genres` só se `genreId`; `alta` → `popularity.desc`; `nota` → `vote_average.desc` + `"vote_count.gte": 300`; `page`.
  - `getCategoryPage(genreId: number | null, order: CategoryOrder, providerIds: number[], page: number): Promise<{ movies: MovieSummary[]; hasMore: boolean }>` — `hasMore = page < Math.min(total_pages, 500)`.

- [ ] **Step 1: Testes que falham:**
  - `buildCategoryParams(27, "nota", [8], 3)` → `with_genres 27`, `sort_by "vote_average.desc"`, `"vote_count.gte" 300`, `page 3`, `with_watch_providers "8"`, `watch_region "BR"`, `with_watch_monetization_types "flatrate"`.
  - `buildCategoryParams(null, "alta", [], 1)` → `with_genres` e `with_watch_providers` `undefined`, `"vote_count.gte"` `undefined`, `sort_by "popularity.desc"`.
  - `getCategoryPage` com fetch mockado `{ results:[…], total_pages: 3 }`: página 2 → `hasMore true`; página 3 → `false`; `total_pages: 900`, página 500 → `false`.
  - `SHELVES.find(id "terror").seeAllHref === "/categoria/terror"`, `"ficcao"` → `"/categoria/ficcao-cientifica"`, `"mais-avaliados"` → `"/categoria/todas?ordem=nota"`, `"em-alta"` → `undefined`.
- [ ] **Step 2:** `npm test -- tests/lib/tmdb/discover.test.ts` → FAIL nos novos.
- [ ] **Step 3:** Implementar (reaproveitar a parte comum de `buildDiscoverParams`).
- [ ] **Step 4:** Mesmo comando → PASS (antigos e novos).
- [ ] **Step 5:** Commit `feat: consulta paginada por categoria e links Ver tudo`

---

### Task 3: Nota no pôster e "Ver tudo ›" na prateleira

**Files:** Modify `src/components/PosterCard.tsx`, `src/components/Shelf.tsx`, `src/components/ShelfList.tsx` · Test `tests/components/Shelf.test.tsx` (acrescentar)

**Interfaces:**
- Consumes: `ShelfDef.seeAllHref` (T2).
- Produces: `PosterCard` ganha prop `showRating?: boolean` → mostra `★ 7.8` (`voteAverage.toFixed(1)`, cor `projetor`) sobre o pôster; nada se `voteAverage === 0`. `Shelf` ganha `seeAllHref?: string` → link "Ver tudo ›" ao lado do título. `ShelfList` repassa `shelf.seeAllHref`.

- [ ] **Step 1: Testes que falham:** `PosterCard showRating` com `voteAverage 7.84` → texto `★ 7.8`; com `0` → nenhum `★`; sem `showRating` → nenhum `★`. `Shelf seeAllHref="/categoria/terror"` → link com nome `Ver tudo` e `href "/categoria/terror"`; sem `seeAllHref` → nenhum link "Ver tudo".
- [ ] **Step 2:** `npm test -- tests/components/Shelf.test.tsx` → FAIL nos novos.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit `feat: nota no pôster e Ver tudo nas prateleiras`

---

### Task 4: "Carregar mais" (server action + grade cliente)

**Files:** Create `src/app/categoria/actions.ts`, `src/components/CategoryGrid.tsx` · Test `tests/app/categoria-actions.test.ts`, `tests/components/CategoryGrid.test.tsx`

**Interfaces:**
- Consumes: `categoryBySlug`, `CategoryOrder` (T1); `getCategoryPage` (T2); `COOKIE_NAME`, `parseMyStreamings`, `providerIdsFor`; `PosterCard showRating` (T3).
- Produces:
  - `"use server"` `loadCategoryPage(slug: string, order: CategoryOrder, page: number): Promise<{ movies: MovieSummary[]; hasMore: boolean }>` — lança `Error("Página inválida")` se slug desconhecido, `order` fora de `"alta"|"nota"` ou `page` não inteiro em 2–500, **sem chamar o TMDB**; senão lê o cookie (`await cookies()`) e chama `getCategoryPage`.
  - `<CategoryGrid slug order initialMovies initialHasMore />` (client) — grade responsiva (`grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7`) de `PosterCard showRating`; botão "Carregar mais" enquanto `hasMore`; durante a carga mostra "Carregando…" desabilitado; ao receber, acrescenta **removendo ids já exibidos**; se a action rejeitar, mantém os filmes e o botão vira "Tentar de novo" (repete a mesma página). Recebe a action por prop opcional `load = loadCategoryPage` para teste.

- [ ] **Step 1: Testes que falham — action** (`vi.mock("next/headers")` devolvendo cookie `meus_streamings=netflix`; `vi.mock("@/lib/tmdb/discover")`):
  - `loadCategoryPage("terror","nota",2)` chama `getCategoryPage(27,"nota",[8,1796],2)`.
  - `("todas","alta",2)` → `getCategoryPage(null,"alta",…,2)`.
  - `("xyz","alta",2)`, `("terror","x",2)`, page `1`, `0`, `-1`, `501`, `2.5` → rejeita "Página inválida" e `getCategoryPage` não é chamado.
- [ ] **Step 2: Testes que falham — grade** (`load` mockado):
  - 2 filmes iniciais, `initialHasMore true`; clicar "Carregar mais" chama `load("terror","nota",2)`; resposta com um id repetido e um novo → 3 links no total.
  - resposta `hasMore false` → botão some.
  - `initialHasMore false` → sem botão.
  - `load` rejeita → 2 filmes continuam e aparece botão "Tentar de novo"; clicar chama `load` de novo com página 2.
- [ ] **Step 3:** `npm test -- tests/app tests/components/CategoryGrid.test.tsx` → FAIL.
- [ ] **Step 4:** Implementar `actions.ts` e `CategoryGrid.tsx`.
- [ ] **Step 5:** Mesmo comando → PASS.
- [ ] **Step 6:** Commit `feat: carregar mais filmes na página de categoria`

---

### Task 5: Página `/categoria/[slug]`

**Files:** Create `src/app/categoria/[slug]/page.tsx`, `src/components/CategoryNav.tsx` · Test `tests/components/CategoryNav.test.tsx`

**Interfaces:**
- Consumes: T1 inteira; `getCategoryPage` (T2); `CategoryGrid` (T4); cookie helpers.
- Produces:
  - `<CategoryNav current={slug} order={CategoryOrder} />` (server-safe, só links): linha rolável de chips para as 20 categorias (`categoryHref(c.slug, order)`; atual com `aria-current="page"` e estilo `projetor`); alternador com dois links "Em alta" / "★ Mais bem avaliados" (`categoryHref(current, …)`; ativo com `aria-current="page"`).
  - Página: `await params`/`await searchParams`; `categoryBySlug` indefinido → `notFound()`; `parseOrder(searchParams.ordem)`; lê cookie; `getCategoryPage(genreId, order, providerIds, 1)`; título `font-display` com o nome (ou "Todos os filmes" para `todas`); `CategoryNav`; `CategoryGrid` com a primeira página; sem filmes → "Nenhum filme desta categoria nos seus streamings." `generateMetadata`: `title` = nome da categoria (+ " — mais bem avaliados" quando `nota`).
  - Respeitar espaço do `SiteHeader` fixo (mesmo `pt-24 md:pt-28` da busca).

- [ ] **Step 1: Testes que falham — `CategoryNav current="terror" order="nota"`:** 20 links de categoria; link "Terror" tem `aria-current="page"` e `href "/categoria/terror?ordem=nota"`; link "Comédia" → `/categoria/comedia?ordem=nota`; link "Em alta" → `/categoria/terror`; link "★ Mais bem avaliados" tem `aria-current="page"`.
- [ ] **Step 2:** `npm test -- tests/components/CategoryNav.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar `CategoryNav` e a página.
- [ ] **Step 4:** `npm test` (suite toda) → PASS; `npm run lint` e `npm run build` sem erros.
- [ ] **Step 5: Manual** (`npm run build && npx next start -p 3126`, cookie `meus_streamings=netflix`): `/categoria/terror` lista filmes; `?ordem=nota` mostra notas decrescentes; HTML de `/categoria/xyz` responde 404; `?ordem=abc` igual a Em alta; tela inicial mostra "Ver tudo" em Comédia e Mais bem avaliados.
- [ ] **Step 6:** Commit `feat: página de categoria com ordem por nota`
