export type UploadStatus = 'pending' | 'processing' | 'uploading' | 'done' | 'error'

export interface UploadItem {
  id: string
  name: string
  status: UploadStatus
  error: string | null
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

export function usePhotoUpload() {
  const supabase = useSupabase()
  const queue = ref<UploadItem[]>([])
  const busy = ref(false)

  function setStatus(id: string, status: UploadStatus, error: string | null = null) {
    const item = queue.value.find(i => i.id === id)
    if (item) {
      item.status = status
      item.error = error
    }
  }

  async function uploadOne(item: UploadItem, file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error('Format non supporté (JPEG, PNG ou WebP uniquement).')
    }

    setStatus(item.id, 'processing')
    const exif = await readExif(file)
    const bitmap = await createImageBitmap(file)
    const storageKey = crypto.randomUUID()
    const uploaded: string[] = []

    try {
      const sizes = widthsFor(bitmap.width)
      const hash = thumbhash(bitmap)
      const blobs = await Promise.all(sizes.map(w => toWebp(resize(bitmap, w))))

      setStatus(item.id, 'uploading')
      for (const [index, blob] of blobs.entries()) {
        const path = photoPath(storageKey, sizes[index] ?? 0)
        const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, blob, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        })
        if (error) throw error
        uploaded.push(path)
      }

      const { error } = await supabase.from('photos').insert({
        slug: `${slugify(baseName(file.name)) || 'photo'}-${storageKey.slice(0, 6)}`,
        storage_key: storageKey,
        width: bitmap.width,
        height: bitmap.height,
        sizes,
        thumbhash: hash,
        ...exif,
      })
      if (error) throw error
    }
    catch (error) {
      // Pas de fichiers orphelins si l'enregistrement échoue en cours de route.
      if (uploaded.length) await supabase.storage.from(PHOTOS_BUCKET).remove(uploaded)
      throw error
    }
    finally {
      bitmap.close()
    }
  }

  const pending: { item: UploadItem, file: File }[] = []

  // Traitement séquentiel : une photo à la fois pour limiter la mémoire utilisée.
  async function upload(files: File[], onUploaded: () => void) {
    for (const file of files) {
      const item: UploadItem = { id: crypto.randomUUID(), name: file.name, status: 'pending', error: null }
      queue.value.unshift(item)
      pending.push({ item, file })
    }
    if (busy.value) return
    busy.value = true

    let job = pending.shift()
    while (job) {
      try {
        await uploadOne(job.item, job.file)
        setStatus(job.item.id, 'done')
        onUploaded()
      }
      catch (error) {
        setStatus(job.item.id, 'error', errorMessage(error))
      }
      job = pending.shift()
    }
    busy.value = false
  }

  function clearFinished() {
    queue.value = queue.value.filter(i => i.status !== 'done')
  }

  return { queue, busy, upload, clearFinished }
}
