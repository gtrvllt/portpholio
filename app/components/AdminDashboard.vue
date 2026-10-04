<script setup lang="ts">
const { user, signOut } = useAuth()
const { photos, loading, error, fetchPhotos } = useAdminPhotos()

onMounted(fetchPhotos)
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <h1>Admin</h1>
      <div class="dashboard__account">
        <NuxtLink to="/">Voir le site</NuxtLink>
        <span>{{ user?.email }}</span>
        <button type="button" @click="signOut">Se déconnecter</button>
      </div>
    </header>

    <AdminUploader @uploaded="fetchPhotos" />

    <section>
      <h2>Photos ({{ photos.length }})</h2>
      <p v-if="loading && !photos.length">Chargement…</p>
      <p v-else-if="error" role="alert">
        Impossible de charger les photos : {{ error }}
        <button type="button" @click="fetchPhotos">Réessayer</button>
      </p>
      <p v-else-if="!photos.length">Aucune photo pour l'instant. Dépose-en une ci-dessus.</p>
      <ul v-else class="dashboard__list">
        <AdminPhotoItem
          v-for="photo in photos"
          :key="photo.id"
          :photo="photo"
          @changed="fetchPhotos"
          @deleted="fetchPhotos"
        />
      </ul>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard__header h1 {
  margin: 0;
}

.dashboard__account {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #666;
}

.dashboard__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
