-- =============================================================
-- Portfolio photo : schéma initial
-- Tables : admins, photos, tags, photo_tags + bucket Storage "photos"
-- Lecture publique des photos publiées, écriture réservée aux admins.
-- =============================================================


-- -------------------------------------------------------------
-- Admins
-- Liste des comptes autorisés à gérer le contenu.
-- Aucune policy : la table n'est pas lisible via l'API,
-- seule la fonction is_admin() (security definer) la consulte.
-- -------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;


-- -------------------------------------------------------------
-- updated_at automatique
-- -------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -------------------------------------------------------------
-- Photos
-- Les fichiers sont dans le bucket "photos" sous {storage_key}/{taille}.webp,
-- une variante par largeur listée dans "sizes" (ex : {480, 960, 1600, 2560}).
-- -------------------------------------------------------------
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text,
  description   text,

  -- Fichiers
  storage_key   text not null unique,
  width         integer not null check (width > 0),
  height        integer not null check (height > 0),
  sizes         integer[] not null check (cardinality(sizes) > 0),
  thumbhash     text,

  -- EXIF
  camera        text,
  lens          text,
  focal_length  numeric(6, 1) check (focal_length > 0),   -- mm
  aperture      numeric(4, 1) check (aperture > 0),       -- f/
  exposure_time numeric       check (exposure_time > 0),  -- secondes (1/250 → 0.004)
  iso           integer       check (iso > 0),
  taken_at      timestamptz,

  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index photos_published_taken_at_idx
  on public.photos (published, taken_at desc nulls last);

create trigger photos_set_updated_at
  before update on public.photos
  for each row execute function public.set_updated_at();

alter table public.photos enable row level security;

create policy "Published photos are public"
  on public.photos for select
  to anon, authenticated
  using (published or (select public.is_admin()));

create policy "Admins can insert photos"
  on public.photos for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update photos"
  on public.photos for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete photos"
  on public.photos for delete
  to authenticated
  using ((select public.is_admin()));


-- -------------------------------------------------------------
-- Tags (filtres)
-- -------------------------------------------------------------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

create policy "Tags are public"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "Admins can insert tags"
  on public.tags for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update tags"
  on public.tags for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete tags"
  on public.tags for delete
  to authenticated
  using ((select public.is_admin()));


-- -------------------------------------------------------------
-- Photo <-> Tags
-- -------------------------------------------------------------
create table public.photo_tags (
  photo_id uuid not null references public.photos (id) on delete cascade,
  tag_id   uuid not null references public.tags (id) on delete cascade,
  primary key (photo_id, tag_id)
);

create index photo_tags_tag_id_idx on public.photo_tags (tag_id);

alter table public.photo_tags enable row level security;

create policy "Tags of published photos are public"
  on public.photo_tags for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.photos p
      where p.id = photo_id and p.published
    )
    or (select public.is_admin())
  );

create policy "Admins can insert photo tags"
  on public.photo_tags for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can delete photo tags"
  on public.photo_tags for delete
  to authenticated
  using ((select public.is_admin()));


-- -------------------------------------------------------------
-- Droits API (RLS filtre ensuite ligne par ligne)
-- -------------------------------------------------------------
grant select on public.photos, public.tags, public.photo_tags to anon, authenticated;
grant insert, update, delete on public.photos, public.tags to authenticated;
grant insert, delete on public.photo_tags to authenticated;


-- -------------------------------------------------------------
-- Storage : bucket public "photos" (WebP uniquement, 10 Mo max)
-- Bucket public = fichiers lisibles par URL directe.
-- Policy select réservée aux admins (nécessaire pour supprimer) :
-- le public ne peut pas lister le contenu du bucket.
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/webp']);

create policy "Admins can list photo files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()));

create policy "Admins can upload photo files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos' and (select public.is_admin()));

create policy "Admins can update photo files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()))
  with check (bucket_id = 'photos' and (select public.is_admin()));

create policy "Admins can delete photo files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()));
