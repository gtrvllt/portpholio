<script setup lang="ts">
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const pending = ref(false)
const error = ref<string | null>(null)

async function submit() {
  pending.value = true
  error.value = await signIn(email.value, password.value)
  pending.value = false
}
</script>

<template>
  <form class="login" @submit.prevent="submit">
    <h1>Connexion</h1>
    <label>
      Email
      <input v-model="email" type="email" autocomplete="username" required>
    </label>
    <label>
      Mot de passe
      <input v-model="password" type="password" autocomplete="current-password" required>
    </label>
    <p v-if="error" class="login__error" role="alert">{{ error }}</p>
    <button type="submit" :disabled="pending">
      {{ pending ? 'Connexion…' : 'Se connecter' }}
    </button>
  </form>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 320px;
  margin: 10vh auto 0;
}

.login label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.login__error {
  color: #b00020;
  margin: 0;
}
</style>
