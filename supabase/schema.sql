create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9а-яё-]+$'),
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_url text not null default '',
  category text not null default 'Новости',
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  recommended boolean not null default false,
  reading_minutes integer not null default 3 check (reading_minutes between 1 and 999),
  views bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 50),
  body text not null check (char_length(body) between 2 and 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reaction text not null check (reaction in ('like','fire','idea')),
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique(post_id, visitor_id)
);

create or replace function public.is_blog_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.increment_post_views(post_id_input uuid) returns void language sql security definer set search_path = public as $$
  update public.posts set views = views + 1 where id = post_id_input and status = 'published';
$$;

alter table public.admin_users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;

drop policy if exists "admins read themselves" on public.admin_users;
drop policy if exists "published posts are public" on public.posts;
drop policy if exists "admins create posts" on public.posts;
drop policy if exists "admins update posts" on public.posts;
drop policy if exists "admins delete posts" on public.posts;
drop policy if exists "approved comments are public" on public.comments;
drop policy if exists "visitors submit comments" on public.comments;
drop policy if exists "admins moderate comments" on public.comments;
drop policy if exists "reactions are public" on public.post_reactions;
drop policy if exists "visitors react" on public.post_reactions;
drop policy if exists "visitors change reaction" on public.post_reactions;

create policy "admins read themselves" on public.admin_users for select using (user_id = auth.uid());
create policy "published posts are public" on public.posts for select using (status = 'published' or public.is_blog_admin());
create policy "admins create posts" on public.posts for insert with check (public.is_blog_admin());
create policy "admins update posts" on public.posts for update using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy "admins delete posts" on public.posts for delete using (public.is_blog_admin());
create policy "approved comments are public" on public.comments for select using (approved or public.is_blog_admin());
create policy "visitors submit comments" on public.comments for insert with check (approved = false);
create policy "admins moderate comments" on public.comments for all using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy "reactions are public" on public.post_reactions for select using (true);
create policy "visitors react" on public.post_reactions for insert with check (true);
create policy "visitors change reaction" on public.post_reactions for update using (true) with check (true);

insert into storage.buckets (id, name, public) values ('blog-media', 'blog-media', true) on conflict (id) do update set public = true;
drop policy if exists "blog media public read" on storage.objects;
drop policy if exists "admins upload blog media" on storage.objects;
drop policy if exists "admins update blog media" on storage.objects;
drop policy if exists "admins delete blog media" on storage.objects;
create policy "blog media public read" on storage.objects for select using (bucket_id = 'blog-media');
create policy "admins upload blog media" on storage.objects for insert with check (bucket_id = 'blog-media' and public.is_blog_admin());
create policy "admins update blog media" on storage.objects for update using (bucket_id = 'blog-media' and public.is_blog_admin());
create policy "admins delete blog media" on storage.objects for delete using (bucket_id = 'blog-media' and public.is_blog_admin());

grant execute on function public.increment_post_views(uuid) to anon, authenticated;

-- После регистрации администратора выполните, заменив email:
-- insert into public.admin_users(user_id) select id from auth.users where email = 'you@example.com';
