"use client"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  show?: boolean
  label?: string
  className?: string
}

export function LoadingOverlay({
  show = false,
  label = "Loading...",
  className,
}: LoadingOverlayProps) {
  if (!show) {
    return null
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]",
        className
      )}
    >
      <div className="flex items-center gap-2 border bg-background px-3 py-2 text-xs">
        <Spinner />
        {label}
      </div>
    </div>
  )
}
