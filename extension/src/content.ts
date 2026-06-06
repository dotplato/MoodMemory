import { captureImageFromUrl } from "./shared"

const BUTTON_CLASS = "moodmemory-save-button"
const TOAST_CLASS = "moodmemory-toast"

function getBestImageUrl(img: HTMLImageElement): string {
  if (img.currentSrc) {
    return img.currentSrc
  }

  const srcset = img.srcset
  if (srcset) {
    const candidates = srcset
      .split(",")
      .map((part) => {
        const [url, descriptor] = part.trim().split(/\s+/)
        const width = descriptor?.endsWith("w")
          ? Number.parseInt(descriptor, 10)
          : 0
        return { url, width: Number.isFinite(width) ? width : 0 }
      })
      .filter((candidate) => candidate.url)

    candidates.sort((a, b) => b.width - a.width)
    if (candidates[0]?.url) {
      return candidates[0].url
    }
  }

  return img.src
}

function getPageMeta() {
  return {
    pageUrl: window.location.href,
    pageTitle: document.title || "Untitled",
  }
}

let progressToastEl: HTMLElement | null = null
let progressInterval: number | null = null
let currentProgress = 0
let dismissTimeout: number | null = null

function stopFakeProgress() {
  if (progressInterval) {
    window.clearInterval(progressInterval)
    progressInterval = null
  }
}

function clearDismissTimeout() {
  if (dismissTimeout) {
    window.clearTimeout(dismissTimeout)
    dismissTimeout = null
  }
}

function setProgressBar(progress: number) {
  const bar = progressToastEl?.querySelector<HTMLElement>(
    ".moodmemory-toast__bar"
  )
  if (bar) {
    bar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`
  }
}

function setProgressMessage(message: string) {
  const messageEl = progressToastEl?.querySelector<HTMLElement>(
    ".moodmemory-toast__message"
  )
  if (messageEl) {
    messageEl.textContent = message
  }
}

function dismissProgressToast(delay = 0) {
  clearDismissTimeout()
  dismissTimeout = window.setTimeout(() => {
    progressToastEl?.classList.remove("is-visible")
    window.setTimeout(() => {
      progressToastEl?.remove()
      progressToastEl = null
    }, 220)
  }, delay)
}

function showProgressToast(message: string, progress = 4) {
  stopFakeProgress()
  clearDismissTimeout()
  progressToastEl?.remove()

  progressToastEl = document.createElement("div")
  progressToastEl.className = `${TOAST_CLASS} ${TOAST_CLASS}--progress`
  progressToastEl.innerHTML = `
    <div class="moodmemory-toast__message"></div>
    <div class="moodmemory-toast__track">
      <div class="moodmemory-toast__bar"></div>
    </div>
  `

  document.body.appendChild(progressToastEl)
  currentProgress = progress
  setProgressMessage(message)
  setProgressBar(progress)

  requestAnimationFrame(() => progressToastEl?.classList.add("is-visible"))

  progressInterval = window.setInterval(() => {
    if (currentProgress < 88) {
      currentProgress = Math.min(currentProgress + Math.random() * 7 + 2, 88)
      setProgressBar(currentProgress)
    }
  }, 180)
}

function updateProgressToast(progress: number, message?: string) {
  if (!progressToastEl) {
    showProgressToast(message ?? "Saving to MoodMemory...", progress)
    return
  }

  currentProgress = Math.max(currentProgress, progress)
  setProgressBar(currentProgress)
  if (message) {
    setProgressMessage(message)
  }
}

function completeProgressToast(message: string) {
  stopFakeProgress()
  currentProgress = 100
  setProgressBar(100)
  setProgressMessage(message)
  progressToastEl?.classList.add(`${TOAST_CLASS}--success`)
  dismissProgressToast(1800)
}

function showErrorToast(message: string) {
  stopFakeProgress()
  progressToastEl?.remove()
  progressToastEl = null

  const toast = document.createElement("div")
  toast.className = `${TOAST_CLASS} ${TOAST_CLASS}--error`
  toast.textContent = message
  document.body.appendChild(toast)

  requestAnimationFrame(() => toast.classList.add("is-visible"))

  window.setTimeout(() => {
    toast.classList.remove("is-visible")
    window.setTimeout(() => toast.remove(), 220)
  }, 3200)
}

function createSaveButton(img: HTMLImageElement) {
  if (img.dataset.moodmemoryBound === "true") return
  if (img.width < 80 || img.height < 80) return

  img.dataset.moodmemoryBound = "true"

  const wrapper = document.createElement("div")
  wrapper.className = "moodmemory-wrapper"

  const parent = img.parentElement
  if (!parent) return

  const computed = window.getComputedStyle(parent)
  if (computed.position === "static") {
    parent.style.position = "relative"
  }

  parent.insertBefore(wrapper, img)
  wrapper.appendChild(img)

  const button = document.createElement("button")
  button.type = "button"
  button.className = BUTTON_CLASS
  button.textContent = "Save"
  button.setAttribute("aria-label", "Save to MoodMemory")
  wrapper.appendChild(button)

  button.addEventListener("click", async (event) => {
    event.preventDefault()
    event.stopPropagation()

    showProgressToast("Saving to MoodMemory...", 4)

    button.disabled = true
    button.textContent = "Saving..."

    const imageUrl = getBestImageUrl(img)
    const meta = getPageMeta()

    try {
      updateProgressToast(18, "Reading image...")
      const captured = await captureImageFromUrl(imageUrl)
      updateProgressToast(36, "Uploading to MoodMemory...")

      chrome.runtime.sendMessage(
        {
          type: "MOODMEMORY_SAVE",
          payload: {
            imageUrl,
            pageUrl: meta.pageUrl,
            pageTitle: meta.pageTitle,
            imageDataBase64: captured.imageDataBase64,
            mimeType: captured.mimeType,
          },
        },
        (response) => {
          button.disabled = false
          button.textContent = "Save"

          if (chrome.runtime.lastError) {
            showErrorToast(chrome.runtime.lastError.message ?? "Failed to save")
            return
          }

          if (!response?.success) {
            showErrorToast(response?.error ?? "Failed to save image")
          }
        }
      )
    } catch (error) {
      button.disabled = false
      button.textContent = "Save"
      showErrorToast(
        error instanceof Error ? error.message : "Failed to save image"
      )
    }
  })
}

function bindImages(root: ParentNode = document.body) {
  root.querySelectorAll("img").forEach((node) => {
    if (node instanceof HTMLImageElement) {
      createSaveButton(node)
    }
  })
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLImageElement) {
        createSaveButton(node)
      } else if (node instanceof HTMLElement) {
        bindImages(node)
      }
    })
  }
})

bindImages()
observer.observe(document.body, { childList: true, subtree: true })

window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (event.data?.type !== "MOODMEMORY_AUTH") return

  chrome.runtime.sendMessage({
    type: "MOODMEMORY_SET_TOKEN",
    token: event.data.token,
    apiUrl: window.location.origin,
  })
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "MOODMEMORY_PROGRESS") {
    void handleProgressMessage(message)
    return
  }

  if (message.type === "MOODMEMORY_TOAST") {
    if (message.toastType === "error") {
      showErrorToast(message.message)
      return
    }

    completeProgressToast(message.message)
  }
})

async function handleProgressMessage(message: {
  state: "start" | "update" | "complete" | "error"
  progress?: number
  message?: string
}) {
  const storage = await new Promise<{ apiUrl?: string }>((resolve) => {
    chrome.storage.local.get(["apiUrl"], (result) => resolve(result))
  })

  const appOrigin = storage.apiUrl
    ? new URL(storage.apiUrl).origin
    : null

  if (appOrigin === window.location.origin) {
    window.postMessage(
      {
        type: "MOODMEMORY_EXTENSION_PROGRESS",
        state: message.state,
        progress: message.progress,
        message: message.message,
      },
      window.location.origin
    )
    return
  }

  if (message.state === "start") {
    showProgressToast(
      message.message ?? "Saving to MoodMemory...",
      message.progress ?? 4
    )
    return
  }

  if (message.state === "update") {
    updateProgressToast(message.progress ?? currentProgress, message.message)
    return
  }

  if (message.state === "complete") {
    completeProgressToast(message.message ?? "Saved to MoodMemory")
    return
  }

  if (message.state === "error") {
    showErrorToast(message.message ?? "Failed to save image")
  }
}
