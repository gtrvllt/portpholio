// Défilement animé maîtrisé (durée et courbe identiques sur tous les navigateurs),
// interrompu dès que l'utilisateur reprend la main (molette, toucher, clavier).

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4

let cancelCurrent: (() => void) | null = null

export function animateScrollTo(top: number, duration = 450): void {
  cancelCurrent?.()

  const start = window.scrollY
  const distance = top - start
  if (Math.abs(distance) < 1 || duration <= 0) {
    window.scrollTo(0, top)
    return
  }

  let frame = 0
  const startTime = performance.now()
  const interruptEvents = ['wheel', 'touchstart', 'keydown'] as const

  const cancel = () => {
    cancelAnimationFrame(frame)
    clearTimeout(fallback)
    interruptEvents.forEach(e => window.removeEventListener(e, cancel))
    if (cancelCurrent === cancel) cancelCurrent = null
  }

  // Filet de sécurité : si les frames ne tournent pas (onglet en arrière-plan), on arrive quand même à destination.
  const fallback = setTimeout(() => {
    window.scrollTo(0, top)
    cancel()
  }, duration + 100)

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    window.scrollTo(0, start + distance * easeOutQuart(progress))
    if (progress < 1) frame = requestAnimationFrame(step)
    else cancel()
  }

  interruptEvents.forEach(e => window.addEventListener(e, cancel, { passive: true }))
  cancelCurrent = cancel
  frame = requestAnimationFrame(step)
}
