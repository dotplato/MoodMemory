"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"
import { showProgressToast } from "@/lib/progress-toast"

type ExtensionProgressMessage = {
  type: "MOODMEMORY_EXTENSION_PROGRESS"
  state: "start" | "update" | "complete" | "error"
  progress?: number
  message?: string
}

export function ExtensionSyncProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const progressRef = useRef<ReturnType<typeof showProgressToast> | null>(null)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return

      const data = event.data as ExtensionProgressMessage
      if (data?.type !== "MOODMEMORY_EXTENSION_PROGRESS") return

      if (data.state === "start") {
        progressRef.current?.dismiss()
        progressRef.current = showProgressToast(
          data.message ?? "Saving to library..."
        )
        return
      }

      if (data.state === "update") {
        if (!progressRef.current) {
          progressRef.current = showProgressToast(
            data.message ?? "Saving to library..."
          )
        }
        progressRef.current.update(
          data.progress ?? 0,
          data.message ?? "Uploading to library..."
        )
        return
      }

      if (data.state === "complete") {
        progressRef.current?.complete(data.message ?? "Saved to library")
        progressRef.current = null
        router.refresh()
        window.dispatchEvent(new CustomEvent("moodmemory:library-updated"))
        return
      }

      if (data.state === "error") {
        progressRef.current?.error(data.message ?? "Failed to save image")
        progressRef.current = null
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [router])

  return children
}
