-- Écoles237 MVP - Supabase PostgreSQL schema
-- Execute this file inside Supabase SQL Editor.

create type user_role as enum ('parent', 'establishment_admin', 'platform_admin');
create type main_category as enum ('garderie', 'primaire', 'secondaire', 'superieur', 'autres');
create type application_status as enum ('pending', 'reviewed', 'accepted', 'rejected');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role default 'parent',
  created_at timestamptz default now()
);

create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text unique not null,
  main_category main_category not null,
  sub_category text,
  ownership_type text,
  description text,
  region text,
  department text,
  city text not null,
  arrondissement text,
  neighborhood text,
  address text,
  latitude numeric,
  longitude numeric,
  phone text,
  whatsapp text,
  email text,
  website text,
  logo_url text,
  cover_image_url text,
  is_verified boolean default false,
  is_featured boolean default false,
  accepts_online_payment boolean default false,
  subscription_plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.fees (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  registration_fee integer default 0,
  tuition_fee integer default 0,
  transport_fee integer default 0,
  canteen_fee integer default 0,
  uniform_fee integer default 0,
  exam_fee integer default 0,
  other_fees integer default 0,
  currency text default 'FCFA',
  created_at timestamptz default now()
);

create table public.infrastructures (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  library boolean default false,
  laboratory boolean default false,
  computer_room boolean default false,
  sports_field boolean default false,
  canteen boolean default false,
  boarding boolean default false,
  transport boolean default false,
  security boolean default false,
  wifi boolean default false,
  infirmary boolean default false,
  created_at timestamptz default now()
);

create table public.establishment_images (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  image_url text not null,
  caption text,
  is_banner boolean default false,
  created_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  title text not null,
  document_type text default 'registration_form',
  file_url text not null,
  created_at timestamptz default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete set null,
  establishment_id uuid references public.establishments(id) on delete cascade,
  student_name text not null,
  student_age integer,
  student_level text,
  parent_name text,
  parent_phone text,
  parent_email text,
  message text,
  status application_status default 'pending',
  created_at timestamptz default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  amount integer not null,
  method text check (method in ('orange_money', 'mtn_momo', 'cash', 'bank')),
  status payment_status default 'pending',
  transaction_reference text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.establishments enable row level security;
alter table public.fees enable row level security;
alter table public.infrastructures enable row level security;
alter table public.establishment_images enable row level security;
alter table public.documents enable row level security;
alter table public.applications enable row level security;
alter table public.payments enable row level security;

-- Public read policies for marketplace pages
create policy "Public can read establishments" on public.establishments for select using (true);
create policy "Public can read fees" on public.fees for select using (true);
create policy "Public can read infrastructures" on public.infrastructures for select using (true);
create policy "Public can read images" on public.establishment_images for select using (true);
create policy "Public can read documents" on public.documents for select using (true);

-- Users can view/update their own profile
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Establishment owners can manage their own establishments
create policy "Owners can insert establishments" on public.establishments for insert with check (auth.uid() = owner_id);
create policy "Owners can update own establishments" on public.establishments for update using (auth.uid() = owner_id);

-- Parents can create applications; owners can read applications for their establishments
create policy "Anyone authenticated can create applications" on public.applications for insert with check (auth.uid() is not null);
create policy "Parents can read own applications" on public.applications for select using (auth.uid() = parent_id);
create policy "Owners can read establishment applications" on public.applications for select using (
  exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
);
