import type { MaybeRefOrGetter } from 'vue'

// Masonry « sans mesure » : les positions sont exprimées en unités relatives
// (index de colonne, somme des ratios au-dessus, nombre d'éléments au-dessus).
// Le CSS les convertit en pixels avec la largeur du conteneur (cqw),
// ce qui rend la grille exacte dès le rendu serveur, quelle que soit la taille d'écran.
//
// Une photo « ouverte » coupe la grille : les photos d'avant gardent leur place,
// la photo ouverte prend toute la largeur, celles d'après repartent en dessous.

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

export type TileRole = 'before' | 'expanded' | 'after'

export interface MasonryLayout {
  tiles: Map<string, { role: TileRole, placements: Record<ColumnCount, TilePlacement> }>
  // "before" = bloc au-dessus de la photo ouverte (ou toute la grille si aucune), "after" = bloc en dessous.
  heights: Record<ColumnCount, { before: ColumnsHeight, after: ColumnsHeight }>
  expandedId: string | null
}

// Une gouttière « pèse » environ 2 % d'une largeur de colonne pour choisir la colonne la plus courte.
const GAP_WEIGHT = 0.02
const EMPTY_PLACEMENT: TilePlacement = { column: 0, ratioAbove: 0, countAbove: 0 }

function placeAll(items: MasonryItem[], columns: number) {
  const ratio = Array.from({ length: columns }, () => 0)
  const count = Array.from({ length: columns }, () => 0)
  const weight = (c: number) => (ratio[c] ?? 0) + (count[c] ?? 0) * GAP_WEIGHT
  const placements: TilePlacement[] = []

  for (const item of items) {
    let target = 0
    for (let c = 1; c < columns; c++) {
      if (weight(c) < weight(target) - 1e-9) target = c
    }
    placements.push({ column: target, ratioAbove: ratio[target] ?? 0, countAbove: count[target] ?? 0 })
    ratio[target] = (ratio[target] ?? 0) + item.height / item.width
    count[target] = (count[target] ?? 0) + 1
  }

  let tallest = 0
  for (let c = 1; c < columns; c++) {
    if (weight(c) > weight(tallest)) tallest = c
  }

  return { placements, height: { ratio: ratio[tallest] ?? 0, count: count[tallest] ?? 0 } }
}

export function computeMasonry(items: MasonryItem[], expandedId: string | null = null): MasonryLayout {
  const expandedIndex = expandedId ? items.findIndex(i => i.id === expandedId) : -1
  const before = expandedIndex >= 0 ? items.slice(0, expandedIndex) : items
  const after = expandedIndex >= 0 ? items.slice(expandedIndex + 1) : []
  const expanded = expandedIndex >= 0 ? items[expandedIndex] : undefined

  const tiles: MasonryLayout['tiles'] = new Map()
  const heights = {} as MasonryLayout['heights']

  const assign = (item: MasonryItem, role: TileRole, columns: ColumnCount, placement: TilePlacement) => {
    const entry = tiles.get(item.id) ?? { role, placements: {} as Record<ColumnCount, TilePlacement> }
    entry.placements[columns] = placement
    tiles.set(item.id, entry)
  }

  for (const columns of MASONRY_COLUMNS) {
    const top = placeAll(before, columns)
    const bottom = placeAll(after, columns)
    heights[columns] = { before: top.height, after: bottom.height }

    before.forEach((item, i) => assign(item, 'before', columns, top.placements[i] ?? EMPTY_PLACEMENT))
    after.forEach((item, i) => assign(item, 'after', columns, bottom.placements[i] ?? EMPTY_PLACEMENT))
    if (expanded) assign(expanded, 'expanded', columns, EMPTY_PLACEMENT)
  }

  return { tiles, heights, expandedId: expanded ? expanded.id : null }
}

// Variables CSS consommées par .masonry__tile.
export function tileStyle(item: MasonryItem, placements: Record<ColumnCount, TilePlacement> | undefined): Record<string, string> {
  const style: Record<string, string> = { '--ratio': String(item.height / item.width) }
  if (!placements) return style
  for (const columns of MASONRY_COLUMNS) {
    const p = placements[columns]
    style[`--c${columns}`] = String(p.column)
    style[`--r${columns}`] = String(p.ratioAbove)
    style[`--k${columns}`] = String(p.countAbove)
  }
  return style
}

// Variables CSS consommées par .masonry__canvas.
export function canvasStyle(heights: MasonryLayout['heights']): Record<string, string> {
  const style: Record<string, string> = {}
  for (const columns of MASONRY_COLUMNS) {
    style[`--hr${columns}`] = String(heights[columns].before.ratio)
    style[`--hk${columns}`] = String(heights[columns].before.count)
    style[`--ar${columns}`] = String(heights[columns].after.ratio)
    style[`--ak${columns}`] = String(heights[columns].after.count)
  }
  return style
}

export function useMasonry<T extends MasonryItem>(items: MaybeRefOrGetter<T[]>, expandedId: MaybeRefOrGetter<string | null>) {
  const layout = computed(() => computeMasonry(toValue(items), toValue(expandedId)))
  return { layout }
}
