# CineCasa — o que tem de bom nos seus streamings

Catálogo de filmes para família e amigos: mostra, em prateleiras, os filmes disponíveis por assinatura nos streamings do Brasil, filtrados pelos serviços que cada pessoa marca em "Meus streamings".

Dados do [TMDB](https://www.themoviedb.org); disponibilidade em streaming fornecida pela JustWatch.

## Preparar

1. Crie uma conta em https://www.themoviedb.org e, em **Configurações → API**, copie o **API Read Access Token** (o token longo, não a "API Key").
2. Copie `.env.example` para `.env.local` e preencha:
   ```
   TMDB_READ_ACCESS_TOKEN=<seu token>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. `npm install`

## Comandos

- `npm run dev`: abre em http://localhost:3000
- `npm test`: roda os testes
- `npm run lint` / `npm run build`
- `node scripts/list-br-providers.mjs`: lista os streamings do TMDB no Brasil (use para conferir os IDs em `src/lib/streamings.ts`)

## Publicar na Vercel

1. Importe o repositório em https://vercel.com/new.
2. Em **Environment Variables**, defina `TMDB_READ_ACCESS_TOKEN` e `NEXT_PUBLIC_SITE_URL` (a URL final, ex.: `https://cinecasa.vercel.app`).
3. Publique e teste colando o link de um filme no WhatsApp: deve aparecer a prévia com o pôster.

## Documentos

- Design: `docs/superpowers/specs/2026-11-16-catalogo-filmes-design.md`
- Plano: `docs/superpowers/plans/2026-11-17-catalogo-filmes.md`
