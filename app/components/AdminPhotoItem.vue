<script setup lang="ts">
const props = defineProps<{ photo: AdminPhoto }>()
const emit = defineEmits<{ changed: [], deleted: [] }>()

const { updatePhoto, setTags, deletePhoto } = useAdminPhotos()
const { photoUrl, closestSize } = usePhotoUrl()

const initialTags = computed(() => props.photo.tags.map(t => t.name).join(', '))
const title = ref(props.photo.title ?? '')
const tagsText = ref(initialTags.value)
const saving = ref(false)
const error = ref<string | null>(null)

watch(() => props.photo, (photo) => {
  title.value = photo.title ?? ''
  tagsText.value = initialTags.value
})

const dirty = computed(() =>
  title.value.trim() !== (props.photo.title ?? '') || tagsText.value !== initialTags.value,
)

const thumbUrl = computed(() => photoUrl(props.photo.storage_key, closestSize(props.photo.sizes, 480)))

const exifLine = computed(() => [
  props.photo.camera,
  props.photo.lens,
  formatFocal(props.photo.focal_length),
  formatAperture(props.photo.aperture),
  formatExposure(props.photo.exposure_time),
  formatIso(props.photo.iso),
].filter(Boolean).join(' · '))

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
  <li class="item">
    <img :src="thumbUrl" :alt="photo.title ?? ''" class="item__thumb" loading="lazy">

    <form class="item__form" @submit.prevent="save">
      <div class="item__meta">
        <span class="item__badge" :class="{ 'item__badge--published': photo.published }">
          {{ photo.published ? 'Publiée' : 'Brouillon' }}
        </span>
        <span>{{ photo.width }} × {{ photo.height }}</span>
      </div>

      <label>
        Titre
        <input v-model="title" type="text" placeholder="Sans titre">
      </label>
      <label>
        Tags (séparés par des virgules)
        <input v-model="tagsText" type="text" placeholder="street, paris">
      </label>

      <p class="item__exif">{{ exifLine || 'Pas de données EXIF' }}</p>
      <p v-if="error" class="item__error" role="alert">{{ error }}</p>

      <div class="item__actions">
        <button type="submit" :disabled="!dirty || saving">Enregistrer</button>
        <button type="button" :disabled="saving" @click="togglePublished">
          {{ photo.published ? 'Dépublier' : 'Publier' }}
        </button>
        <button type="button" class="item__delete" :disabled="saving" @click="remove">Supprimer</button>
      </div>
    </form>
  </li>
</template>

<style scoped>
.item {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}

@media (max-width: 560px) {
  .item {
    grid-template-columns: 1fr;
  }
}

.item__thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  background: #f0f0f0;
}

.item__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item__form label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
}

.item__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.item__badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: #eee;
}

.item__badge--published {
  background: #e3f2e5;
  color: #2e7d32;
}

.item__exif {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.item__error {
  margin: 0;
  color: #b00020;
}

.item__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.item__delete {
  margin-left: auto;
  color: #b00020;
}
</style>
