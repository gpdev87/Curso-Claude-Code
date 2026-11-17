# Catálogo de Filmes em Streaming — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site em Next.js, mobile-first, que mostra em prateleiras os filmes disponíveis por assinatura nos streamings do Brasil (filtrados pelos "Meus streamings" de cada pessoa), com página de filme compartilhável e busca.

**Architecture:** Next.js App Router. Todo acesso ao TMDB acontece no servidor (`src/lib/tmdb/*`), com `fetch` + `next.revalidate` para cache. A escolha "Meus streamings" fica num **cookie** (`meus_streamings`) — assim o servidor já renderiza as prateleiras filtradas e a página do filme sabe o que a pessoa assina. Lógica pura (montagem de parâmetros, mapeamento de respostas, cookie, slugs) fica em funções testáveis separadas das páginas.

**Tech Stack:** Next.js (última estável, App Router, TypeScript), Tailwind CSS, Vitest + @testing-library/react + jsdom, hospedagem Vercel.

**Spec:** `docs/superpowers/specs/2026-11-16-catalogo-filmes-design.md`

## Global Constraints

- Região fixa `watch_region=BR`; idioma `language=pt-BR` em toda chamada ao TMDB.
- Só streaming por assinatura: `with_watch_monetization_types=flatrate`; nos detalhes, usar apenas `results.BR.flatrate`.
- Token em `process.env.TMDB_READ_ACCESS_TOKEN`, enviado como `Authorization: Bearer <token>`, **somente no servidor**. Nenhum componente cliente importa `src/lib/tmdb/*`.
- Imagens via `https://image.tmdb.org/t/p/<tamanho><path>`.
- Atribuição no rodapé de todas as páginas, texto exato: `This product uses the TMDB API but is not endorsed or certified by TMDB.` + logo TMDB + `Dados de streaming: JustWatch`.
- "Mais bem avaliados" usa `vote_count.gte=300`.
- Sem login. Sem séries. Sem aluguel/compra.
- Mobile-first: layout testado em 375px de largura, sem rolagem horizontal da página (só dentro das prateleiras).
- Textos de interface em português.

## Review Focus

1. **Filme sem streaming no BR** (aberto pela busca ou por link compartilhado) → página mostra "Não disponível em streaming por assinatura no Brasil", não seção vazia nem erro. *(teste na Task 5 e Task 8)*
2. **Combinação de streamings + gênero sem resultados** (ex.: só Mercado Play + Terror) → a prateleira some; não aparece fileira vazia. *(teste na Task 7)*
3. **Dados faltando em pt-BR** (sem pôster, sem backdrop, `overview` vazio, sem duração) → placeholder de imagem e texto "Sinopse não disponível em português."; duração omitida. *(teste na Task 5)*
4. **Link compartilhado inválido ou antigo** (`/filme/abc`, id inexistente, slug com título diferente do atual) → 404 amigável para inválidos/inexistentes; id certo com texto errado ainda abre o filme. *(teste na Task 1 e Task 8)*
5. **TMDB fora do ar ou token ausente/inválido** → página de erro amigável ("Não conseguimos carregar os filmes agora. Tente de novo em instantes.") em vez de tela quebrada; cookie adulterado é ignorado sem erro. *(teste na Task 2, Task 3 e Task 9)*

---

## Estrutura de arquivos

```
src/
  lib/
    format.ts              # duração, ano, slug, URL de imagem
    streamings.ts          # chips curados, mapeamento p/ IDs TMDB, cookie
    tmdb/
      client.ts            # tmdbFetch + TmdbError
      types.ts             # tipos de domínio (MovieSummary, MovieDetail…)
      discover.ts          # SHELVES, buildDiscoverParams, getShelf
      movie.ts             # getMovieDetail, mapMovieDetail, recomendações
      search.ts            # searchMovies, getBrProviders
  components/
    PosterCard.tsx  Shelf.tsx  StreamingSelector.tsx  ProviderList.tsx
    ShareButton.tsx  Footer.tsx  PersonalizeNotice.tsx
  app/
    layout.tsx  page.tsx  error.tsx  not-found.tsx
    filme/[slug]/page.tsx
    busca/page.tsx
tests/  (espelha src/: tests/lib/..., tests/components/...)
```

---

### Task 1: Projeto, ferramentas e utilitários de formatação

**Files:**
- Create: projeto via `create-next-app`, `vitest.config.ts`, `tests/setup.ts`, `.env.example`, `.gitignore` (acrescentar `.superpowers/` e `.env*.local`)
- Create: `src/lib/format.ts`
- Test: `tests/lib/format.test.ts`

**Interfaces:**
- Produces:
  - `formatRuntime(minutes: number | null): string | null` — `180 → "3h00"`, `95 → "1h35"`, `45 → "45min"`, `0`/`null → null`
  - `releaseYear(date: string | null): number | null` — `"2023-07-19" → 2023`, `""`/`null → null`
  - `movieSlug(id: number, title: string): string` — minúsculas, sem acentos, não-alfanumérico vira `-`, sem `-` duplicado/nas pontas: `(872585, "Oppenheimer") → "872585-oppenheimer"`, `(1, "O Auto da Compadecida") → "1-o-auto-da-compadecida"`
  - `parseMovieSlug(slug: string): number | null` — lê os dígitos iniciais antes do primeiro `-` (ou o slug todo): `"872585-qualquer-coisa" → 872585`, `"872585" → 872585`, `"abc"`/`"0-x"` → `null`
  - `imageUrl(path: string | null, size: "w185" | "w342" | "w780" | "w1280"): string | null`

- [ ] **Step 1:** Na raiz `c:\Users\guilh\Curso Claude Code`, rodar `git init`, depois `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`. (A pasta já tem `docs/` e `.superpowers/`; se o comando recusar pasta não vazia, criar em subpasta temporária e mover os arquivos.)
- [ ] **Step 2:** Instalar `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths` como devDependencies; `vitest.config.ts` com `environment: "jsdom"`, `setupFiles: ["tests/setup.ts"]`, plugins react + tsconfigPaths; script `"test": "vitest run"`. `.env.example` com `TMDB_READ_ACCESS_TOKEN=`.
- [ ] **Step 3: Testes que falham** em `tests/lib/format.test.ts`: `formatRuntime` (180, 95, 45, 0, null), `releaseYear` ("2023-07-19", "", null), `movieSlug` (os dois exemplos acima + `"Duna: Parte Dois"` → `"…-duna-parte-dois"`), `parseMovieSlug` (os quatro exemplos acima), `imageUrl("/abc.jpg","w342") === "https://image.tmdb.org/t/p/w342/abc.jpg"` e `imageUrl(null,"w342") === null`.
- [ ] **Step 4:** `npm test -- tests/lib/format.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 5:** Implementar `src/lib/format.ts` (acentos: `normalize("NFD")` + remover `\p{Diacritic}`).
- [ ] **Step 6:** `npm test -- tests/lib/format.test.ts` → PASS. `npm run build` → sucesso.
- [ ] **Step 7:** Commit: `git add -A && git commit -m "chore: cria projeto Next.js e utilitários de formatação"`

---

### Task 2: Cliente TMDB e tipos

**Files:**
- Create: `src/lib/tmdb/client.ts`, `src/lib/tmdb/types.ts`
- Test: `tests/lib/tmdb/client.test.ts`

**Interfaces:**
- Produces:
  - `class TmdbError extends Error { status: number }` (status `0` para falha de rede/token ausente)
  - `tmdbFetch<T>(path: string, params: Record<string, string | number | undefined>, revalidate: number): Promise<T>` — base `https://api.themoviedb.org/3`; sempre acrescenta `language=pt-BR`; omite params `undefined`; header `Authorization: Bearer ${TMDB_READ_ACCESS_TOKEN}`; passa `{ next: { revalidate } }`; lança `TmdbError` se token ausente, resposta não-ok ou erro de rede.
  - Constantes: `REVALIDATE_LISTS = 21600` (6h), `REVALIDATE_STATIC = 86400` (24h).
  - Em `types.ts`:
    ```ts
    type MovieSummary = { id: number; title: string; posterPath: string | null; voteAverage: number; releaseDate: string | null };
    type Provider = { id: number; name: string; logoPath: string | null };
    type CastMember = { name: string; character: string; profilePath: string | null };
    type MovieDetail = MovieSummary & {
      overview: string; backdropPath: string | null; runtime: number | null;
      genres: string[]; certification: string | null; providers: Provider[];
      trailerUrl: string | null; cast: CastMember[]; recommendations: MovieSummary[];
    };
    type AnnotatedMovie = MovieSummary & { onMyStreamings: boolean };
    ```
  - `toMovieSummary(raw: any): MovieSummary` (mapeia `poster_path`, `vote_average`, `release_date` de um resultado cru do TMDB; `release_date: ""` vira `null`).

- [ ] **Step 1: Testes que falham** (com `vi.stubGlobal("fetch", vi.fn())` e `vi.stubEnv`):
  - `tmdbFetch("/discover/movie", { page: 2, x: undefined }, 60)` chama `fetch` com URL contendo `language=pt-BR` e `page=2`, sem `x`; header `Authorization: "Bearer tok"`; `init.next.revalidate === 60`.
  - resposta `{ ok: false, status: 401 }` → rejeita com `TmdbError` e `status === 401`.
  - token ausente → rejeita com `TmdbError`, `status === 0`, sem chamar `fetch`.
  - `fetch` rejeitando (rede) → `TmdbError` `status === 0`.
  - `toMovieSummary({ id:1, title:"X", poster_path:null, vote_average:7.5, release_date:"" })` → `releaseDate: null`.
- [ ] **Step 2:** `npm test -- tests/lib/tmdb/client.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `client.ts` e `types.ts`.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit: `feat: cliente TMDB com cache e tratamento de erro`

---

### Task 3: "Meus streamings" — chips curados e cookie

**Files:**
- Create: `src/lib/streamings.ts`, `scripts/list-br-providers.mjs`
- Test: `tests/lib/streamings.test.ts`

**Interfaces:**
- Produces:
  - `type StreamingChip = { id: string; name: string; providerIds: number[] }`
  - `STREAMINGS: StreamingChip[]` — nesta ordem: `netflix`, `prime`, `max`, `disney`, `globoplay`, `appletv`, `paramount`, `mercadoplay`. IDs provisórios (confirmar no Step 1): Netflix `[8, 1796]`; Prime Video `[119, 2100]`; Max `[1899]`; Disney+ `[337]`; Globoplay `[307]`; Apple TV+ `[350, 2243]`; Paramount+ `[531, 582]`; Mercado Play `[ID a levantar]`.
  - Provedores fora da lista curada usam id de chip `p<providerId>` (ex.: `"p190"`).
  - `COOKIE_NAME = "meus_streamings"`
  - `parseMyStreamings(value: string | undefined): string[]` — separa por `,`, mantém só ids de `STREAMINGS` ou `/^p\d+$/`, remove duplicados; qualquer outra coisa é descartada sem erro.
  - `serializeMyStreamings(ids: string[]): string` — `ids.join(",")`.
  - `providerIdsFor(chipIds: string[]): number[]` — junta `providerIds` dos chips + número dos `p<id>`, sem duplicados.
  - `curatedProviderIds(): Set<number>` — todos os ids cobertos pela lista curada (para esconder duplicatas no "+").

- [ ] **Step 1:** Criar `scripts/list-br-providers.mjs` (lê token de `.env.local`, chama `/watch/providers/movie?watch_region=BR&language=pt-BR`, imprime `id  nome`). Rodar `node scripts/list-br-providers.mjs` e **corrigir os IDs** de `STREAMINGS` conforme a saída: incluir em cada chip todas as variantes do mesmo serviço ("with Ads", "Standard with Ads", "<Serviço> Amazon Channel"). Registrar a saída no corpo do commit. *(Requer o token do usuário em `.env.local`.)*
- [ ] **Step 2: Testes que falham:**
  - `parseMyStreamings("netflix,max,p190")` → `["netflix","max","p190"]`
  - `parseMyStreamings("netflix,<script>,,netflix,pxyz")` → `["netflix"]`
  - `parseMyStreamings(undefined)` e `("")` → `[]`
  - `providerIdsFor(["netflix","p190"])` contém todos os ids do chip Netflix e `190`, sem duplicados
  - `providerIdsFor([])` → `[]`
  - `curatedProviderIds().has(8) === true`
- [ ] **Step 3:** `npm test -- tests/lib/streamings.test.ts` → FAIL.
- [ ] **Step 4:** Implementar `streamings.ts`.
- [ ] **Step 5:** Mesmo comando → PASS.
- [ ] **Step 6:** Commit: `feat: lista curada de streamings e leitura do cookie`

---

### Task 4: Prateleiras (discover)

**Files:**
- Create: `src/lib/tmdb/discover.ts`
- Test: `tests/lib/tmdb/discover.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `REVALIDATE_LISTS`, `toMovieSummary` (Task 2).
- Produces:
  - `type ShelfDef = { id: string; title: string; sort: string; genreId?: number; minVotes?: number; releasedUntilToday?: boolean }`
  - `SHELVES: ShelfDef[]` nesta ordem:
    | id | title | regras |
    |---|---|---|
    | `em-alta` | 🔥 Em alta nos seus streamings | `popularity.desc` |
    | `mais-avaliados` | ⭐ Mais bem avaliados | `vote_average.desc`, `minVotes: 300` |
    | `recem-lancados` | 🆕 Recém-lançados | `primary_release_date.desc`, `releasedUntilToday`, `minVotes: 20` |
    | `comedia` 35 · `acao` 28 · `terror` 27 · `familia` 10751 · `drama` 18 · `animacao` 16 · `romance` 10749 · `ficcao` 878 | 😂 Comédia · 💥 Ação · 😱 Terror · 👨‍👩‍👧 Família · 🎭 Drama · 🧸 Animação · ❤️ Romance · 🚀 Ficção científica | `popularity.desc` + `genreId` |
    (`minVotes: 20` em recém-lançados é decisão deste plano: evita títulos obscuros sem pôster/sinopse.)
  - `buildDiscoverParams(shelf: ShelfDef, providerIds: number[], today: string): Record<string, string | number | undefined>` — sempre `watch_region: "BR"`, `with_watch_monetization_types: "flatrate"`, `sort_by`, `page: 1`; `with_watch_providers: providerIds.join("|")` só se houver ids; `with_genres` se `genreId`; `"vote_count.gte"` se `minVotes`; `"primary_release_date.lte": today` se `releasedUntilToday`.
  - `getShelf(shelf: ShelfDef, providerIds: number[]): Promise<MovieSummary[]>` — primeira página (20 filmes), `REVALIDATE_LISTS`.
  - `getAllShelves(providerIds: number[]): Promise<{ shelf: ShelfDef; movies: MovieSummary[] }[]>` — todas em paralelo; **remove** prateleiras com 0 filmes; se uma prateleira falhar, ela é omitida (as outras aparecem); se **todas** falharem, lança o `TmdbError`.

- [ ] **Step 1: Testes que falham:**
  - `buildDiscoverParams(em-alta, [8, 1899], "2026-11-17")` → `with_watch_providers === "8|1899"`, `watch_region === "BR"`, `with_watch_monetization_types === "flatrate"`, `sort_by === "popularity.desc"`.
  - com `[]` → `with_watch_providers` é `undefined`.
  - `mais-avaliados` → `"vote_count.gte" === 300`.
  - `recem-lancados` → `"primary_release_date.lte" === "2026-11-17"`.
  - `terror` → `with_genres === 27`.
  - `getAllShelves` com `fetch` mockado devolvendo `results: []` para o terror e filmes para as demais → resultado não contém `terror`.
  - `getAllShelves` com uma chamada falhando → as outras voltam; com todas falhando → rejeita.
- [ ] **Step 2:** `npm test -- tests/lib/tmdb/discover.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `discover.ts` (`today` em `America/Sao_Paulo`, formato `YYYY-MM-DD`, calculado em `getShelf`).
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit: `feat: prateleiras via discover filtradas por streaming`

---

### Task 5: Detalhe do filme e recomendações anotadas

**Files:**
- Create: `src/lib/tmdb/movie.ts`
- Test: `tests/lib/tmdb/movie.test.ts`, `tests/fixtures/movie-872585.json` (resposta real gravada de `/movie/872585?append_to_response=watch/providers,videos,credits,release_dates,recommendations&language=pt-BR&include_video_language=pt-BR,en`, reduzida)

**Interfaces:**
- Consumes: `tmdbFetch`, `TmdbError`, `REVALIDATE_LISTS`, `toMovieSummary`, tipos (Task 2).
- Produces:
  - `mapMovieDetail(raw: any): MovieDetail`
    - `providers`: `raw["watch/providers"].results.BR.flatrate` (→ `[]` se ausente), ordem do TMDB.
    - `trailerUrl`: primeiro vídeo `site === "YouTube"` e `type === "Trailer"`, preferindo `iso_639_1 === "pt"`; → `https://www.youtube.com/watch?v=<key>`; senão `null`.
    - `certification`: primeiro `certification` não vazio em `release_dates.results` com `iso_3166_1 === "BR"`; senão `null`.
    - `cast`: 10 primeiros de `credits.cast`.
    - `recommendations`: até 20, via `toMovieSummary`.
    - `overview` vazio → `"Sinopse não disponível em português."`
    - `genres`: nomes.
  - `getMovieDetail(id: number): Promise<MovieDetail | null>` — `null` se TMDB responder 404; outros erros propagam. Params: `append_to_response`, `include_video_language: "pt-BR,en"`.
  - `getMovieProviderIds(id: number): Promise<number[]>` — `/movie/{id}/watch/providers`, ids de `results.BR.flatrate`, `REVALIDATE_LISTS`.
  - `annotateRecommendations(recs: MovieSummary[], myProviderIds: number[], lookup?: (id: number) => Promise<number[]>): Promise<AnnotatedMovie[]>` — se `myProviderIds` vazio: devolve na ordem original com `onMyStreamings: false` **sem chamar `lookup`**; senão consulta todos em paralelo, marca `onMyStreamings` se houver interseção, ordena os marcados primeiro mantendo a ordem relativa (estável); falha no `lookup` de um filme ⇒ `onMyStreamings: false` para ele. `lookup` padrão = `getMovieProviderIds`.

- [ ] **Step 1: Testes que falham:**
  - `mapMovieDetail(fixture)`: `providers.length > 0`, `trailerUrl` começa com `https://www.youtube.com/watch?v=`, `cast.length <= 10`, `recommendations.length <= 20`.
  - raw sem `results.BR` → `providers` `[]`; sem vídeos → `trailerUrl` `null`; `overview: ""` → texto padrão; `runtime: 0` mantido e `formatRuntime` cuida; sem `BR` em release_dates → `certification` `null`.
  - `getMovieDetail` com fetch 404 → `null`; com 500 → rejeita `TmdbError`.
  - `annotateRecommendations([a,b,c], [8], lookup)` onde só `c` tem `8` → ordem `[c,a,b]`, `c.onMyStreamings === true`.
  - `annotateRecommendations([a,b], [], lookup)` → `lookup` não chamado, ordem `[a,b]`.
  - `lookup` rejeitando para `b` → `b.onMyStreamings === false`, sem rejeitar o todo.
- [ ] **Step 2:** `npm test -- tests/lib/tmdb/movie.test.ts` → FAIL.
- [ ] **Step 3:** Gravar a fixture (curl com o token) e implementar `movie.ts`.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit: `feat: detalhe do filme e recomendações marcadas por streaming`

---

### Task 6: Busca e lista completa de provedores BR

**Files:**
- Create: `src/lib/tmdb/search.ts`
- Test: `tests/lib/tmdb/search.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `REVALIDATE_LISTS`, `REVALIDATE_STATIC`, `toMovieSummary`, `curatedProviderIds` (Task 3).
- Produces:
  - `searchMovies(query: string): Promise<MovieSummary[]>` — `query.trim()` vazio → `[]` sem chamar fetch; senão `/search/movie` com `query`, `region: "BR"`, `include_adult: "false"`, primeira página.
  - `getOtherBrProviders(): Promise<Provider[]>` — `/watch/providers/movie?watch_region=BR`, ordenado por `display_priority`, **excluindo** ids de `curatedProviderIds()`.

- [ ] **Step 1: Testes que falham:** `searchMovies("  ")` → `[]` e fetch não chamado; `searchMovies("duna")` → URL com `query=duna` e `include_adult=false`; `getOtherBrProviders()` com resposta contendo id `8` e `190` → só `190`.
- [ ] **Step 2:** `npm test -- tests/lib/tmdb/search.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `search.ts`.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Commit: `feat: busca de filmes e provedores extras do BR`

---

### Task 7: Layout, rodapé e tela principal em prateleiras

**Files:**
- Create: `src/components/PosterCard.tsx`, `Shelf.tsx`, `StreamingSelector.tsx`, `PersonalizeNotice.tsx`, `Footer.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Test: `tests/components/Shelf.test.tsx`, `tests/components/StreamingSelector.test.tsx`

**Interfaces:**
- Consumes: `getAllShelves` (T4), `getOtherBrProviders` (T6), `STREAMINGS`, `COOKIE_NAME`, `parseMyStreamings`, `serializeMyStreamings`, `providerIdsFor` (T3), `movieSlug`, `imageUrl`, `releaseYear` (T1).
- Produces:
  - `<PosterCard movie={MovieSummary} badge?: string />` — link para `/filme/${movieSlug(id,title)}`; pôster `w342`, ou bloco cinza com o título se `posterPath` nulo; `badge` opcional (usado na T8: "✓ nos seus streamings").
  - `<Shelf title={string} movies={MovieSummary[] | AnnotatedMovie[]} />` — renderiza `null` se `movies` vazio; rolagem horizontal com `overflow-x-auto` e `snap-x`.
  - `<StreamingSelector selected={string[]} others={Provider[]} />` (client) — chips dos `STREAMINGS`; botão "+" expande os `others` como chips `p<id>`; ao alternar grava `document.cookie = "meus_streamings=<valor>; path=/; max-age=31536000; samesite=lax"` e chama `router.refresh()`.
  - `<PersonalizeNotice />` — "Marque seus streamings para personalizar", exibido só quando `selected` vazio.
  - `<Footer />` — atribuição exata das Global Constraints + logo TMDB (SVG oficial em `public/tmdb-logo.svg`).
  - `src/app/page.tsx` (server): `await cookies()` → `parseMyStreamings` → `providerIdsFor` → `getAllShelves`; cabeçalho com nome provisório "CineCasa" e link 🔍 para `/busca`; `export const dynamic = "force-dynamic"` (depende do cookie; o cache fica nas chamadas ao TMDB).

- [ ] **Step 1: Testes que falham:**
  - `Shelf` com `movies=[]` → `container` vazio; com 2 filmes → 2 links com `href` `/filme/<slug>`.
  - `PosterCard` com `posterPath: null` → mostra o título em texto, sem `<img>`.
  - `StreamingSelector selected={["netflix"]}`: clicar em "Max" → `document.cookie` contém `meus_streamings=netflix%2Cmax` (ou `netflix,max`, de forma consistente com `parseMyStreamings`) e `refresh` (mock de `next/navigation`) chamado uma vez; clicar de novo em "Netflix" remove `netflix`.
- [ ] **Step 2:** `npm test -- tests/components` → FAIL.
- [ ] **Step 3:** Implementar componentes, layout (`<html lang="pt-BR">`, fundo escuro, `Footer`) e `page.tsx`.
- [ ] **Step 4:** `npm test -- tests/components` → PASS.
- [ ] **Step 5:** `npm run dev`, abrir `http://localhost:3000` com DevTools em 375px: prateleiras aparecem; marcar Netflix muda os filmes; sem marcação aparece o aviso; nenhuma rolagem horizontal da página; rodapé visível.
- [ ] **Step 6:** Commit: `feat: tela principal em prateleiras com Meus streamings`

---

### Task 8: Página do filme, compartilhamento e prévia de link

**Files:**
- Create: `src/app/filme/[slug]/page.tsx`, `src/components/ProviderList.tsx`, `src/components/ShareButton.tsx`, `src/app/not-found.tsx`
- Test: `tests/components/ProviderList.test.tsx`, `tests/components/ShareButton.test.tsx`

**Interfaces:**
- Consumes: `parseMovieSlug`, `movieSlug`, `formatRuntime`, `releaseYear`, `imageUrl` (T1); `getMovieDetail`, `annotateRecommendations` (T5); `parseMyStreamings`, `providerIdsFor` (T3); `Shelf`, `PosterCard` (T7).
- Produces:
  - `<ProviderList providers={Provider[]} myProviderIds={number[]} />` — logos `w185` + nome; os que a pessoa assina primeiro, com "✓ você assina"; lista vazia → "Não disponível em streaming por assinatura no Brasil".
  - `<ShareButton title={string} url={string} />` (client) — usa `navigator.share({ title, url })` se existir; senão `navigator.clipboard.writeText(url)` e mostra "Link copiado!".
  - Página: `const { slug } = await params`; `parseMovieSlug` nulo → `notFound()`; `getMovieDetail` nulo → `notFound()`. Mostra backdrop `w1280`, título, `ano · duração · gêneros · ★ nota (1 casa) · classificação`, `ProviderList`, botão "▶ Ver trailer" (link `target="_blank"`, só se `trailerUrl`), `ShareButton`, sinopse, elenco, e `Shelf` "Se gostou, veja também" com recomendações anotadas (badge "✓ nos seus streamings" em `onMyStreamings`).
  - `generateMetadata`: `title: "<Título> (<ano>)"`, `description`: sinopse até 160 caracteres, `openGraph.images: [imageUrl(posterPath,"w780")]`, `openGraph.type: "video.movie"`. `metadataBase` no layout a partir de `process.env.NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
  - `not-found.tsx`: "Filme não encontrado" + link para a página inicial.

- [ ] **Step 1: Testes que falham:**
  - `ProviderList providers=[Max(1899), Netflix(8)] myProviderIds=[8]` → primeiro item é Netflix e contém "✓ você assina"; Max não contém.
  - `ProviderList providers=[]` → texto "Não disponível em streaming por assinatura no Brasil".
  - `ShareButton` sem `navigator.share` → `clipboard.writeText` chamado com a URL e "Link copiado!" aparece; com `navigator.share` mockado → ele é chamado com `{ title, url }`.
- [ ] **Step 2:** `npm test -- tests/components/ProviderList.test.tsx tests/components/ShareButton.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Mesmo comando → PASS.
- [ ] **Step 5:** Manual: `/filme/872585-oppenheimer` abre; `/filme/872585-titulo-errado` também abre; `/filme/abc` e `/filme/999999999-x` mostram "Filme não encontrado"; `curl -s http://localhost:3000/filme/872585-oppenheimer | grep og:image` encontra a tag.
- [ ] **Step 6:** Commit: `feat: página do filme com onde assistir e compartilhamento`

---

### Task 9: Busca, página de erro e publicação

**Files:**
- Create: `src/app/busca/page.tsx`, `src/app/error.tsx`, `README.md`
- Test: `tests/components/ErrorPage.test.tsx`

**Interfaces:**
- Consumes: `searchMovies` (T6), `PosterCard` (T7).
- Produces:
  - `/busca?q=<texto>`: formulário GET com campo (autofocus) "Buscar filme…"; resultados em grade de `PosterCard`; `q` vazio → só o campo; sem resultados → "Nenhum filme encontrado para "<q>"". Sem filtro por streaming (spec 7.3.1).
  - `error.tsx` (client, recebe `reset`): "Não conseguimos carregar os filmes agora. Tente de novo em instantes." + botão "Tentar de novo" que chama `reset()`.
  - `README.md`: como obter o token TMDB, criar `.env.local`, `npm run dev`, `npm test`, variáveis na Vercel (`TMDB_READ_ACCESS_TOKEN`, `NEXT_PUBLIC_SITE_URL`).

- [ ] **Step 1: Teste que falha:** `ErrorPage` renderiza a mensagem exata e clicar "Tentar de novo" chama `reset` uma vez.
- [ ] **Step 2:** `npm test -- tests/components/ErrorPage.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar busca, erro e README.
- [ ] **Step 4:** `npm test` (suite toda) → PASS; `npm run lint` e `npm run build` → sem erros.
- [ ] **Step 5:** Manual: buscar "duna" lista filmes; abrir um sem streaming mostra o aviso; com `TMDB_READ_ACCESS_TOKEN` inválido no `.env.local`, a home mostra a página de erro (restaurar o token depois).
- [ ] **Step 6:** Commit: `feat: busca, página de erro e README`
- [ ] **Step 7: Publicação (confirmar com o usuário antes):** criar projeto na Vercel ligado ao repositório (requer conta do usuário), configurar as duas variáveis de ambiente, publicar; colar o link de um filme no WhatsApp e conferir a prévia com pôster.
