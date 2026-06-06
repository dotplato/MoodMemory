"use client"

import Masonry from "react-masonry-css"
import type { ImageListItem } from "@/lib/types/image"
import { ImageCard } from "@/components/dashboard/image-card"
import { Skeleton } from "@/components/ui/skeleton"

interface MasonryGridProps {
  images: ImageListItem[]
  loading?: boolean
}

const breakpointColumns = {
  default: 4,
  1280: 3,
  768: 2,
  480: 1,
}

export function MasonryGrid({ images, loading }: MasonryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/5] w-full" />
        ))}
      </div>
    )
  }

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="-ml-4 flex w-auto"
      columnClassName="flex flex-col gap-4 pl-4"
    >
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </Masonry>
  )
}
