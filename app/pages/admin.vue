<script setup lang="ts">
useHead({
  title: 'Admin',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const { user, ready, init } = useAuth()
onMounted(init)
</script>

<template>
  <Transition name="fade" mode="out-in">
    <div v-if="!ready" key="loading" class="admin-loading">
      <span class="spinner" aria-label="Chargement" />
    </div>
    <AdminLogin v-else-if="!user" key="login" />
    <AdminDashboard v-else key="dashboard" />
  </Transition>
</template>

<style scoped>
.admin-loading {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  color: var(--text-muted);
}
</style>
