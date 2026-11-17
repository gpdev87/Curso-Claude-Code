-- Contas e listas pessoais (CineCasa). Cole no SQL Editor do Supabase.

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

alter table public.movie_marks enable row level security;
alter table public.user_settings enable row level security;

create policy "movie_marks_select" on public.movie_marks for select using (auth.uid() = user_id);
create policy "movie_marks_insert" on public.movie_marks for insert with check (auth.uid() = user_id);
create policy "movie_marks_update" on public.movie_marks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "movie_marks_delete" on public.movie_marks for delete using (auth.uid() = user_id);

create policy "user_settings_select" on public.user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_settings_delete" on public.user_settings for delete using (auth.uid() = user_id);
