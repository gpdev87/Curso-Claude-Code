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

## Contas (Supabase)

O site funciona sem login. Contas (e-mail e senha) guardam as listas "Quero assistir" e "Já assisti" e os streamings. Sem as variáveis do Supabase, o site continua funcionando normalmente, só sem contas.

1. Crie um projeto em https://supabase.com e copie a **URL** e a **publishable key** (Project Settings → API) para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `.env.local`.
2. Cole o SQL de `supabase/migrations/20261117000000_contas_e_listas.sql` no **SQL Editor** e execute.
3. Em **Authentication → Sign In / Providers**, deixe **Email** ligado e **Confirm email** desligado.
4. Em **Authentication → URL Configuration**, ponha em **Site URL** o domínio da Vercel e, em **Redirect URLs**, `http://localhost:3000/**` e o domínio.
5. SMTP (para o e-mail de redefinir senha): use o Gmail com senha de app (ative a verificação em 2 etapas e crie a senha em https://myaccount.google.com/apppasswords). Host `smtp.gmail.com`, porta 465 ou 587, usuário = o seu Gmail.
6. Em **Authentication → Email Templates**, edite o modelo **Reset Password** em português, com o link `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha`.
7. Na Vercel, defina as mesmas duas variáveis em **Environment Variables**.
8. O projeto gratuito do Supabase pausa após cerca de 1 semana sem uso; reative no painel.

## Documentos

- Design: `docs/superpowers/specs/2026-11-16-catalogo-filmes-design.md`
- Plano: `docs/superpowers/plans/2026-11-17-catalogo-filmes.md`
