<script setup lang="ts">
defineProps<{
  tags: TagFilter[]
  total: number
}>()

const active = defineModel<string | null>({ required: true })
</script>

<template>
  <nav class="filters" aria-label="Filtrer par thème">
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
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
}

.filters__item {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: var(--text-subtle);
  font: inherit;
  font-size: 14px;
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
</style>
