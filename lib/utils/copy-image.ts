async function blobToPng(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") {
    return blob
  }

  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height

  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("Canvas is unavailable")
  }

  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("PNG conversion failed")),
      "image/png"
    )
  })
}

export async function copyImageToClipboard(imageUrl: string): Promise<void> {
  if (!navigator.clipboard?.write || !window.ClipboardItem) {
    throw new Error("Image clipboard is not supported in this browser")
  }

  const pngBlobPromise = fetch(imageUrl, { credentials: "include" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status})`)
      }
      return response.blob()
    })
    .then((blob) => blobToPng(blob))

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": pngBlobPromise,
    }),
  ])
}
