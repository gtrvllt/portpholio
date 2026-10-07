<script setup lang="ts">
const props = defineProps<{
  photos: PhotoWithTags[]
  expandedId: string | null
  hrefFor: (slug: string) => string
}>()

const emit = defineEmits<{
  open: [slug: string]
  close: []
  prev: []
  next: []
  tag: [slug: string]
}>()

const { layout } = useMasonry(() => props.photos, () => props.expandedId)

// Les premières photos (au-dessus de la ligne de flottaison) se chargent en priorité.
const EAGER_COUNT = 4

// Hauteur réelle de la photo ouverte (image + infos), mesurée pour décaler les photos d'après.
const canvas = ref<{ $el: HTMLElement } | null>(null)
const detailHeight = ref<number | null>(null)
let observer: ResizeObserver | null = null

const canvasVars = computed(() => ({
  ...canvasStyle(layout.value.heights),
  ...(detailHeight.value ? { '--xh': `${detailHeight.value}px` } : {}),
}))

function roleOf(id: string): TileRole {
  return layout.value.tiles.get(id)?.role ?? 'before'
}

function onTileClick(event: MouseEvent, slug: string) {
  // Cmd/Ctrl/Maj-clic : laisser le navigateur ouvrir le lien normalement.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  emit('open', slug)
}

// Position finale (en px) du haut de la photo ouverte, calculée à partir des variables de la grille :
// on peut lancer le défilement sans attendre la fin de l'animation.
function expandedTop(el: HTMLElement): number {
  const css = getComputedStyle(el)
  const n = Number(css.getPropertyValue('--n'))
  const gap = Number.parseFloat(css.getPropertyValue('--gap'))
  const hr = Number(css.getPropertyValue('--hr'))
  const hk = Number(css.getPropertyValue('--hk'))
  const colw = (el.clientWidth - (n - 1) * gap) / n
  return el.getBoundingClientRect().top + window.scrollY + hr * colw + hk * gap
}

function observeDetail() {
  observer?.disconnect()
  detailHeight.value = null
  const el = canvas.value?.$el.querySelector<HTMLElement>('.masonry__tile--expanded .detail')
  if (!el) return
  observer = new ResizeObserver(([entry]) => {
    if (entry) detailHeight.value = Math.ceil(entry.borderBoxSize[0]?.blockSize ?? entry.target.getBoundingClientRect().height)
  })
  observer.observe(el)
}

// smooth = ouverture depuis la grille ; sinon (lien direct, flèches) on arrive directement sur la photo.
async function onExpandedChange(id: string | null, smooth: boolean) {
  await nextTick()
  observeDetail()
  const el = canvas.value?.$el
  if (!id || !el) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: Math.max(0, expandedTop(el) - 16),
    behavior: smooth && !reduceMotion ? 'smooth' : 'auto',
  })
}

watch(() => layout.value.expandedId, (id, previous) => onExpandedChange(id, !previous))
onMounted(() => onExpandedChange(layout.value.expandedId, false))
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="masonry">
    <TransitionGroup
      ref="canvas"
      tag="ul"
      name="tile"
      class="masonry__canvas"
      :class="{ 'masonry__canvas--expanded': layout.expandedId }"
      :style="canvasVars"
    >
      <li
        v-for="(photo, index) in photos"
        :key="photo.id"
        class="masonry__tile"
        :class="`masonry__tile--${roleOf(photo.id)}`"
        :style="tileStyle(photo, layout.tiles.get(photo.id)?.placements)"
      >
        <PhotoDetail
          v-if="photo.id === layout.expandedId"
          :photo="photo"
          @close="emit('close')"
          @prev="emit('prev')"
          @next="emit('next')"
          @tag="emit('tag', $event)"
        />
        <a
          v-else
          :href="hrefFor(photo.slug)"
          class="masonry__link"
          :aria-label="photo.title ?? 'Ouvrir la photo'"
          @click="onTileClick($event, photo.slug)"
        >
          <PhotoTile :photo="photo" :eager="index < EAGER_COUNT" />
        </a>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.masonry {
  container: masonry / inline-size;
  --gap: 12px;
}

.masonry__canvas {
  --n: 4;
  --hr: var(--hr4);
  --hk: var(--hk4);
  --ar: var(--ar4);
  --ak: var(--ak4);
  --colw: calc((100cqw - (var(--n) - 1) * var(--gap)) / var(--n));
  /* Estimation avant mesure (rendu serveur d'un lien direct vers une photo). */
  --xh-fallback: calc(100dvh + 80px);
  --block-top: calc(var(--hr) * var(--colw) + var(--hk) * var(--gap));

  position: relative;
  height: calc(var(--hr) * var(--colw) + max(var(--hk) - 1, 0) * var(--gap));
  margin: 0;
  padding: 0;
  list-style: none;
  transition: height var(--duration-slow) var(--ease);
}

.masonry__canvas--expanded {
  height: calc(var(--block-top) + var(--xh, var(--xh-fallback)) + var(--ar) * var(--colw) + var(--ak) * var(--gap));
}

.masonry__tile {
  --c: var(--c4);
  --r: var(--r4);
  --k: var(--k4);

  position: absolute;
  top: calc(var(--r) * var(--colw) + var(--k) * var(--gap));
  left: calc(var(--c) * (var(--colw) + var(--gap)));
  width: var(--colw);
  height: calc(var(--colw) * var(--ratio));
  /* Pas de transform ici : TransitionGroup ne doit pas appliquer son propre FLIP. */
  transition:
    top var(--duration-slow) var(--ease),
    left var(--duration-slow) var(--ease),
    width var(--duration-slow) var(--ease),
    height var(--duration-slow) var(--ease);
}

.masonry__tile--after {
  top: calc(var(--block-top) + var(--xh, var(--xh-fallback)) + var(--gap) + var(--r) * var(--colw) + var(--k) * var(--gap));
}

.masonry__tile--expanded {
  z-index: 1;
  top: var(--block-top);
  left: 0;
  width: 100cqw;
  height: var(--xh, var(--xh-fallback));
  overflow: hidden;
}

.masonry__link {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  cursor: zoom-in;
}

@container masonry (width < 640px) {
  .masonry__canvas {
    --n: 2;
    --hr: var(--hr2);
    --hk: var(--hk2);
    --ar: var(--ar2);
    --ak: var(--ak2);
  }

  .masonry__tile {
    --c: var(--c2);
    --r: var(--r2);
    --k: var(--k2);
  }
}

@container masonry (640px <= width < 1100px) {
  .masonry__canvas {
    --n: 3;
    --hr: var(--hr3);
    --hk: var(--hk3);
    --ar: var(--ar3);
    --ak: var(--ak3);
  }

  .masonry__tile {
    --c: var(--c3);
    --r: var(--r3);
    --k: var(--k3);
  }
}

/* Apparition / disparition au filtrage */
.tile-enter-active,
.tile-leave-active {
  transition:
    opacity var(--duration) var(--ease),
    transform var(--duration) var(--ease);
}

.tile-enter-active {
  transition-delay: 80ms;
}

.tile-enter-from,
.tile-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
