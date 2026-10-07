<script setup lang="ts">
const props = defineProps<{ photo: AdminPhoto }>()
const emit = defineEmits<{ changed: [], deleted: [] }>()

const { updatePhoto, setTags, deletePhoto } = useAdminPhotos()
const { photoUrl, closestSize } = usePhotoUrl()

const initialTags = computed(() => props.photo.tags.map(t => t.name).join(', '))
const title = ref(props.photo.title ?? '')
const tagsText = ref(initialTags.value)
const saving = ref(false)
const loaded = ref(false)
const error = ref<string | null>(null)

watch(() => props.photo, (photo) => {
  title.value = photo.title ?? ''
  tagsText.value = initialTags.value
})

const dirty = computed(() =>
  title.value.trim() !== (props.photo.title ?? '') || tagsText.value !== initialTags.value,
)

const thumbUrl = computed(() => photoUrl(props.photo.storage_key, closestSize(props.photo.sizes, 640)))

const exif = computed(() => [
  formatFocal(props.photo.focal_length),
  formatAperture(props.photo.aperture),
  formatExposure(props.photo.exposure_time),
  formatIso(props.photo.iso),
].filter(Boolean).join('  ·  '))

const gear = computed(() => [props.photo.camera, props.photo.lens].filter(Boolean).join(' — '))

async function run(action: () => Promise<void>) {
  saving.value = true
  error.value = null
  try {
    await action()
  }
  catch (err) {
    error.value = errorMessage(err)
  }
  finally {
    saving.value = false
  }
}

function save() {
  return run(async () => {
    await updatePhoto(props.photo.id, { title: title.value.trim() || null })
    await setTags(props.photo.id, tagsText.value.split(','))
    emit('changed')
  })
}

function togglePublished() {
  return run(async () => {
    await updatePhoto(props.photo.id, { published: !props.photo.published })
    emit('changed')
  })
}

function remove() {
  if (!window.confirm('Supprimer définitivement cette photo ?')) return
  return run(async () => {
    await deletePhoto(props.photo)
    emit('deleted')
  })
}
</script>

<template>
  <li class="card" :class="{ 'card--busy': saving }">
    <div class="card__media" :style="{ aspectRatio: `${photo.width} / ${photo.height}` }">
      <img
        :src="thumbUrl"
        :alt="photo.title ?? ''"
        class="card__img"
        :class="{ 'card__img--loaded': loaded }"
        loading="lazy"
        @load="loaded = true"
      >
      <span class="card__badge mono" :class="{ 'card__badge--published': photo.published }">
        {{ photo.published ? 'Publiée' : 'Brouillon' }}
      </span>
    </div>

    <form class="card__body" @submit.prevent="save">
      <label class="field">
        <span class="field__label">Titre</span>
        <input v-model="title" class="input" type="text" name="title" placeholder="Sans titre">
      </label>
      <label class="field">
        <span class="field__label">Tags</span>
        <input v-model="tagsText" class="input" type="text" name="tags" placeholder="street, paris">
      </label>

      <div class="card__exif">
        <p v-if="gear" class="card__gear">{{ gear }}</p>
        <p class="mono card__settings">{{ exif || 'Pas de données EXIF' }}</p>
      </div>

      <Transition name="fade">
        <p v-if="error" class="card__error" role="alert">{{ error }}</p>
      </Transition>

      <div class="card__actions">
        <button type="submit" class="btn btn--primary" :disabled="!dirty || saving">Enregistrer</button>
        <button type="button" class="btn" :disabled="saving" @click="togglePublished">
          {{ photo.published ? 'Dépublier' : 'Publier' }}
        </button>
        <button type="button" class="btn btn--ghost btn--danger card__delete" :disabled="saving" aria-label="Supprimer" @click="remove">
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  </li>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  overflow: hidden;
  transition:
    box-shadow var(--duration) var(--ease),
    border-color var(--duration) var(--ease),
    opacity var(--duration) var(--ease);
}

.card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.card--busy {
  opacity: 0.6;
}

.card__media {
  position: relative;
  max-height: 320px;
  width: 100%;
  background: var(--surface-hover);
  overflow: hidden;
}

.card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.02);
  transition:
    opacity var(--duration-slow) var(--ease),
    transform var(--duration-slow) var(--ease);
}

.card__img--loaded {
  opacity: 1;
  transform: none;
}

.card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.55);
  color: #fff;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.card__badge--published {
  background: var(--success);
  color: #fff;
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.card__exif {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card__gear {
  font-size: 13px;
  font-weight: 500;
}

.card__settings {
  color: var(--text-muted);
  white-space: pre;
}

.card__error {
  color: var(--danger);
  font-size: 13px;
}

.card__actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.card__delete {
  margin-left: auto;
  padding: 0 10px;
}
</style>
