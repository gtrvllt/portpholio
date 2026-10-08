// Normalise un lien saisi à la main : vide → null, « instagram.com/… » → « https://instagram.com/… ».
// Lève une erreur si ce n'est pas une adresse web valide.
export function normalizeUrl(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withScheme)
    if (!url.hostname.includes('.')) throw new Error('hostname')
    return url.href
  }
  catch {
    throw new Error('Lien invalide : saisis une adresse web, par exemple instagram.com/ton-compte.')
  }
}

// Affichage compact d'un lien : « instagram.com » plutôt que l'URL complète.
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  }
  catch {
    return url
  }
}
