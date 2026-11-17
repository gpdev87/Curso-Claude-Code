# Página de categoria com ordenação por nota — Design (curto)

Data: 2026-11-17 · Status: aguardando aprovação · Base: `2026-11-16-catalogo-filmes-design.md`

## Intenção
Permitir escolher uma categoria (gênero) e ver **todos** os filmes dela disponíveis nos "Meus streamings", ordenados por **Em alta** ou **Mais bem avaliados** — para achar "o melhor terror da Netflix" sem depender das 20 da prateleira.

## Objetivos
- Prateleiras de gênero da tela inicial ganham **"Ver tudo ›"** → página da categoria.
- Página `/categoria/<slug>?ordem=nota` (padrão sem `ordem` = Em alta):
  - chips para trocar de categoria: **Todas** + 19 gêneros do TMDB (as 8 da tela inicial primeiro);
  - alternador **Em alta** / **★ Mais bem avaliados**;
  - grade de pôsteres com a nota (★ 7.8) em cada filme;
  - **Carregar mais** (20 por vez).
- Filtra pelos "Meus streamings" (cookie), igual à tela inicial; sem streamings marcados, todos os streamings por assinatura do BR.
- "Ver tudo" da prateleira **Mais bem avaliados** → `/categoria/todas?ordem=nota`.

## Não-objetivos
- Nota do IMDb (decisão do usuário: usar a nota do TMDB).
- Novas prateleiras na tela inicial (continuam as 8 de gênero).
- Filtros extras (ano, duração, classificação).

## Anti-objetivos
- Topo de "Mais bem avaliados" cheio de filmes obscuros com poucos votos.
- Link compartilhado que não reproduz a mesma categoria/ordem.

## Restrições
- Mesma API: `/discover/movie` com `with_genres`, `sort_by`, `page`, `watch_region=BR`, `with_watch_monetization_types=flatrate`, `with_watch_providers`.
- "Mais bem avaliados" = `sort_by=vote_average.desc` + `vote_count.gte=300` (mesma regra da prateleira atual). "Em alta" = `popularity.desc`.
- Limite do TMDB de 500 páginas por consulta (irrelevante na prática).

## Abordagens
| Abordagem | Trade-off | Escolha |
|---|---|---|
| **Página própria da categoria** | Tela inicial intacta; link próprio por categoria+ordem; voltar funciona | **Escolhida pelo usuário** (mockup A) |
| Filtro na tela inicial | Tudo numa tela, mas a tela inicial fica carregada | Descartada |
| Buscar e ordenar no próprio app | Mais lento e limitado a poucos filmes | Descartada: o TMDB já ordena |

## Decidido (propostas aceitas pelo usuário)
- URL `/categoria/<slug>?ordem=nota`; padrão Em alta.
- 19 gêneros do TMDB + "Todas"; as 8 da tela inicial primeiro.
- Mínimo de 300 votos em "Mais bem avaliados".
- Nota visível na grade; 20 filmes por "Carregar mais".

## Deixado para quem construir
- Slugs em português para cada gênero (ex.: `ficcao-cientifica`) e slug inválido → 404.
- Como o "Carregar mais" busca a próxima página (ação de servidor ou rota interna) mantendo o token só no servidor.
- Visual seguindo a identidade atual (sala/projetor).
- Testes.
