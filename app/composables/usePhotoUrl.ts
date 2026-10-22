export const PHOTOS_BUCKET = 'photos'

export function photoPath(storageKey: string, width: number): string {
  return `${storageKey}/${width}.webp`
}

export function usePhotoUrl() {
  const supabase = useSupabase()

  function photoUrl(storageKey: string, width: number): string {
    return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(photoPath(storageKey, width)).data.publicUrl
  }

  // Variante la plus proche au-dessus de la largeur demandée (ou la plus grande dispo).
  function closestSize(sizes: number[], width: number): number {
    const sorted = [...sizes].sort((a, b) => a - b)
    return sorted.find(s => s >= width) ?? sorted[sorted.length - 1] ?? width
  }

  function srcset(storageKey: string, sizes: number[]): string {
    return sizes.map(w => `${photoUrl(storageKey, w)} ${w}w`).join(', ')
  }

  return { photoUrl, closestSize, srcset }
}
