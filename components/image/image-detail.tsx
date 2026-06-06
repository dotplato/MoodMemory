"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowSquareOutIcon,
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
import { toast } from "@/components/ui/sonner"

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
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    void getCollectionsAction().then(setCollections)
  }, [])

  function handleSave() {
    startTransition(async () => {
      try {
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
        toast.success("Image updated")
        router.refresh()
      } catch {
        toast.error("Failed to update image")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteImageAction(image.id)
        toast.success("Image deleted")
        router.push("/dashboard")
        router.refresh()
      } catch {
        toast.error("Failed to delete image")
      }
    })
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 p-4 md:grid-cols-[1.2fr_0.8fr] md:p-8">
      <div className="relative aspect-[4/5] overflow-hidden border bg-muted">
        <PreviewImage
          imageId={image.id}
          alt={image.title || "Saved image"}
          fill
          className="object-contain"
          priority
        />
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
                    Delete
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
              Save changes
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
