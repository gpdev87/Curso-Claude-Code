# Catálogo de filmes em streaming — Design

Data: 2026-11-16
Status: rascunho para aprovação

## 1. Intenção e o porquê

Um site para família e amigos descobrirem **recomendações de filmes** e saberem **onde assisti-los** nos streamings disponíveis no Brasil. A situação principal que o app resolve é:

> "Quero ver algo hoje — o que tem de bom nos **meus** streamings?"

O público é um grupo pequeno e conhecido, que vai receber o link (ex.: no WhatsApp). Não é um produto público nem comercial.

As recomendações vêm do próprio **TMDB** (em alta, mais bem avaliados, gêneros, "parecidos com este"), não de indicações entre as pessoas do grupo.

## 2. Objetivos

- Tela principal em **prateleiras** (fileiras horizontais por tema) mostrando filmes disponíveis por **assinatura** nos streamings do Brasil.
- Cada pessoa marca **"Meus streamings"** (Netflix, Max, Prime Video, Disney+, Globoplay…) e as prateleiras mostram apenas filmes desses serviços.
- **Página do filme** com informações para decidir e **onde assistir**.
- **Link compartilhável** por filme, com prévia (pôster + título) ao colar no WhatsApp.
- Funciona bem no **celular** (acesso por link, sem instalação).
- Tudo em **português (pt-BR)**, região fixa **BR**.

## 3. Não-objetivos (fora desta versão)

- Séries.
- Aluguel e compra (Apple TV, Google Play etc.) — só streaming por assinatura.
- Login, contas, listas pessoais, indicações entre pessoas do grupo.
- Outros países / troca de região.
- App nativo (lojas de app).
- Filtro "só para crianças/família" (a classificação indicativa aparece na página do filme, mas não há filtro por ela).
- Link direto para o filme dentro do serviço de streaming (a API do TMDB não fornece).

## 4. Anti-objetivos (seria um fracasso mesmo funcionando)

- Recomendar filmes que a pessoa **não consegue assistir** nos streamings que marcou.
- Site lento ou pesado no celular.
- Exigir cadastro/login para usar.
- Link compartilhado que chega no WhatsApp "pelado", sem prévia do filme.

## 5. Restrições

- **Fonte de dados:** API do TMDB (v3). Os dados de "onde assistir" vêm da JustWatch via TMDB, por região (`watch_region=BR`).
- **Atribuição obrigatória:** exibir o logo/aviso do TMDB ("This product uses the TMDB API but is not endorsed or certified by TMDB") e crédito à JustWatch nos dados de streaming.
- **Limite de paginação:** `/discover/movie` retorna no máximo 500 páginas (~10 mil filmes) por consulta. Não há uma "lista com todos os filmes" — sempre listas filtradas/ordenadas.
- **Sem "data de chegada no streaming":** o TMDB não informa quando um filme entrou num serviço. A prateleira "Recém-lançados" usa a **data de lançamento do filme**, não a data de chegada ao streaming.
- **Chave da API** não pode ficar exposta no navegador.
- Hospedagem gratuita (plano free da Vercel).
- **Pré-requisito:** ter conta no TMDB e um *API Read Access Token*.

## 6. Abordagens consideradas

| Abordagem | Vantagens | Desvantagens |
|---|---|---|
| **Next.js com parte servidor** (escolhida) | Chave do TMDB fica no servidor; cache das respostas (rápido, menos chamadas); páginas geradas no servidor → **prévia do link no WhatsApp** funciona | Um pouco mais para aprender/configurar |
| Site só no navegador (React + Vite) | Mais simples; hospedagem estática | Chave do TMDB exposta; **sem prévia** ao compartilhar link |
| App de celular (React Native/Expo) | Experiência de app | Exige instalação — atrapalha o "manda o link pro grupo". Descartado. |

**Escolha do usuário:** Next.js. Motivo principal: a prévia do filme ao compartilhar o link, que serve diretamente ao objetivo de família/amigos trocarem filmes.

## 7. O que foi decidido

### 7.1 Tela principal — Prateleiras (escolhida pelo usuário, a partir de mockups)

```
┌─────────────────────────────┐
│ 🎬 [Nome do app]        🔍  │
│ [Netflix✓][Max✓][Prime][+]  │  ← Meus streamings
│ 🔥 Em alta nos seus streamings│
│ [▢][▢][▢][▢] →              │
│ ⭐ Mais bem avaliados        │
│ [▢][▢][▢][▢] →              │
│ 🆕 Recém-lançados            │
│ [▢][▢][▢][▢] →              │
│ 😂 Comédia / 💥 Ação / ...   │
│ Dados: TMDB · JustWatch     │
└─────────────────────────────┘
```

- Seletor **"Meus streamings"** no topo (chips liga/desliga).
- Prateleiras, nesta ordem: **Em alta**, **Mais bem avaliados**, **Recém-lançados**, depois uma por gênero (Comédia, Ação, Terror, Família, Drama, Animação, Romance, Ficção científica…).
- Cada prateleira é rolável na horizontal; tocar num pôster abre a página do filme.
- Ícone de **busca** no canto (secundário).
- Rodapé com atribuição TMDB + JustWatch.

### 7.2 Página do filme (proposta aceita pelo usuário)

- Imagem de fundo/pôster, título, ano, duração, gêneros, nota, **classificação indicativa (BR)**.
- **Onde assistir:** serviços por assinatura no Brasil; os que a pessoa marcou aparecem destacados ("✓ você assina").
- Botão **Ver trailer** (vídeo do YouTube via TMDB).
- Botão **Compartilhar** (link próprio do filme).
- Sinopse, elenco principal.
- **"Se gostou, veja também"** (recomendações do TMDB) — **decisão do usuário:** mostra todas as recomendações, mas as disponíveis nos streamings da pessoa vêm **primeiro** e marcadas com "✓ nos seus streamings". Para isso, consultar onde cada recomendação está (≈20 chamadas extras por página), com cache no servidor.

### 7.3 "Meus streamings"

- Escolha salva **no aparelho** da pessoa, sem login.
- **Decisão do usuário:** lista curta curada à mão — Netflix, Prime Video, Max, Disney+, Globoplay, Apple TV+, Paramount+, Mercado Play. Cada chip agrupa vários IDs de provedor do TMDB (ex.: Netflix + "Netflix Basic with Ads"; Prime Video + versão com anúncios). Canais dentro do Prime ("Paramount+ Amazon Channel", "Apple TV+ Amazon Channel" etc.) contam como o serviço original (o chip Paramount+ inclui o canal Amazon). Os demais provedores do BR ficam atrás do "+".
- Quando nada está marcado: mostrar filmes de **qualquer** streaming por assinatura no Brasil, com um aviso "Marque seus streamings para personalizar" (sem etapa obrigatória de escolha).

### 7.3.1 Busca

- Sem filtro por streaming: quem busca um filme específico quer saber onde ele está, mesmo que não assine. A página do filme mostra onde assistir.

### 7.4 Compartilhamento

- Cada filme tem URL própria e estável.
- A página do filme gera metadados Open Graph (título, sinopse curta, pôster) para a prévia no WhatsApp/redes.

### 7.5 Stack (decisão de como construir — escolhida pelo usuário: Next.js)

- Next.js com TypeScript, hospedado na Vercel (plano gratuito).
- Token do TMDB em variável de ambiente no servidor (`TMDB_READ_ACCESS_TOKEN`); o navegador nunca chama o TMDB diretamente (exceto imagens, servidas pelo CDN público do TMDB `image.tmdb.org`).

## 8. Referência rápida da API TMDB (para o construtor)

- Lista de serviços no BR: `GET /watch/providers/movie?watch_region=BR&language=pt-BR`
- Gêneros: `GET /genre/movie/list?language=pt-BR`
- Prateleiras: `GET /discover/movie` com `watch_region=BR`, `with_watch_monetization_types=flatrate`, `with_watch_providers=8|1899|…` (OU entre serviços com `|`), `language=pt-BR`, e:
  - Em alta: `sort_by=popularity.desc`
  - Mais bem avaliados: `sort_by=vote_average.desc` + `vote_count.gte` (ex.: 300) para evitar filmes com poucos votos
  - Recém-lançados: `sort_by=primary_release_date.desc` + `primary_release_date.lte=<hoje>`
  - Por gênero: `with_genres=<id>` + `sort_by=popularity.desc`
- Detalhe: `GET /movie/{id}?language=pt-BR&append_to_response=watch/providers,videos,credits,release_dates,recommendations`
- Busca: `GET /search/movie?query=…&language=pt-BR&region=BR`
- Documentação: https://developer.themoviedb.org/docs/getting-started

## 9. Decisões tomadas por mim (Claude) — revisar

- Região fixa BR e idioma pt-BR.
- Ordem e lista de prateleiras (seção 7.1) e o limite `vote_count.gte` para "Mais bem avaliados".
- "Recém-lançados" = data de lançamento do filme (limitação da API).
- Sem streamings marcados → mostra todos os streamings por assinatura, com aviso para personalizar.
- Busca sem filtro por streaming.
- Classificação indicativa exibida, sem filtro.
- TypeScript.

## 10. Deixado para quem for construir

- Nome do app e identidade visual (o "CineCasa" dos mockups foi só exemplo).
- Estilo/biblioteca de CSS, componentes e estrutura de pastas.
- Tempo exato de cache das respostas do TMDB.
- Formato exato das URLs (ex.: `/filme/872585-oppenheimer`).
- Como a busca apresenta resultados de filmes que não estão em nenhum streaming.
- Levantar os IDs exatos de provedores do BR para o mapeamento dos chips (via `/watch/providers/movie?watch_region=BR`).
- Estratégia de testes.
