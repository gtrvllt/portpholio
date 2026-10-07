import { thumbHashToDataURL } from 'thumbhash'

// Image floue (PNG en data URL) à afficher pendant le chargement de la photo.
export function placeholderUrl(hash: string | null): string | null {
  if (!hash) return null
  try {
    const bytes = Uint8Array.from(atob(hash), c => c.charCodeAt(0))
    return thumbHashToDataURL(bytes)
  }
  catch {
    return null
  }
}
