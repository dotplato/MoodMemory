"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { ImageListItem } from "@/lib/types/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ImageCardProps {
  image: ImageListItem
  className?: string
}

export function ImageCard({ image, className }: ImageCardProps) {
  const hostname = (() => {
    try {
      return new URL(image.sourceUrl).hostname.replace(/^www\./, "")
    } catch {
      return "Unknown source"
    }
  })()

  return (
    <Link
      href={`/image/${image.id}`}
      className={cn(
        "group relative block w-full overflow-hidden border bg-card transition-colors hover:border-foreground/20",
        className
      )}
    >
      <div className="relative w-full overflow-hidden bg-muted aspect-[4/5]">
        <img
          src={`/api/images/${image.id}/preview`}
          alt={image.title || "Saved image"}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-xs font-medium">
            {image.title || "Untitled"}
          </p>
          <Badge variant="muted" className="shrink-0">
            {image.collection}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span className="truncate">{hostname}</span>
          <span className="shrink-0">
            {formatDistanceToNow(new Date(image.savedAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  )
}
