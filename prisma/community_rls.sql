alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_select_all'
  ) then
    create policy posts_select_all on public.posts
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_insert_own'
  ) then
    create policy posts_insert_own on public.posts
      for insert with check (auth.uid() = author_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_update_own'
  ) then
    create policy posts_update_own on public.posts
      for update using (auth.uid() = author_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_delete_own'
  ) then
    create policy posts_delete_own on public.posts
      for delete using (auth.uid() = author_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_select_all'
  ) then
    create policy comments_select_all on public.comments
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_insert_own'
  ) then
    create policy comments_insert_own on public.comments
      for insert with check (auth.uid() = author_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_delete_own'
  ) then
    create policy comments_delete_own on public.comments
      for delete using (auth.uid() = author_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'post_likes_select_all'
  ) then
    create policy post_likes_select_all on public.post_likes
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'post_likes_insert_own'
  ) then
    create policy post_likes_insert_own on public.post_likes
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'post_likes_delete_own'
  ) then
    create policy post_likes_delete_own on public.post_likes
      for delete using (auth.uid() = user_id);
  end if;
end $$;
