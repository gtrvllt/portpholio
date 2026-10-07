import type { MaybeRefOrGetter } from 'vue'

// Masonry « sans mesure » : les positions sont exprimées en unités relatives
// (index de colonne, somme des ratios au-dessus, nombre d'éléments au-dessus).
// Le CSS les convertit en pixels avec la largeur du conteneur (cqw),
// ce qui rend la grille exacte dès le rendu serveur, quelle que soit la taille d'écran.

export const MASONRY_COLUMNS = [2, 3, 4] as const
export type ColumnCount = typeof MASONRY_COLUMNS[number]

export interface MasonryItem {
  id: string
  width: number
  height: number
}

export interface TilePlacement {
  column: number
  ratioAbove: number // somme des ratios hauteur/largeur des éléments au-dessus
  countAbove: number // nombre d'éléments au-dessus (pour les gouttières)
}

export interface ColumnsHeight {
  ratio: number // somme des ratios de la colonne la plus haute
  count: number // nombre d'éléments dans cette colonne
}

export interface MasonryLayout {
  tiles: Map<string, Record<ColumnCount, TilePlacement>>
  heights: Record<ColumnCount, ColumnsHeight>
}

// Une gouttière « pèse » environ 2 % d'une largeur de colonne pour choisir la colonne la plus courte.
const GAP_WEIGHT = 0.02

function placeAll(items: MasonryItem[], columns: number) {
  const ratio = Array.from({ length: columns }, () => 0)
  const count = Array.from({ length: columns }, () => 0)
  const placements: TilePlacement[] = []

  for (const item of items) {
    let target = 0
    for (let c = 1; c < columns; c++) {
      const height = (ratio[c] ?? 0) + (count[c] ?? 0) * GAP_WEIGHT
      const best = (ratio[target] ?? 0) + (count[target] ?? 0) * GAP_WEIGHT
      if (height < best - 1e-9) target = c
    }
    placements.push({ column: target, ratioAbove: ratio[target] ?? 0, countAbove: count[target] ?? 0 })
    ratio[target] = (ratio[target] ?? 0) + item.height / item.width
    count[target] = (count[target] ?? 0) + 1
  }

  let tallest = 0
  for (let c = 1; c < columns; c++) {
    if ((ratio[c] ?? 0) + (count[c] ?? 0) * GAP_WEIGHT > (ratio[tallest] ?? 0) + (count[tallest] ?? 0) * GAP_WEIGHT) {
      tallest = c
    }
  }

  return { placements, height: { ratio: ratio[tallest] ?? 0, count: count[tallest] ?? 0 } }
}

export function computeMasonry(items: MasonryItem[]): MasonryLayout {
  const tiles = new Map<string, Record<ColumnCount, TilePlacement>>()
  const heights = {} as Record<ColumnCount, ColumnsHeight>

  for (const columns of MASONRY_COLUMNS) {
    const { placements, height } = placeAll(items, columns)
    heights[columns] = height
    items.forEach((item, index) => {
      const placement = placements[index]
      if (!placement) return
      const entry = tiles.get(item.id) ?? ({} as Record<ColumnCount, TilePlacement>)
      entry[columns] = placement
      tiles.set(item.id, entry)
    })
  }

  return { tiles, heights }
}

// Variables CSS consommées par .masonry / .masonry__tile.
export function tileStyle(item: MasonryItem, placement: Record<ColumnCount, TilePlacement> | undefined): Record<string, string> {
  const style: Record<string, string> = { '--ratio': String(item.height / item.width) }
  if (!placement) return style
  for (const columns of MASONRY_COLUMNS) {
    const p = placement[columns]
    style[`--c${columns}`] = String(p.column)
    style[`--r${columns}`] = String(p.ratioAbove)
    style[`--k${columns}`] = String(p.countAbove)
  }
  return style
}

export function canvasStyle(heights: Record<ColumnCount, ColumnsHeight>): Record<string, string> {
  const style: Record<string, string> = {}
  for (const columns of MASONRY_COLUMNS) {
    style[`--hr${columns}`] = String(heights[columns].ratio)
    style[`--hk${columns}`] = String(heights[columns].count)
  }
  return style
}

export function useMasonry<T extends MasonryItem>(items: MaybeRefOrGetter<T[]>) {
  const layout = computed(() => computeMasonry(toValue(items)))
  return { layout }
}
