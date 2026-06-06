"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowSquareOutIcon,
  CopyIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { format } from "date-fns"
import type { Collection } from "@/lib/types/collection"
import type { ImageMetadata } from "@/lib/types/image"
import {
  deleteImageAction,
  getCollectionsAction,
  updateImageAction,
} from "@/lib/actions"
import { PreviewImage } from "@/components/image/preview-image"
import { toast } from "@/components/ui/sonner"
import { copyImageToClipboard } from "@/lib/utils/copy-image"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { showProgressToast } from "@/lib/progress-toast"

interface ImageDetailProps {
  image: ImageMetadata
}

export function ImageDetail({ image: initialImage }: ImageDetailProps) {
  const router = useRouter()
  const [image, setImage] = useState(initialImage)
  const [collections, setCollections] = useState<Collection[]>([])
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(image.title)
  const [notes, setNotes] = useState(image.notes)
  const [tags, setTags] = useState(image.tags.join(", "))
  const [collection, setCollection] = useState(image.collection)
  const [copying, setCopying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const previewUrl = `/api/images/${image.id}/preview`

  useEffect(() => {
    void getCollectionsAction().then(setCollections)
  }, [])

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

  function handleSave() {
    const progress = showProgressToast("Saving changes...")

    startTransition(async () => {
      try {
        progress.update(55, "Updating image...")
        const updated = await updateImageAction(image.id, {
          title: title.trim(),
          notes: notes.trim(),
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          collection,
        })
        setImage(updated)
        setEditing(false)
        progress.complete("Image updated")
        router.refresh()
      } catch {
        progress.error("Failed to update image")
      }
    })
  }

  function handleDelete() {
    const progress = showProgressToast("Deleting image...")

    startTransition(async () => {
      try {
        progress.update(60, "Removing from library...")
        await deleteImageAction(image.id)
        progress.complete("Image deleted")
        router.push("/dashboard")
        router.refresh()
      } catch {
        progress.error("Failed to delete image")
      }
    })
  }

  return (
    <div className="relative mx-auto grid max-w-6xl gap-8 p-4 md:grid-cols-[1.2fr_0.8fr] md:p-8">
      <LoadingOverlay show={isPending} label="Processing..." />
      <div className="group relative flex min-h-[420px] w-full items-center justify-center overflow-hidden border bg-muted">
        <PreviewImage
          imageId={image.id}
          alt={image.title || "Saved image"}
          className="max-h-[80vh] w-auto max-w-full object-contain"
          priority
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          <ImageActionButton
            label="Copy image"
            onClick={() => void handleCopy()}
            disabled={copying}
          >
            {copying ? <Spinner className="size-4" /> : <CopyIcon />}
          </ImageActionButton>
          <ImageActionButton
            label="Download image"
            onClick={() => void handleDownload()}
            disabled={downloading}
          >
            {downloading ? (
              <Spinner className="size-4" />
            ) : (
              <DownloadSimpleIcon />
            )}
          </ImageActionButton>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
              Saved image
            </p>
            <h1 className="mt-1 text-lg font-medium">
              {image.title || "Untitled"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing((value) => !value)}
            >
              <PencilSimpleIcon data-icon="inline-start" />
              {editing ? "Cancel" : "Edit"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="sm">
                    <TrashIcon data-icon="inline-start" />
                    Delete
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the image from your Google Drive
                    library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-col gap-4 border p-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" htmlFor="title">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" htmlFor="collection">
                Collection
              </label>
              <select
                id="collection"
                value={collection}
                onChange={(event) => setCollection(event.target.value)}
                className="flex h-8 w-full border border-input bg-transparent px-2.5 text-xs"
              >
                {collections.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" htmlFor="tags">
                Tags
              </label>
              <Input
                id="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="design, branding, ui"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" htmlFor="notes">
                Notes
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{image.collection}</Badge>
              {image.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {image.notes ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {image.notes}
              </p>
            ) : null}
          </>
        )}

        <div className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-4">
            <span>Saved</span>
            <span>{format(new Date(image.savedAt), "PPP p")}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Source</span>
            <Link
              href={image.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate text-foreground hover:underline"
            >
              {image.sourceUrl}
              <ArrowSquareOutIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageActionButton({
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
      className="pointer-events-auto flex size-10 items-center justify-center bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-60"
    >
      {children}
    </button>
  )
}
