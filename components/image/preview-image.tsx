import { cn } from "@/lib/utils"

interface PreviewImageProps {
  imageId: string
  alt: string
  className?: string
  priority?: boolean
}

export function PreviewImage({
  imageId,
  alt,
  className,
  priority,
}: PreviewImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/images/${imageId}/preview`}
      alt={alt}
      width={1200}
      height={1500}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("block size-full object-contain", className)}
    />
  )
}
