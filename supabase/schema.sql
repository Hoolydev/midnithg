-- ============================================
-- Midnight AI – Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable pgvector for embeddings
create extension if not exists vector with schema extensions;

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'creator')),
  credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- PROJECTS
-- ============================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  genre text not null default 'romance',
  classification text default 'adult',
  target_audience text,
  tone text default 'dark',
  structure text default 'three_acts',
  summary text,
  cover_url text,
  word_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'writing', 'review', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ============================================
-- CHARACTERS
-- ============================================
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  age text,
  personality text,
  backstory text,
  role text default 'supporting' check (role in ('protagonist', 'antagonist', 'love_interest', 'supporting', 'mentor', 'other')),
  appearance text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

create policy "Users can manage own characters"
  on public.characters for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = characters.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================
-- CHAPTERS
-- ============================================
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  number integer not null,
  title text,
  content text default '',
  summary text,
  word_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'writing', 'review', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chapters enable row level security;

create policy "Users can manage own chapters"
  on public.chapters for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = chapters.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================
-- EVENTS (timeline)
-- ============================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete set null,
  description text not null,
  timeline_position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Users can manage own events"
  on public.events for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = events.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================
-- IMAGES
-- ============================================
create table public.images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete set null,
  prompt_used text not null,
  style text,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.images enable row level security;

create policy "Users can manage own images"
  on public.images for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = images.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================
-- EMBEDDINGS (vector storage for project memory)
-- ============================================
create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete set null,
  content_chunk text not null,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

alter table public.embeddings enable row level security;

create policy "Users can manage own embeddings"
  on public.embeddings for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = embeddings.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Create an index for vector similarity search
create index on public.embeddings
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- ============================================
-- HELPER FUNCTION: Match embeddings by similarity
-- ============================================
create or replace function public.match_embeddings(
  query_embedding extensions.vector(1536),
  match_project_id uuid,
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content_chunk text,
  similarity float
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.content_chunk,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from public.embeddings
  where embeddings.project_id = match_project_id
    and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();

create trigger update_characters_updated_at
  before update on public.characters
  for each row execute procedure public.update_updated_at();

create trigger update_chapters_updated_at
  before update on public.chapters
  for each row execute procedure public.update_updated_at();

-- Storage Bucket Setup (Run this if you haven't created the bucket in dashboard)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );


create policy "Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'images' );

-- Public Access Policies
create policy "Public projects are viewable by everyone"
  on projects for select
  using ( visibility = 'public' );

create policy "Public project chapters are viewable"
  on chapters for select
  using ( exists (select 1 from projects where id = chapters.project_id and visibility = 'public') );


create policy "Public project characters are viewable"
  on characters for select
  using ( exists (select 1 from projects where id = characters.project_id and visibility = 'public') );

-- User Goals
create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  daily_word_count_goal integer default 500,
  current_streak integer default 0,
  last_wrote_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.user_goals enable row level security;

create policy "Users can manage own goals"
  on user_goals for all
  using (auth.uid() = user_id);


