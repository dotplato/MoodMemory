import {
  notifySaveProgress,
  saveToMoodMemoryWithProgress,
} from "./shared"

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-moodmemory",
    title: "Save to MoodMemory",
    contexts: ["image"],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "save-to-moodmemory" || !info.srcUrl || !tab?.id) {
    return
  }

  notifySaveProgress(tab.id, {
    state: "start",
    progress: 6,
    message: "Saving to MoodMemory...",
  })

  try {
    notifySaveProgress(tab.id, {
      state: "update",
      progress: 18,
      message: "Reading image...",
    })

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (imageUrl: string) => {
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to read image (${response.status})`)
        }

        const blob = await response.blob()
        const mimeType = blob.type || "image/jpeg"
        const arrayBuffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ""

        for (let index = 0; index < bytes.length; index += 8192) {
          binary += String.fromCharCode(...bytes.subarray(index, index + 8192))
        }

        return {
          imageDataBase64: btoa(binary),
          mimeType,
        }
      },
      args: [info.srcUrl],
    })

    const captured = result?.result as
      | { imageDataBase64: string; mimeType: string }
      | undefined

    if (!captured?.imageDataBase64) {
      throw new Error("Could not read image data from the page")
    }

    await saveToMoodMemoryWithProgress(
      {
        imageUrl: info.srcUrl,
        pageUrl: tab.url ?? info.srcUrl,
        pageTitle: tab.title ?? "Untitled",
        imageDataBase64: captured.imageDataBase64,
        mimeType: captured.mimeType,
      },
      (payload) => notifySaveProgress(tab.id, payload)
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save image"
    notifySaveProgress(tab.id, { state: "error", message })
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MOODMEMORY_SAVE") {
    const tabId = sender.tab?.id

    void saveToMoodMemoryWithProgress(message.payload, (payload) => {
      notifySaveProgress(tabId, payload)
    })
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Failed to save image",
        })
      })

    return true
  }

  if (message.type === "MOODMEMORY_SET_TOKEN") {
    chrome.storage.local.set(
      {
        token: message.token,
        apiUrl: message.apiUrl,
      },
      () => sendResponse({ success: true })
    )
    return true
  }
})
