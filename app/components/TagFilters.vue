<script setup lang="ts">
defineProps<{
  tags: TagFilter[]
  total: number
}>()

const active = defineModel<string | null>({ required: true })

const nav = ref<HTMLElement | null>(null)

// Sur mobile la liste défile horizontalement : on garde le filtre actif visible
// (par exemple après un clic sur un tag depuis la photo ouverte), sans faire défiler la page.
watch(active, async () => {
  await nextTick()
  const container = nav.value
  const current = container?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!container || !current || container.scrollWidth <= container.clientWidth) return
  const target = current.offsetLeft - (container.clientWidth - current.offsetWidth) / 2
  container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
})
</script>

<template>
  <nav ref="nav" class="filters" aria-label="Filtrer par thème">
    <button
      type="button"
      class="filters__item"
      :class="{ 'filters__item--active': active === null }"
      :aria-pressed="active === null"
      @click="active = null"
    >
      Tout <span class="filters__count mono">{{ total }}</span>
    </button>
    <button
      v-for="tag in tags"
      :key="tag.slug"
      type="button"
      class="filters__item"
      :class="{ 'filters__item--active': active === tag.slug }"
      :aria-pressed="active === tag.slug"
      @click="active = active === tag.slug ? null : tag.slug"
    >
      {{ tag.name }} <span class="filters__count mono">{{ tag.count }}</span>
    </button>
  </nav>
</template>

<style scoped>
.filters {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
}

.filters__item {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  flex-shrink: 0;
  gap: 4px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: var(--text-subtle);
  font: inherit;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease);
}

.filters__item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration) var(--ease);
}

.filters__item:hover {
  color: var(--text-muted);
}

.filters__item--active {
  color: var(--text);
}

.filters__item--active::after {
  transform: scaleX(1);
}

.filters__count {
  font-size: 10px;
  color: var(--text-subtle);
}

/* Mobile : une seule ligne qui défile (les tags ne mangent pas la moitié de l'écran),
   zones d'appui de 44 px, et bords qui débordent jusqu'au bord de l'écran. */
@media (max-width: 640px) {
  .filters {
    flex-wrap: nowrap;
    gap: 0 24px;
    margin-inline: -16px;
    padding-inline: 16px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }

  .filters::-webkit-scrollbar {
    display: none;
  }

  .filters__item {
    align-items: center;
    min-height: 44px;
    scroll-snap-align: start;
    scroll-margin-inline: 16px;
  }

  .filters__item::after {
    bottom: 8px;
  }
}
</style>
