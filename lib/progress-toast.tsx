"use client"

import { toast } from "sonner"
import { ProgressToastContent } from "@/components/ui/progress-toast-content"

type ProgressController = {
  update: (progress: number, message?: string) => void
  complete: (message: string) => void
  error: (message: string) => void
  dismiss: () => void
}

export function showProgressToast(
  message = "Working..."
): ProgressController {
  let progress = 8
  let currentMessage = message
  const toastId = `progress-${Date.now()}`

  const render = (variant: "default" | "success" | "error" = "default") => {
    toast.custom(
      () => (
        <ProgressToastContent
          message={currentMessage}
          progress={progress}
          variant={variant}
        />
      ),
      { id: toastId, duration: Infinity }
    )
  }

  render()

  const interval = window.setInterval(() => {
    if (progress < 88) {
      progress = Math.min(progress + Math.random() * 8 + 3, 88)
      render()
    }
  }, 200)

  const stop = () => window.clearInterval(interval)

  return {
    update(nextProgress, message) {
      progress = Math.max(progress, nextProgress)
      if (message) currentMessage = message
      render()
    },
    complete(message) {
      stop()
      progress = 100
      currentMessage = message
      render("success")
      window.setTimeout(() => toast.dismiss(toastId), 1600)
    },
    error(message) {
      stop()
      progress = 100
      currentMessage = message
      render("error")
      window.setTimeout(() => toast.dismiss(toastId), 2800)
    },
    dismiss() {
      stop()
      toast.dismiss(toastId)
    },
  }
}
