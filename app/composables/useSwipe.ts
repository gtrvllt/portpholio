import type { Ref } from 'vue'

interface SwipeOptions {
  /** Glissement vers la gauche (photo suivante). */
  onSwipeLeft: () => void
  /** Glissement vers la droite (photo précédente). */
  onSwipeRight: () => void
}

const LOCK_DISTANCE = 8 // px parcourus avant de décider si le geste est horizontal ou vertical
const COMMIT_DISTANCE = 56 // px pour valider un glissement
const FLICK_DISTANCE = 24 // distance minimale d'un geste court mais rapide
const FLICK_VELOCITY = 0.5 // px/ms au-delà desquels un geste court est validé
const MAX_DRAG = 120 // décalage visuel maximal de l'image pendant le geste
const DRAG_RESISTANCE = 0.55 // l'image suit le doigt avec un peu de résistance
const CLICK_GUARD_MS = 350 // un clic juste après un glissement est ignoré

// Partagé entre toutes les photos : après un glissement validé, le composant de la photo
// est remplacé par celui de la suivante, et un clic parasite doit y être ignoré aussi.
let ignoreClickUntil = 0

// Navigation au doigt sur un élément (doigt ou stylet uniquement, jamais la souris).
// L'élément doit avoir `touch-action: pan-y` : le navigateur garde le défilement vertical,
// et nous recevons les mouvements horizontaux.
// Pendant le geste, la variable CSS --swipe-x porte le décalage et l'attribut data-swiping est posé.
export function useSwipe(target: Ref<HTMLElement | null>, options: SwipeOptions) {
  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let startTime = 0
  let axis: 'x' | 'y' | null = null

  function reset(el: HTMLElement | null) {
    pointerId = null
    axis = null
    if (el) {
      el.removeAttribute('data-swiping')
      el.style.removeProperty('--swipe-x')
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse' || pointerId !== null) return
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    startTime = event.timeStamp
    axis = null
  }

  function onPointerMove(event: PointerEvent) {
    const el = target.value
    if (!el || event.pointerId !== pointerId) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (axis === null && Math.hypot(dx, dy) >= LOCK_DISTANCE) {
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axis === 'x') el.setAttribute('data-swiping', '')
    }
    if (axis !== 'x') return

    const drag = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx * DRAG_RESISTANCE))
    el.style.setProperty('--swipe-x', `${drag}px`)
  }

  function onPointerUp(event: PointerEvent) {
    const el = target.value
    if (event.pointerId !== pointerId) return
    const dx = event.clientX - startX
    const elapsed = Math.max(1, event.timeStamp - startTime)
    const wasHorizontal = axis === 'x'
    reset(el)
    if (!wasHorizontal) return

    ignoreClickUntil = performance.now() + CLICK_GUARD_MS
    const distance = Math.abs(dx)
    const committed = distance >= COMMIT_DISTANCE || (distance >= FLICK_DISTANCE && distance / elapsed >= FLICK_VELOCITY)
    if (!committed) return
    if (dx < 0) options.onSwipeLeft()
    else options.onSwipeRight()
  }

  function onPointerCancel(event: PointerEvent) {
    if (event.pointerId === pointerId) reset(target.value)
  }

  let attached: HTMLElement | null = null

  function attach(el: HTMLElement | null) {
    if (attached) {
      attached.removeEventListener('pointerdown', onPointerDown)
      attached.removeEventListener('pointermove', onPointerMove)
      attached.removeEventListener('pointerup', onPointerUp)
      attached.removeEventListener('pointercancel', onPointerCancel)
    }
    attached = el
    if (!el) return
    el.addEventListener('pointerdown', onPointerDown, { passive: true })
    el.addEventListener('pointermove', onPointerMove, { passive: true })
    el.addEventListener('pointerup', onPointerUp, { passive: true })
    el.addEventListener('pointercancel', onPointerCancel, { passive: true })
  }

  onMounted(() => attach(target.value))
  onBeforeUnmount(() => attach(null))

  // À appeler au début d'un gestionnaire de clic : vrai si le clic suit un glissement.
  function shouldIgnoreClick(): boolean {
    return performance.now() < ignoreClickUntil
  }

  return { shouldIgnoreClick }
}
