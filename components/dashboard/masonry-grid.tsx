"use client"

import type { ImageListItem } from "@/lib/types/image"
import type { Collection } from "@/lib/types/collection"
import { ImageCard } from "@/components/dashboard/image-card"
import { cn } from "@/lib/utils"

interface MasonryGridProps {
  images: ImageListItem[]
  collections?: Collection[]
  onCollectionChange?: (imageId: string, collection: string) => void
  className?: string
}

const gridClassName =
  "grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5"

export function MasonryGrid({
  images,
  collections = [],
  onCollectionChange,
  className,
}: MasonryGridProps) {
  return (
    <div className={cn(gridClassName, className)}>
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          collections={collections}
          onCollectionChange={onCollectionChange}
        />
      ))}
    </div>
  )
}
