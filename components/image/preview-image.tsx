import Image from "next/image"
import { cn } from "@/lib/utils"

interface PreviewImageProps {
  imageId: string
  alt: string
  className?: string
  fill?: boolean
  priority?: boolean
  sizes?: string
}

export function PreviewImage({
  imageId,
  alt,
  className,
  fill,
  priority,
  sizes,
}: PreviewImageProps) {
  return (
    <Image
      src={`/api/images/${imageId}/preview`}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      unoptimized
      className={cn(className)}
    />
  )
}
