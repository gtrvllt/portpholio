import type { Tables } from '#shared/types/database.types'

export type Tag = Pick<Tables<'tags'>, 'id' | 'name' | 'slug'>
export type PhotoWithTags = Tables<'photos'> & { tags: Tag[] }

export const PHOTO_SELECT = '*, photo_tags(tags(id, name, slug))'

type PhotoRow = Tables<'photos'> & { photo_tags: { tags: Tag | null }[] }

export function toPhotoWithTags({ photo_tags, ...photo }: PhotoRow): PhotoWithTags {
  return {
    ...photo,
    tags: photo_tags.map(pt => pt.tags).filter((t): t is Tag => t !== null),
  }
}

export interface TagFilter extends Tag {
  count: number
}

// Photos publiées, rendues côté serveur. RLS garantit qu'un visiteur ne voit pas les brouillons.
export function usePhotos() {
  const supabase = useSupabase()

  const { data, status, error, refresh } = useAsyncData('published-photos', async () => {
    const { data: rows, error: err } = await supabase
      .from('photos')
      .select(PHOTO_SELECT)
      .eq('published', true)
      .order('taken_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (err) throw createError({ statusCode: 500, statusMessage: err.message })
    return rows.map(toPhotoWithTags)
  })

  const photos = computed(() => data.value ?? [])

  // Uniquement les tags utilisés par au moins une photo publiée, triés par fréquence.
  const tags = computed<TagFilter[]>(() => {
    const counts = new Map<string, TagFilter>()
    for (const photo of photos.value) {
      for (const tag of photo.tags) {
        const entry = counts.get(tag.slug)
        if (entry) entry.count++
        else counts.set(tag.slug, { ...tag, count: 1 })
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  })

  return { photos, tags, status, error, refresh }
}
