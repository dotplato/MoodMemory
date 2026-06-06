const DEFAULT_API_URL = "http://localhost:3000"

export interface SavePayload {
  imageUrl: string
  pageUrl: string
  pageTitle: string
  imageDataBase64?: string
  mimeType?: string
}

export interface StorageData {
  token?: string
  apiUrl?: string
}

export type ProgressState = "start" | "update" | "complete" | "error"

export interface ProgressPayload {
  state: ProgressState
  progress?: number
  message?: string
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunkSize = 8192

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return btoa(binary)
}

export async function captureImageFromUrl(url: string): Promise<{
  imageDataBase64: string
  mimeType: string
}> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to read image in browser (${response.status})`)
  }

  const blob = await response.blob()
  const mimeType = blob.type || "image/jpeg"

  if (!mimeType.startsWith("image/")) {
    throw new Error(`Browser could not read image data (${mimeType})`)
  }

  const arrayBuffer = await blob.arrayBuffer()

  if (arrayBuffer.byteLength < 128) {
    throw new Error("Image data is empty")
  }

  return {
    imageDataBase64: arrayBufferToBase64(arrayBuffer),
    mimeType,
  }
}

export async function getStorage(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["token", "apiUrl"], (result) => {
      resolve({
        token: result.token as string | undefined,
        apiUrl: (result.apiUrl as string | undefined) ?? DEFAULT_API_URL,
      })
    })
  })
}

export async function saveToMoodMemory(payload: SavePayload): Promise<void> {
  const { token, apiUrl } = await getStorage()

  if (!token) {
    throw new Error("Not connected. Open the MoodMemory popup to sign in.")
  }

  const response = await fetch(`${apiUrl}/api/extension/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? "Failed to save image")
  }
}

export function sendProgressToTab(
  tabId: number | undefined,
  payload: ProgressPayload
) {
  if (!tabId) return

  chrome.tabs.sendMessage(tabId, {
    type: "MOODMEMORY_PROGRESS",
    ...payload,
  })
}

export async function sendProgressToApp(payload: ProgressPayload) {
  const { apiUrl } = await getStorage()
  if (!apiUrl) return

  let origin: string
  try {
    origin = new URL(apiUrl).origin
  } catch {
    return
  }

  const tabs = await chrome.tabs.query({})

  await Promise.all(
    tabs
      .filter((tab) => tab.id && tab.url?.startsWith(origin))
      .map((tab) =>
        chrome.tabs
          .sendMessage(tab.id!, {
            type: "MOODMEMORY_PROGRESS",
            ...payload,
          })
          .catch(() => undefined)
      )
  )
}

export function notifySaveProgress(
  tabId: number | undefined,
  payload: ProgressPayload
) {
  sendProgressToTab(tabId, payload)
  void sendProgressToApp(payload)
}

export async function saveToMoodMemoryWithProgress(
  payload: SavePayload,
  onProgress: (payload: ProgressPayload) => void
): Promise<void> {
  const hasImageData = Boolean(payload.imageDataBase64)

  onProgress({
    state: hasImageData ? "update" : "start",
    progress: hasImageData ? 48 : 8,
    message: hasImageData
      ? "Uploading to MoodMemory..."
      : "Saving to MoodMemory...",
  })

  let fakeProgress = hasImageData ? 48 : 8
  const interval = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.random() * 9 + 3, 92)
    onProgress({
      state: "update",
      progress: Math.round(fakeProgress),
      message: "Uploading to MoodMemory...",
    })
  }, 220)

  try {
    await saveToMoodMemory(payload)

    clearInterval(interval)
    onProgress({
      state: "complete",
      progress: 100,
      message: "Saved to MoodMemory",
    })
  } catch (error) {
    clearInterval(interval)
    onProgress({
      state: "error",
      message:
        error instanceof Error ? error.message : "Failed to save image",
    })
    throw error
  }
}

export function showToast(message: string, type: "success" | "error" = "success") {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id
    if (!tabId) return

    chrome.tabs.sendMessage(tabId, {
      type: "MOODMEMORY_TOAST",
      message,
      toastType: type,
    })
  })
}
