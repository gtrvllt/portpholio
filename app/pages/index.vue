<script setup lang="ts">
const { site } = useAppConfig()
const route = useRoute()
const router = useRouter()

const { photos, tags, status, error, refresh } = usePhotos()
const { photoUrl, closestSize } = usePhotoUrl()

// Filtre actif dans l'URL (?tag=street) : partageable, et le bouton retour fonctionne.
const activeTag = computed<string | null>({
  get: () => {
    const tag = route.query.tag
    return typeof tag === 'string' && tags.value.some(t => t.slug === tag) ? tag : null
  },
  set: (tag) => {
    // Changer de filtre ferme la photo ouverte.
    router.replace({ query: { ...route.query, tag: tag ?? undefined, photo: undefined } })
  },
})

const visiblePhotos = computed(() =>
  activeTag.value
    ? photos.value.filter(p => p.tags.some(t => t.slug === activeTag.value))
    : photos.value,
)

const viewer = usePhotoViewer(visiblePhotos)
const activePhoto = viewer.activePhoto

// Lien partagé vers une photo : titre et aperçu (Open Graph) de cette photo.
useSeoMeta({
  title: () => activePhoto.value?.title ? `${activePhoto.value.title} · ${site.name}` : site.name,
  ogTitle: () => activePhoto.value?.title ?? site.name,
  ogType: 'website',
  ogImage: () => activePhoto.value
    ? photoUrl(activePhoto.value.storage_key, closestSize(activePhoto.value.sizes, 1600))
    : undefined,
  twitterCard: () => activePhoto.value ? 'summary_large_image' : 'summary',
})
</script>

<template>
  <div class="home">
    <header class="home__header">
      <NuxtLink to="/" class="home__name">{{ site.name }}</NuxtLink>
    </header>

    <main class="home__main">
      <div v-if="status === 'pending' && !photos.length" class="home__state">
        <span class="spinner" aria-label="Chargement" />
      </div>

      <div v-else-if="error" class="home__state" role="alert">
        <p>Les photos n'ont pas pu être chargées.</p>
        <button type="button" class="btn" @click="() => refresh()">Réessayer</button>
      </div>

      <p v-else-if="!photos.length" class="home__state">Aucune photo pour le moment.</p>

      <template v-else>
        <TagFilters v-if="tags.length" v-model="activeTag" :tags="tags" :total="photos.length" class="home__filters" />
        <PhotoGrid
          :photos="visiblePhotos"
          :expanded-id="activePhoto?.id ?? null"
          :href-for="viewer.hrefFor"
          @open="viewer.open"
          @close="viewer.close"
          @prev="viewer.prev"
          @next="viewer.next"
          @tag="activeTag = $event"
        />
      </template>
    </main>
  </div>
</template>

<style scoped>
.home {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 16px 64px;
}

@media (min-width: 768px) {
  .home {
    padding: 0 32px 96px;
  }
}

.home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.home__name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.home__main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.home__filters {
  animation: fade-up var(--duration-slow) var(--ease) both;
}

.home__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20vh 0;
  color: var(--text-muted);
  text-align: center;
}
</style>
