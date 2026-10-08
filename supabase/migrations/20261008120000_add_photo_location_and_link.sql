-- Lieu (texte libre, ex. « Doëlan, Finistère ») et lien web associés à une photo.
-- Le lieu est saisi à la main : aucune coordonnée GPS n'est stockée.
alter table public.photos
  add column location text check (char_length(location) <= 120),
  add column link_url text check (char_length(link_url) <= 2048 and link_url ~ '^https?://');
