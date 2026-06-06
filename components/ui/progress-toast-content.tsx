"use client"

import { cn } from "@/lib/utils"

interface ProgressToastContentProps {
  message: string
  progress: number
  variant?: "default" | "success" | "error"
}

export function ProgressToastContent({
  message,
  progress,
  variant = "default",
}: ProgressToastContentProps) {
  return (
    <div
      className={cn(
        "flex w-[min(100vw-2rem,18rem)] flex-col gap-2.5 border bg-background p-3 shadow-lg",
        variant === "success" && "border-primary/30",
        variant === "error" && "border-destructive/30"
      )}
    >
      <p className="text-xs font-medium">{message}</p>
      <div className="h-1 overflow-hidden bg-muted">
        <div
          className={cn(
            "h-full transition-[width] duration-200 ease-out",
            variant === "success" && "bg-primary",
            variant === "error" && "bg-destructive",
            variant === "default" && "bg-primary"
          )}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}
