<script setup lang="ts">
const emit = defineEmits<{ uploaded: [] }>()

const { queue, busy, upload, clearFinished } = usePhotoUpload()
const dragging = ref(false)

const STATUS_LABELS: Record<UploadStatus, string> = {
  pending: 'En attente',
  processing: 'Traitement…',
  uploading: 'Envoi…',
  done: 'Terminé',
  error: 'Erreur',
}

function addFiles(list: FileList | null | undefined) {
  if (!list?.length) return
  upload([...list], () => emit('uploaded'))
}

function onDrop(event: DragEvent) {
  dragging.value = false
  addFiles(event.dataTransfer?.files)
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles(input.files)
  input.value = ''
}
</script>

<template>
  <section class="uploader">
    <label
      class="uploader__drop"
      :class="{ 'uploader__drop--active': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <input
        type="file"
        multiple
        :accept="ACCEPTED_TYPES.join(',')"
        class="uploader__input"
        @change="onChange"
      >
      Glisse tes photos ici ou clique pour choisir (JPEG, PNG, WebP)
    </label>

    <div v-if="queue.length" class="uploader__queue">
      <ul>
        <li v-for="item in queue" :key="item.id" :class="`uploader__item--${item.status}`">
          <span>{{ item.name }}</span>
          <span>{{ STATUS_LABELS[item.status] }}<template v-if="item.error"> : {{ item.error }}</template></span>
        </li>
      </ul>
      <button v-if="!busy" type="button" @click="clearFinished">Effacer les envois terminés</button>
    </div>
  </section>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.uploader__drop {
  display: block;
  padding: 48px 16px;
  border: 1px dashed #aaa;
  border-radius: 8px;
  text-align: center;
  color: #666;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.uploader__drop--active,
.uploader__drop:hover {
  background: #f5f5f5;
  border-color: #333;
}

.uploader__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.uploader__queue ul {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
}

.uploader__queue li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0;
  font-size: 14px;
}

.uploader__item--done {
  color: #2e7d32;
}

.uploader__item--error {
  color: #b00020;
}
</style>
