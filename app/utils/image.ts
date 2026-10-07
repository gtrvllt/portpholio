import exifr from 'exifr'
import { rgbaToThumbHash } from 'thumbhash'

// Largeurs générées à l'upload (une variante WebP par largeur).
export const PHOTO_WIDTHS = [480, 960, 1600, 2560] as const
const WEBP_QUALITY = 0.85
const THUMBHASH_MAX_SIZE = 100

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface PhotoExif {
  camera: string | null
  lens: string | null
  focal_length: number | null
  aperture: number | null
  exposure_time: number | null
  iso: number | null
  taken_at: string | null
}

interface RawExif {
  Make?: string
  Model?: string
  LensModel?: string
  FocalLength?: number
  FNumber?: number
  ExposureTime?: number
  ISO?: number
  DateTimeOriginal?: Date
}

const EXIF_TAGS = ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal']

function cameraName(make?: string, model?: string): string | null {
  const m = model?.trim()
  const brand = make?.trim().split(/\s+/)[0]
  if (!m) return brand || null
  if (!brand || m.toLowerCase().startsWith(brand.toLowerCase())) return m
  return `${brand} ${m}`
}

function round(value: number | undefined, decimals: number): number | null {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return null
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export async function readExif(file: File): Promise<PhotoExif> {
  const raw: RawExif = (await exifr.parse(file, { pick: EXIF_TAGS }).catch(() => null)) ?? {}
  const takenAt = raw.DateTimeOriginal instanceof Date && !Number.isNaN(raw.DateTimeOriginal.getTime())
    ? raw.DateTimeOriginal.toISOString()
    : null

  return {
    camera: cameraName(raw.Make, raw.Model),
    lens: raw.LensModel?.trim() || null,
    focal_length: round(raw.FocalLength, 1),
    aperture: round(raw.FNumber, 1),
    exposure_time: raw.ExposureTime && raw.ExposureTime > 0 ? raw.ExposureTime : null,
    iso: raw.ISO && raw.ISO > 0 ? Math.round(raw.ISO) : null,
    taken_at: takenAt,
  }
}

// Largeurs à générer pour une image : on n'agrandit jamais,
// et si l'original est plus petit que la plus grande variante, on le garde tel quel.
export function widthsFor(originalWidth: number): number[] {
  const widths: number[] = PHOTO_WIDTHS.filter(w => w < originalWidth)
  const max = PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1] ?? originalWidth
  if (originalWidth <= max) widths.push(originalWidth)
  return widths
}

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponible')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return [canvas, ctx]
}

// Réduction par paliers de 50 % : évite l'aliasing d'un seul gros redimensionnement.
export function resize(bitmap: ImageBitmap, targetWidth: number): HTMLCanvasElement {
  const targetHeight = Math.round((bitmap.height * targetWidth) / bitmap.width)
  let source: CanvasImageSource = bitmap
  let width = bitmap.width
  let height = bitmap.height

  while (width / 2 >= targetWidth) {
    width = Math.round(width / 2)
    height = Math.round(height / 2)
    const [step, ctx] = createCanvas(width, height)
    ctx.drawImage(source, 0, 0, width, height)
    source = step
  }

  const [canvas, ctx] = createCanvas(targetWidth, targetHeight)
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
  return canvas
}

// Ré-encodage en WebP : supprime au passage toutes les métadonnées (dont le GPS).
export function toWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== 'image/webp') {
        reject(new Error('Ce navigateur ne sait pas encoder en WebP. Utilise Chrome ou Firefox.'))
        return
      }
      resolve(blob)
    }, 'image/webp', WEBP_QUALITY)
  })
}

export function thumbhash(bitmap: ImageBitmap): string {
  const scale = THUMBHASH_MAX_SIZE / Math.max(bitmap.width, bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const [, ctx] = createCanvas(width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  const { data } = ctx.getImageData(0, 0, width, height)
  const hash = rgbaToThumbHash(width, height, data)
  return btoa(String.fromCharCode(...hash))
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
