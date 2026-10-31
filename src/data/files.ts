export type StoredFile = {
  name: string
  type: string
  dataUrl: string
}

export function readStoredFile(file: File): Promise<StoredFile> {
  const image = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)
  if (image) return readImage(file).catch(() => readDataUrl(file))
  return readDataUrl(file)
}

function readImage(file: File): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const max = 1400
      const scale = Math.min(1, max / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!context) {
        reject(new Error('Could not read the image.'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve({ name: file.name, type: 'image/jpeg', dataUrl: canvas.toDataURL('image/jpeg', 0.72) })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the image.'))
    }
    image.src = url
  })
}

function readDataUrl(file: File): Promise<StoredFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', dataUrl: String(reader.result) })
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
}
