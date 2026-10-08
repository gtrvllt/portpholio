<script setup lang="ts">
const props = defineProps<{ photo: PhotoWithTags }>()
const emit = defineEmits<{ close: [], prev: [], next: [], tag: [slug: string] }>()

const { photoUrl, closestSize, srcset } = usePhotoUrl()

const isPortrait = computed(() => props.photo.height > props.photo.width)
const loaded = ref(false)
const img = ref<HTMLImageElement | null>(null)

// Fond : placeholder flou + variante déjà chargée par la grille (en cache), le temps que la grande arrive.
const background = computed(() => {
  const layers = [`url(${photoUrl(props.photo.storage_key, closestSize(props.photo.sizes, 960))})`]
  const blur = placeholderUrl(props.photo.thumbhash)
  if (blur) layers.push(`url(${blur})`)
  return layers.join(', ')
})

const largest = computed(() => Math.max(...props.photo.sizes))
const src = computed(() => photoUrl(props.photo.storage_key, largest.value))
const srcSet = computed(() => srcset(props.photo.storage_key, props.photo.sizes))
// Largeur affichée approximative : portrait limité par la hauteur d'écran, paysage par la colonne d'infos.
const sizes = computed(() => isPortrait.value ? '(max-width: 720px) 100vw, 66vh' : '(max-width: 720px) 100vw, 75vw')

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })
const takenAt = computed(() => props.photo.taken_at ? dateFormatter.format(new Date(props.photo.taken_at)) : null)

const specs = computed(() => [
  { label: 'Appareil', value: props.photo.camera },
  { label: 'Objectif', value: props.photo.lens },
  { label: 'Focale', value: formatFocal(props.photo.focal_length) },
  { label: 'Ouverture', value: formatAperture(props.photo.aperture) },
  { label: 'Vitesse', value: formatExposure(props.photo.exposure_time) },
  { label: 'Sensibilité', value: formatIso(props.photo.iso) },
].filter((s): s is { label: string, value: string } => Boolean(s.value)))

watch(() => props.photo.id, () => {
  loaded.value = false
})

onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth > 0) loaded.value = true
})
</script>

<template>
  <article class="detail" :class="isPortrait ? 'detail--portrait' : 'detail--landscape'">
    <button
      type="button"
      class="detail__media"
      :style="{ '--ratio': photo.height / photo.width, backgroundImage: background }"
      aria-label="Refermer la photo"
      @click="emit('close')"
    >
      <img
        :key="photo.id"
        ref="img"
        class="detail__img"
        :class="{ 'detail__img--loaded': loaded }"
        :src="src"
        :srcset="srcSet"
        :sizes="sizes"
        :width="photo.width"
        :height="photo.height"
        :alt="photo.title ?? ''"
        fetchpriority="high"
        decoding="async"
        @load="loaded = true"
      >
    </button>

    <aside class="detail__info">
      <div class="detail__head">
        <div class="detail__heading">
          <h2 v-if="photo.title" class="detail__title">{{ photo.title }}</h2>
          <p v-if="takenAt || photo.location" class="detail__date">
            {{ [photo.location, takenAt].filter(Boolean).join(' · ') }}
          </p>
        </div>
        <div class="detail__controls">
          <button type="button" class="detail__control" aria-label="Photo précédente" @click="emit('prev')">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <button type="button" class="detail__control" aria-label="Photo suivante" @click="emit('next')">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <button type="button" class="detail__control" aria-label="Fermer" @click="emit('close')">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
          </button>
        </div>
      </div>

      <dl v-if="specs.length" class="detail__specs">
        <div v-for="spec in specs" :key="spec.label" class="detail__spec">
          <dt>{{ spec.label }}</dt>
          <dd class="mono">{{ spec.value }}</dd>
        </div>
      </dl>

      <ul v-if="photo.tags.length" class="detail__tags">
        <li v-for="tag in photo.tags" :key="tag.slug">
          <button type="button" class="detail__tag" @click="emit('tag', tag.slug)">#{{ tag.name }}</button>
        </li>
      </ul>

      <a
        v-if="photo.link_url"
        :href="photo.link_url"
        class="detail__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ displayHost(photo.link_url) }}
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5.5 10.5 10.5 5.5M6 5.5h4.5V10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </aside>
  </article>
</template>

<style scoped>
.detail {
  /* Largeur fixe = largeur de la grille : le contenu ne se recompose pas pendant l'animation d'ouverture. */
  /* Photo en plein écran : toute la hauteur visible, moins une marge en haut et en bas. */
  --edge: 16px;
  --max-h: calc(100dvh - 2 * var(--edge));
  /* La colonne d'infos et l'espace s'adaptent à la largeur disponible (téléphone couché, tablette). */
  --info-w: clamp(220px, 30cqw, 300px);
  --space: clamp(20px, 3cqw, 32px);

  display: grid;
  gap: 20px;
  width: 100cqw;
}

/* ---------- Média ---------- */
.detail__media {
  display: block;
  height: var(--img-h);
  width: calc(var(--img-h) / var(--ratio));
  max-width: 100%;
  padding: 0;
  border: 0;
  overflow: hidden;
  border-radius: 4px;
  cursor: zoom-out;
  background-color: var(--surface-hover);
  background-size: cover;
  background-position: center;
}

/* Photo à gauche, infos à droite (paysage comme portrait) :
   la photo prend la plus grande taille qui tient en hauteur d'écran ET dans la largeur restante. */
.detail {
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space);
  align-items: start;
}

.detail__media {
  --img-h: min(var(--max-h), calc((100cqw - var(--info-w) - var(--space)) * var(--ratio)));
}

/* Écran très étroit (téléphone en portrait) : infos sous la photo. */
@container masonry (width < 520px) {
  .detail {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .detail__media {
    --img-h: min(calc(100cqw * var(--ratio)), var(--max-h));
  }
}

.detail__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity var(--duration-slow) var(--ease);
}

.detail__img--loaded {
  opacity: 1;
}

/* ---------- Infos ---------- */
.detail__info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fade-up var(--duration-slow) var(--ease) 120ms both;
}

.detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.detail__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail__title {
  font-size: 18px;
}

.detail__date {
  color: var(--text-muted);
  font-size: 14px;
}

.detail__controls {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.detail__control {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease),
    color var(--duration-fast) var(--ease);
}

.detail__control:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.detail__control svg {
  width: 16px;
  height: 16px;
}

.detail__specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
  margin: 0;
}

.detail__spec {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail__spec dt {
  color: var(--text-subtle);
  font-size: 12px;
}

.detail__spec {
  min-width: 0;
}

.detail__spec dd {
  margin: 0;
  /* Noms d'objectifs longs (ex. « XF16-55mmF2.8 R LM WR ») : retour à la ligne plutôt que débordement. */
  overflow-wrap: anywhere;
  font-size: 13px;
}

.detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.detail__tag {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease);
}

.detail__tag:hover {
  color: var(--text);
}

.detail__link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  font-size: 14px;
  text-decoration: underline;
  text-decoration-color: var(--border-strong);
  text-underline-offset: 4px;
  transition: text-decoration-color var(--duration-fast) var(--ease);
}

.detail__link:hover {
  text-decoration-color: var(--text);
}

.detail__link svg {
  width: 14px;
  height: 14px;
  transition: transform var(--duration-fast) var(--ease);
}

/* Écran tactile : zones d'appui d'au moins 44 px. */
@media (pointer: coarse) {
  .detail__control {
    width: 44px;
    height: 44px;
  }

  .detail__controls {
    margin: -6px -10px 0 auto;
  }

  .detail__tags {
    gap: 0 16px;
  }

  .detail__tag,
  .detail__link {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
}

.detail__link:hover svg {
  transform: translate(1px, -1px);
}
</style>
