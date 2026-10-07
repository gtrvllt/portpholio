<script setup lang="ts">
const emit = defineEmits<{ uploaded: [] }>()

const { queue, busy, upload, clearFinished } = usePhotoUpload()
const dragging = ref(false)

const STATUS_LABELS: Record<UploadStatus, string> = {
  pending: 'En attente',
  processing: 'Traitement',
  uploading: 'Envoi',
  done: 'Terminé',
  error: 'Erreur',
}

const hasFinished = computed(() => queue.value.some(i => i.status === 'done'))

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
        name="photos"
        multiple
        :accept="ACCEPTED_TYPES.join(',')"
        class="uploader__input"
        @change="onChange"
      >
      <svg class="uploader__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="uploader__title">Dépose tes photos ici</span>
      <span class="uploader__hint">ou clique pour parcourir · JPEG, PNG, WebP</span>
    </label>

    <Transition name="fade">
      <div v-if="queue.length" class="uploader__queue">
        <TransitionGroup name="list" tag="ul" class="uploader__list">
          <li v-for="item in queue" :key="item.id" class="uploader__item" :class="`uploader__item--${item.status}`">
            <span class="uploader__status" aria-hidden="true">
              <span v-if="item.status === 'processing' || item.status === 'uploading'" class="spinner" />
              <svg v-else-if="item.status === 'done'" viewBox="0 0 16 16" fill="none"><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <svg v-else-if="item.status === 'error'" viewBox="0 0 16 16" fill="none"><path d="M8 4.5v4m0 3h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
              <span v-else class="uploader__dot" />
            </span>
            <span class="uploader__name">{{ item.name }}</span>
            <span class="uploader__label mono">
              {{ STATUS_LABELS[item.status] }}
            </span>
            <p v-if="item.error" class="uploader__error">{{ item.error }}</p>
          </li>
        </TransitionGroup>
        <button v-if="hasFinished && !busy" type="button" class="btn btn--ghost uploader__clear" @click="clearFinished">
          Effacer les envois terminés
        </button>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.uploader__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 48px 16px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface);
  text-align: center;
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    border-color var(--duration) var(--ease),
    transform var(--duration) var(--ease);
}

.uploader__drop:hover {
  border-color: var(--text-subtle);
  background: var(--surface-hover);
}

.uploader__drop--active {
  border-style: solid;
  border-color: var(--text);
  background: var(--surface-hover);
  transform: scale(1.005);
}

.uploader__drop:focus-within {
  box-shadow: var(--focus-ring);
}

.uploader__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.uploader__icon {
  width: 28px;
  height: 28px;
  margin-bottom: 6px;
  color: var(--text-muted);
  transition: transform var(--duration) var(--ease);
}

.uploader__drop:hover .uploader__icon,
.uploader__drop--active .uploader__icon {
  transform: translateY(-2px);
}

.uploader__title {
  font-weight: 500;
}

.uploader__hint {
  color: var(--text-muted);
  font-size: 14px;
}

.uploader__queue {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  overflow: hidden;
}

.uploader__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.uploader__item {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 4px 12px;
  padding: 10px 16px;
  font-size: 14px;
}

.uploader__item + .uploader__item {
  border-top: 1px solid var(--border);
}

.uploader__status {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
}

.uploader__status svg {
  width: 16px;
  height: 16px;
}

.uploader__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-subtle);
}

.uploader__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uploader__label {
  color: var(--text-muted);
}

.uploader__item--done .uploader__status,
.uploader__item--done .uploader__label {
  color: var(--success);
}

.uploader__item--error .uploader__status,
.uploader__item--error .uploader__label {
  color: var(--danger);
}

.uploader__error {
  grid-column: 2 / -1;
  color: var(--danger);
  font-size: 13px;
}

.uploader__clear {
  align-self: flex-end;
  margin: 4px 8px 8px;
}
</style>
