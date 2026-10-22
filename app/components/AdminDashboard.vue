<script setup lang="ts">
const { user, signOut } = useAuth()
const { photos, loading, error, fetchPhotos } = useAdminPhotos()

const publishedCount = computed(() => photos.value.filter(p => p.published).length)

onMounted(fetchPhotos)
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__bar">
      <div class="dashboard__bar-inner">
        <div class="dashboard__brand">
          <span class="dashboard__name">Portfolio</span>
          <span class="dashboard__tag mono">admin</span>
        </div>
        <nav class="dashboard__nav">
          <NuxtLink to="/" class="btn btn--ghost">Voir le site ↗</NuxtLink>
          <span class="dashboard__email">{{ user?.email }}</span>
          <button type="button" class="btn" @click="signOut">Déconnexion</button>
        </nav>
      </div>
    </header>

    <main class="dashboard__main fade-up">
      <AdminUploader @uploaded="fetchPhotos" />

      <section class="dashboard__section">
        <div class="dashboard__section-head">
          <h2 class="dashboard__title">Photos</h2>
          <span v-if="photos.length" class="mono dashboard__count">
            {{ photos.length }} au total · {{ publishedCount }} publiée{{ publishedCount > 1 ? 's' : '' }}
          </span>
        </div>

        <Transition name="fade" mode="out-in">
          <div v-if="loading && !photos.length" key="loading" class="dashboard__state">
            <span class="spinner" aria-hidden="true" /> Chargement des photos…
          </div>
          <div v-else-if="error" key="error" class="dashboard__state dashboard__state--error" role="alert">
            <p>Impossible de charger les photos : {{ error }}</p>
            <button type="button" class="btn" @click="fetchPhotos">Réessayer</button>
          </div>
          <div v-else-if="!photos.length" key="empty" class="dashboard__state">
            Aucune photo pour l'instant. Dépose tes premières photos ci-dessus.
          </div>
          <TransitionGroup v-else key="list" name="list" tag="ul" class="dashboard__grid">
            <AdminPhotoItem
              v-for="photo in photos"
              :key="photo.id"
              :photo="photo"
              @changed="fetchPhotos"
              @deleted="fetchPhotos"
            />
          </TransitionGroup>
        </Transition>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
}

.dashboard__bar-inner,
.dashboard__main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px;
}

.dashboard__bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 60px;
}

.dashboard__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard__name {
  font-weight: 600;
  letter-spacing: -0.02em;
}

.dashboard__tag {
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
}

.dashboard__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard__email {
  padding: 0 8px;
  color: var(--text-muted);
  font-size: 14px;
}

@media (max-width: 640px) {
  .dashboard__email {
    display: none;
  }
}

.dashboard__main {
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding-top: 32px;
  padding-bottom: 64px;
}

.dashboard__section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard__section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.dashboard__title {
  font-size: 20px;
}

.dashboard__count {
  color: var(--text-muted);
}

.dashboard__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  text-align: center;
}

.dashboard__state--error {
  flex-direction: column;
  color: var(--danger);
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
