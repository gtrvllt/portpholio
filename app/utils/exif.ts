// Formatage des EXIF pour l'affichage.

export function formatExposure(seconds: number | null): string | null {
  if (!seconds) return null
  if (seconds >= 1) return `${Number(seconds.toFixed(1))} s`
  return `1/${Math.round(1 / seconds)} s`
}

export function formatAperture(aperture: number | null): string | null {
  return aperture ? `f/${aperture}` : null
}

export function formatFocal(focal: number | null): string | null {
  return focal ? `${focal} mm` : null
}

export function formatIso(iso: number | null): string | null {
  return iso ? `ISO ${iso}` : null
}
