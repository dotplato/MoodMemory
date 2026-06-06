"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react"
import type { Collection } from "@/lib/types/collection"
import type { ImageListItem } from "@/lib/types/image"
import {
  deleteCollectionAction,
  updateCollectionAction,
} from "@/lib/actions"
import { MasonryGrid } from "@/components/dashboard/masonry-grid"
import { EmptyState } from "@/components/dashboard/empty-states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface CollectionDetailClientProps {
  collection: Collection
  images: ImageListItem[]
}

export function CollectionDetailClient({
  collection,
  images,
}: CollectionDetailClientProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(collection.name)
  const [isPending, startTransition] = useTransition()

  function handleRename() {
    if (!name.trim() || name.trim() === collection.name) {
      setEditing(false)
      return
    }

    startTransition(async () => {
      try {
        const updated = await updateCollectionAction(collection.slug, {
          name: name.trim(),
        })
        toast.success("Collection renamed")
        setEditing(false)
        router.replace(`/collections/${updated.slug}`)
        router.refresh()
      } catch {
        toast.error("Failed to rename collection")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCollectionAction(collection.slug)
        toast.success("Collection deleted")
        router.push("/collections")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete collection"
        )
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="max-w-xs"
              />
              <Button size="sm" onClick={handleRename} disabled={isPending}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setName(collection.name)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-medium">{collection.name}</h1>
              <p className="text-xs text-muted-foreground">
                {collection.imageCount} images
              </p>
            </>
          )}
        </div>

        {collection.slug !== "uncategorized" ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <PencilSimpleIcon data-icon="inline-start" />
              Rename
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
                  <AlertDialogTitle>Delete collection?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Images will be moved to Uncategorized. This action cannot be
                    undone.
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
        ) : null}
      </div>

      {images.length === 0 ? (
        <EmptyState variant="images" />
      ) : (
        <MasonryGrid images={images} />
      )}
    </div>
  )
}
