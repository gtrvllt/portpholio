import type { TablesUpdate } from '#shared/types/database.types'

export type AdminPhoto = PhotoWithTags

export function useAdminPhotos() {
  const supabase = useSupabase()
  const photos = ref<AdminPhoto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPhotos() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('photos')
      .select(PHOTO_SELECT)
      .order('created_at', { ascending: false })
    loading.value = false

    if (err) {
      error.value = err.message
      return
    }
    photos.value = data.map(toPhotoWithTags)
  }

  async function updatePhoto(id: string, patch: TablesUpdate<'photos'>) {
    const { error: err } = await supabase.from('photos').update(patch).eq('id', id)
    if (err) throw err
  }

  // Remplace les tags d'une photo ; crée ceux qui n'existent pas encore.
  async function setTags(photoId: string, names: string[]) {
    const wanted = new Map<string, string>()
    for (const name of names) {
      const clean = name.trim()
      const slug = slugify(clean)
      if (slug && !wanted.has(slug)) wanted.set(slug, clean)
    }
    const slugs = [...wanted.keys()]

    if (slugs.length) {
      const { error: upsertErr } = await supabase
        .from('tags')
        .upsert(slugs.map(slug => ({ slug, name: wanted.get(slug) ?? slug })), { onConflict: 'slug', ignoreDuplicates: true })
      if (upsertErr) throw upsertErr
    }

    const { error: deleteErr } = await supabase.from('photo_tags').delete().eq('photo_id', photoId)
    if (deleteErr) throw deleteErr
    if (!slugs.length) return

    const { data: tags, error: selectErr } = await supabase.from('tags').select('id').in('slug', slugs)
    if (selectErr) throw selectErr

    const { error: insertErr } = await supabase
      .from('photo_tags')
      .insert(tags.map(t => ({ photo_id: photoId, tag_id: t.id })))
    if (insertErr) throw insertErr
  }

  async function deletePhoto(photo: AdminPhoto) {
    // La ligne d'abord : si la suppression des fichiers échoue,
    // il reste des fichiers orphelins invisibles plutôt qu'une photo cassée.
    const { error: err } = await supabase.from('photos').delete().eq('id', photo.id)
    if (err) throw err
    await supabase.storage.from(PHOTOS_BUCKET).remove(photo.sizes.map(w => photoPath(photo.storage_key, w)))
    photos.value = photos.value.filter(p => p.id !== photo.id)
  }

  return { photos, loading, error, fetchPhotos, updatePhoto, setTags, deletePhoto }
}
