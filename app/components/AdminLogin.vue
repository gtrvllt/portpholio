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
  <main class="login">
    <form class="login__card fade-up" @submit.prevent="submit">
      <header class="login__header">
        <p class="login__eyebrow mono">Portfolio · Admin</p>
        <h1 class="login__title">Connexion</h1>
      </header>

      <label class="field">
        <span class="field__label">Email</span>
        <input
          v-model="email"
          class="input"
          type="email"
          name="email"
          autocomplete="username"
          placeholder="toi@exemple.com"
          required
        >
      </label>

      <label class="field">
        <span class="field__label">Mot de passe</span>
        <input
          v-model="password"
          class="input"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        >
      </label>

      <Transition name="fade">
        <p v-if="error" class="login__error" role="alert">{{ error }}</p>
      </Transition>

      <button type="submit" class="btn btn--primary btn--lg btn--block" :disabled="pending">
        <span v-if="pending" class="spinner" aria-hidden="true" />
        {{ pending ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 24px 16px;
}

.login__card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 360px;
}

.login__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.login__eyebrow {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login__title {
  font-size: 28px;
}

.login__error {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 14px;
}

.login .btn {
  margin-top: 8px;
}
</style>
