import type { MaybeRefOrGetter } from 'vue'

// Photo ouverte, stockée dans l'URL (?photo=slug) : lien partageable,
// et le bouton retour du navigateur ferme la photo.
export function usePhotoViewer(photos: MaybeRefOrGetter<PhotoWithTags[]>) {
  const route = useRoute()
  const router = useRouter()

  // Vrai si la photo a été ouverte depuis la grille (entrée ajoutée à l'historique) :
  // fermer revient alors en arrière plutôt que d'empiler une nouvelle entrée.
  const openedFromGrid = ref(false)

  const activePhoto = computed(() => {
    const slug = route.query.photo
    if (typeof slug !== 'string') return null
    return toValue(photos).find(p => p.slug === slug) ?? null
  })

  watch(activePhoto, (photo) => {
    if (!photo) openedFromGrid.value = false
  })

  function queryWith(slug: string | undefined) {
    return { query: { ...route.query, photo: slug } }
  }

  function hrefFor(slug: string): string {
    return router.resolve(queryWith(slug)).href
  }

  function open(slug: string) {
    if (activePhoto.value) {
      router.replace(queryWith(slug))
      return
    }
    openedFromGrid.value = true
    router.push(queryWith(slug))
  }

  function close() {
    if (!activePhoto.value) return
    if (openedFromGrid.value) router.back()
    else router.replace(queryWith(undefined))
  }

  function step(delta: number) {
    const list = toValue(photos)
    const current = activePhoto.value
    if (!current || list.length < 2) return
    const index = list.findIndex(p => p.id === current.id)
    const next = list[(index + delta + list.length) % list.length]
    if (next) router.replace(queryWith(next.slug))
  }

  function onKeydown(event: KeyboardEvent) {
    if (!activePhoto.value) return
    const target = event.target
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]')) return
    if (event.key === 'Escape') close()
    else if (event.key === 'ArrowRight') step(1)
    else if (event.key === 'ArrowLeft') step(-1)
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

  return {
    activePhoto,
    hrefFor,
    open,
    close,
    next: () => step(1),
    prev: () => step(-1),
  }
}
