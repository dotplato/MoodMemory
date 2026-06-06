"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "@phosphor-icons/react"
import type { Collection } from "@/lib/types/collection"
import { createCollectionAction } from "@/lib/actions"
import { CollectionCard } from "@/components/dashboard/collection-card"
import { EmptyState } from "@/components/dashboard/empty-states"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { showProgressToast } from "@/lib/progress-toast"

interface CollectionsClientProps {
  collections: Collection[]
}

export function CollectionsClient({ collections }: CollectionsClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) return

    const progress = showProgressToast("Creating collection...")

    startTransition(async () => {
      try {
        progress.update(58, "Saving to Google Drive...")
        const collection = await createCollectionAction({ name: name.trim() })
        progress.complete(`Collection "${collection.name}" created`)
        setOpen(false)
        setName("")
        router.refresh()
      } catch {
        progress.error("Failed to create collection")
      }
    })
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <LoadingOverlay show={isPending} label="Creating collection..." />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Collections</h1>
          <p className="text-xs text-muted-foreground">
            Organize inspiration by theme, project, or mood.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <PlusIcon data-icon="inline-start" />
                New collection
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create collection</DialogTitle>
              <DialogDescription>
                Group related images into a curated collection.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Web Design, Branding, Interiors..."
              onKeyDown={(event) => {
                if (event.key === "Enter") handleCreate()
              }}
            />
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Creating...
                  </>
                ) : (
                  "Create collection"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          variant="collections"
          action={
            <Button onClick={() => setOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Create your first collection
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  )
}
