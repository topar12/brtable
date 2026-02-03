create table if not exists public.posts (
  id text primary key default gen_random_uuid()::text,
  category_id text not null default 'CHAT',
  title text not null,
  content text not null,
  images text[] not null default '{}',
  view_count integer not null default 0,
  author_id uuid not null references public.user_profiles(user_id),
  pet_id uuid references public.pet_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id text primary key default gen_random_uuid()::text,
  post_id text not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.user_profiles(user_id),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id text not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_category_id_idx on public.posts(category_id);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists post_likes_user_id_idx on public.post_likes(user_id);
