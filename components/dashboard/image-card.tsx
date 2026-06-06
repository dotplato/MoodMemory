"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CaretDownIcon,
  CopyIcon,
  DownloadSimpleIcon,
  EyeIcon,
} from "@phosphor-icons/react"
import type { ImageListItem } from "@/lib/types/image"
import type { Collection } from "@/lib/types/collection"
import { updateImageAction } from "@/lib/actions"
import { copyImageToClipboard } from "@/lib/utils/copy-image"
import { toast } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ImageCardProps {
  image: ImageListItem
  collections?: Collection[]
  onCollectionChange?: (imageId: string, collection: string) => void
  className?: string
}

export function ImageCard({
  image,
  collections = [],
  onCollectionChange,
  className,
}: ImageCardProps) {
  const router = useRouter()
  const [copying, setCopying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [updatingCollection, setUpdatingCollection] = useState(false)
  const previewUrl = `/api/images/${image.id}/preview`

  async function handleCopy() {
    setCopying(true)
    try {
      await copyImageToClipboard(previewUrl)
      toast.success("Image copied to clipboard")
    } catch {
      toast.error("Could not copy image")
    } finally {
      setCopying(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const response = await fetch(previewUrl, { credentials: "include" })
      if (!response.ok) throw new Error("Failed to fetch image")

      const blob = await response.blob()
      const extension =
        blob.type.split("/")[1]?.replace("svg+xml", "svg") ?? "jpg"
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${image.title || image.id}.${extension}`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success("Download started")
    } catch {
      toast.error("Could not download image")
    } finally {
      setDownloading(false)
    }
  }

  async function handleCollectionSelect(collectionName: string) {
    if (collectionName === image.collection || updatingCollection) return

    setUpdatingCollection(true)
    try {
      await updateImageAction(image.id, { collection: collectionName })
      onCollectionChange?.(image.id, collectionName)
      toast.success("Collection updated")
    } catch {
      toast.error("Could not update collection")
    } finally {
      setUpdatingCollection(false)
    }
  }

  function handleOpen() {
    router.push(`/image/${image.id}`)
  }

  return (
    <article
      className={cn(
        "group relative w-full overflow-hidden bg-muted",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={image.title || "Saved image"}
        width={320}
        height={400}
        loading="lazy"
        decoding="async"
        className="block aspect-[4/5] size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />

      <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex justify-end gap-1">
          <CardActionButton
            label="Copy image"
            onClick={() => void handleCopy()}
            disabled={copying}
          >
            {copying ? <Spinner className="size-3.5" /> : <CopyIcon />}
          </CardActionButton>
          <CardActionButton
            label="Download image"
            onClick={() => void handleDownload()}
            disabled={downloading}
          >
            {downloading ? (
              <Spinner className="size-3.5" />
            ) : (
              <DownloadSimpleIcon />
            )}
          </CardActionButton>
          <CardActionButton label="Open image" onClick={handleOpen}>
            <EyeIcon />
          </CardActionButton>
        </div>

        {collections.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Change collection"
                  disabled={updatingCollection}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  className="pointer-events-auto flex max-w-full items-center gap-1 bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-60"
                >
                  <span className="truncate">
                    {updatingCollection ? "Updating..." : image.collection}
                  </span>
                  <CaretDownIcon className="size-3 shrink-0" />
                </button>
              }
            />
            <DropdownMenuContent>
              {collections.map((collection) => (
                <DropdownMenuItem
                  key={collection.id}
                  onClick={() => void handleCollectionSelect(collection.name)}
                >
                  {collection.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="pointer-events-none w-fit max-w-full truncate bg-black/55 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
            {image.collection}
          </span>
        )}
      </div>
    </article>
  )
}

function CardActionButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className="pointer-events-auto flex size-7 items-center justify-center bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-60"
    >
      {children}
    </button>
  )
}
