<script setup lang="ts">
const props = defineProps<{
  photo: PhotoWithTags
  eager?: boolean
}>()

const { photoUrl, closestSize, srcset } = usePhotoUrl()

const img = ref<HTMLImageElement | null>(null)
const loaded = ref(false)

const placeholder = computed(() => placeholderUrl(props.photo.thumbhash))
const src = computed(() => photoUrl(props.photo.storage_key, closestSize(props.photo.sizes, 960)))
const srcSet = computed(() => srcset(props.photo.storage_key, props.photo.sizes))

// Une image rendue côté serveur peut finir de charger avant l'hydratation : on rattrape l'événement manqué.
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth > 0) loaded.value = true
})
</script>

<template>
  <figure
    class="tile"
    :style="placeholder ? { backgroundImage: `url(${placeholder})` } : undefined"
  >
    <img
      ref="img"
      class="tile__img"
      :class="{ 'tile__img--loaded': loaded }"
      :src="src"
      :srcset="srcSet"
      sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
      :width="photo.width"
      :height="photo.height"
      :alt="photo.title ?? ''"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      @load="loaded = true"
    >
  </figure>
</template>

<style scoped>
.tile {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  border-radius: 4px;
  background-color: var(--surface-hover);
  background-size: cover;
  background-position: center;
}

.tile__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition:
    opacity var(--duration-slow) var(--ease),
    transform var(--duration-slow) var(--ease);
}

.tile__img--loaded {
  opacity: 1;
}

@media (hover: hover) {
  .tile:hover .tile__img--loaded {
    transform: scale(1.02);
  }
}
</style>
