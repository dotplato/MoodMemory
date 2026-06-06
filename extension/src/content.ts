const BUTTON_CLASS = "moodmemory-save-button"
const TOAST_CLASS = "moodmemory-toast"

import { captureImageFromUrl } from "./shared"

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

    button.disabled = true
    button.textContent = "Saving..."

    const imageUrl = getBestImageUrl(img)
    const meta = getPageMeta()

    try {
      const captured = await captureImageFromUrl(imageUrl)

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
        () => {
          button.disabled = false
          button.textContent = "Save"
        }
      )
    } catch {
      button.disabled = false
      button.textContent = "Save"
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

function showToast(message: string, type: "success" | "error" = "success") {
  const existing = document.querySelector(`.${TOAST_CLASS}`)
  existing?.remove()

  const toast = document.createElement("div")
  toast.className = `${TOAST_CLASS} ${TOAST_CLASS}--${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  requestAnimationFrame(() => toast.classList.add("is-visible"))

  window.setTimeout(() => {
    toast.classList.remove("is-visible")
    window.setTimeout(() => toast.remove(), 200)
  }, 2400)
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
  if (message.type === "MOODMEMORY_TOAST") {
    showToast(message.message, message.toastType)
  }
})
