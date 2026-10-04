<script setup lang="ts">
useHead({
  title: 'Admin',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const { user, ready, init } = useAuth()
onMounted(init)
</script>

<template>
  <div class="admin">
    <p v-if="!ready" class="admin__status">Chargement…</p>
    <AdminLogin v-else-if="!user" />
    <AdminDashboard v-else />
  </div>
</template>

<style scoped>
.admin {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px;
  font-family: system-ui, sans-serif;
}

.admin__status {
  color: #666;
}
</style>
