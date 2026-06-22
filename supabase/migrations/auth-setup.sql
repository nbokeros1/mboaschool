-- ============================================================
-- Écoles237 — Configuration Auth Supabase
-- Exécuter dans le SQL Editor de Supabase après le schema.sql
-- ============================================================

-- 1. Permettre aux utilisateurs de créer leur propre profil
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Trigger : créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    'parent'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Autoriser les pré-inscriptions publiques (sans compte requis)
-- Remplace la policy existante "Anyone authenticated can create applications"
drop policy if exists "Anyone authenticated can create applications" on public.applications;

create policy "Public can create applications"
  on public.applications for insert
  with check (true);

-- 4. Permettre aux owners de mettre à jour le statut des candidatures
create policy "Owners can update application status"
  on public.applications for update
  using (
    exists (
      select 1 from public.establishments e
      where e.id = establishment_id
      and e.owner_id = auth.uid()
    )
  );

-- 5. Permettre aux owners de gérer les frais, infra, images, docs de leur école
create policy "Owners can insert fees" on public.fees for insert
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Owners can update fees" on public.fees for update
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Owners can insert infrastructure" on public.infrastructures for insert
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Owners can update infrastructure" on public.infrastructures for update
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Owners can insert images" on public.establishment_images for insert
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Owners can delete images" on public.establishment_images for delete
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Owners can insert documents" on public.documents for insert
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Owners can delete documents" on public.documents for delete
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

-- 6. Gestion des classes par les owners
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  name text not null,
  level text,
  teacher_name text,
  created_at timestamptz default now()
);

alter table public.classes enable row level security;

create policy "Owners can manage classes" on public.classes for all
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Public can read classes" on public.classes for select using (true);

-- 7. Gestion des annonces
create table if not exists public.school_announcements (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  title text not null,
  content text,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.school_announcements enable row level security;

create policy "Owners can manage announcements" on public.school_announcements for all
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Public can read announcements" on public.school_announcements for select using (true);

-- 8. Tables pour les images et documents uploadés via Storage
-- ============================================================

create table if not exists public.school_images (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  url text not null,
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);

alter table public.school_images enable row level security;

create policy "Owners can manage school images" on public.school_images for all
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Public can read school images" on public.school_images for select using (true);


create table if not exists public.school_documents (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references public.establishments(id) on delete cascade,
  name text not null,
  type text default 'autre',
  url text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

alter table public.school_documents enable row level security;

create policy "Owners can manage school documents" on public.school_documents for all
  using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
  );

create policy "Public can read school documents" on public.school_documents for select using (true);


-- 9. Buckets Supabase Storage (à créer dans le dashboard Supabase)
-- ============================================================
-- Supabase Dashboard → Storage → New bucket
--
-- Bucket 1 : school-images
--   - Public : OUI
--   - Allowed MIME types : image/jpeg, image/png, image/webp, image/gif
--   - Max upload size : 5 MB
--
-- Bucket 2 : school-documents
--   - Public : OUI
--   - Allowed MIME types : application/pdf, application/msword,
--       application/vnd.openxmlformats-officedocument.*
--   - Max upload size : 10 MB
--
-- Policies Storage (via Dashboard → Storage → Policies) :
--   Pour chaque bucket, créer une policy permettant :
--   - INSERT : pour les utilisateurs authentifiés (auth.uid() is not null)
--   - SELECT : pour tout le monde (true)
--   - DELETE : pour les utilisateurs authentifiés (auth.uid() is not null)
-- ============================================================

-- 10. GRANTS explicites (obligatoire après mai 2026 pour les nouveaux projets)
-- ============================================================
-- Sans ces grants, PostgREST / supabase-js ne peut pas accéder aux tables
-- via l'API REST même si RLS est configuré.

grant usage on schema public to anon, authenticated;

-- applications : anon peut insérer (pré-inscription sans compte)
grant select, insert on table public.applications to anon;
grant all on table public.applications to authenticated;

-- classes
grant select on table public.classes to anon, authenticated;
grant insert, update, delete on table public.classes to authenticated;

-- school_announcements
grant select on table public.school_announcements to anon, authenticated;
grant insert, update, delete on table public.school_announcements to authenticated;

-- school_images
grant select on table public.school_images to anon, authenticated;
grant insert, update, delete on table public.school_images to authenticated;

-- school_documents
grant select on table public.school_documents to anon, authenticated;
grant insert, update, delete on table public.school_documents to authenticated;

-- ============================================================
-- NOTE : Pour désactiver la confirmation email en développement
-- Supabase Dashboard → Authentication → Settings →
--   "Enable email confirmations" → OFF
-- ============================================================
