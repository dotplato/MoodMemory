"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  FolderPlusIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import {
  createCollectionAction,
  getCollectionsAction,
  getImagesAction,
} from "@/lib/actions"
import type { Collection } from "@/lib/types/collection"
import type { ImageListItem } from "@/lib/types/image"
import { toast } from "@/components/ui/sonner"
import { showProgressToast } from "@/lib/progress-toast"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [images, setImages] = useState<ImageListItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [creating, setCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setQuery("")
      setCreating(false)
      setNewCollectionName("")
      return
    }

    startTransition(async () => {
      try {
        const [imageResults, collectionResults] = await Promise.all([
          getImagesAction(query || undefined, undefined, 1, 8),
          getCollectionsAction(),
        ])
        setImages(imageResults.images)
        setCollections(collectionResults)
      } catch {
        toast.error("Failed to load command palette data")
      }
    })
  }, [open, query])

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return

    const progress = showProgressToast("Creating collection...")

    try {
      progress.update(58, "Saving to Google Drive...")
      const collection = await createCollectionAction({
        name: newCollectionName.trim(),
      })
      progress.complete(`Collection "${collection.name}" created`)
      setCreating(false)
      setNewCollectionName("")
      onOpenChange(false)
      router.push(`/collections/${collection.slug}`)
    } catch {
      progress.error("Failed to create collection")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search images, jump to collections, or create a new collection.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b p-3">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or type a command..."
          />
        </div>

        <ScrollArea className="max-h-80">
          <div className="flex flex-col gap-4 p-3">
            <section>
              <p className="mb-2 px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Actions
              </p>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setCreating(true)}
                >
                  <FolderPlusIcon data-icon="inline-start" />
                  Create collection
                </Button>
              </div>
            </section>

            {creating ? (
              <section className="flex flex-col gap-2 border p-3">
                <p className="text-xs font-medium">New collection</p>
                <Input
                  value={newCollectionName}
                  onChange={(event) => setNewCollectionName(event.target.value)}
                  placeholder="Collection name"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleCreateCollection()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void handleCreateCollection()}>
                    <PlusIcon data-icon="inline-start" />
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </section>
            ) : null}

            <section>
              <p className="mb-2 px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Images
              </p>
              {isPending ? (
                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <Spinner />
                  Searching...
                </div>
              ) : images.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">
                  No matching images
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {images.map((image) => (
                    <Button
                      key={image.id}
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        onOpenChange(false)
                        router.push(`/image/${image.id}`)
                      }}
                    >
                      <MagnifyingGlassIcon data-icon="inline-start" />
                      <span className="truncate">{image.title || "Untitled"}</span>
                    </Button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <p className="mb-2 px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Collections
              </p>
              <div className="flex flex-col gap-1">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      onOpenChange(false)
                      router.push(`/collections/${collection.slug}`)
                    }}
                  >
                    <FolderPlusIcon data-icon="inline-start" />
                    {collection.name}
                  </Button>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t p-3">
          <p className="text-[10px] text-muted-foreground">
            Navigate with arrow keys · Enter to select · Esc to close
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
