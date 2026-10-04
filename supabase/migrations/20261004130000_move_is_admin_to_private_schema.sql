-- is_admin() est SECURITY DEFINER : dans le schéma public, elle est appelable
-- via l'API (/rest/v1/rpc/is_admin). On la déplace dans un schéma non exposé.
-- Les policies référencent la fonction par OID : elles continuent de fonctionner.
create schema if not exists private;

-- Les rôles API doivent pouvoir évaluer la fonction dans les policies.
grant usage on schema private to anon, authenticated;

alter function public.is_admin() set schema private;
