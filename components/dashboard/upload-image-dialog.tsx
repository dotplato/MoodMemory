"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { ClipboardIcon, PlusIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import type { Collection } from "@/lib/types/collection"
import { saveImageAction } from "@/lib/actions"
import { fileToBase64 } from "@/lib/utils/file-to-base64"
import { showProgressToast } from "@/lib/progress-toast"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface UploadImageDialogProps {
  collections: Collection[]
  defaultCollection?: string | null
  onUploaded?: () => void
}

export function UploadImageDialog({
  collections,
  defaultCollection,
  onUploaded,
}: UploadImageDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [collection, setCollection] = useState(
    defaultCollection ?? collections[0]?.name ?? "Uncategorized"
  )
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetState() {
    setSelectedFile(null)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setCollection(defaultCollection ?? collections[0]?.name ?? "Uncategorized")
    setIsDragging(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCollection(defaultCollection ?? collections[0]?.name ?? "Uncategorized")
    } else {
      resetState()
    }
    setOpen(nextOpen)
  }

  function setFile(file: File) {
    if (!file.type.startsWith("image/")) return

    setSelectedFile(file)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

  function handleUpload() {
    if (!selectedFile) return

    const progress = showProgressToast("Uploading image...")

    startTransition(async () => {
      try {
        progress.update(45, "Reading image...")
        const imageDataBase64 = await fileToBase64(selectedFile)

        progress.update(70, "Saving to library...")
        await saveImageAction({
          imageUrl: `manual://${selectedFile.name}`,
          pageUrl: `${window.location.origin}/dashboard`,
          pageTitle:
            selectedFile.name.replace(/\.[^.]+$/, "") || "Untitled upload",
          imageDataBase64,
          mimeType: selectedFile.type || "image/jpeg",
          collection,
        })

        progress.complete("Image uploaded")
        setOpen(false)
        resetState()
        onUploaded?.()
        window.dispatchEvent(new CustomEvent("moodmemory:library-updated"))
      } catch {
        progress.error("Failed to upload image")
      }
    })
  }

  useEffect(() => {
    if (!open) return

    function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (!item.type.startsWith("image/")) continue

        const file = item.getAsFile()
        if (!file) continue

        event.preventDefault()
        setFile(file)
        break
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [open])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            Add New
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload image</DialogTitle>
          <DialogDescription>
            Choose a file from your device or paste an image from your
            clipboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" htmlFor="upload-collection">
              Collection
            </label>
            <select
              id="upload-collection"
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

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              const file = event.dataTransfer.files[0]
              if (file) setFile(file)
            }}
            className={cn(
              "flex min-h-44 flex-col items-center justify-center gap-3 border border-dashed bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50",
              isDragging && "border-foreground bg-muted/50"
            )}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-40 max-w-full object-contain"
              />
            ) : (
              <>
                <UploadSimpleIcon className="size-8 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium">
                    Click to upload from device
                  </span>
                  <span className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <ClipboardIcon />
                    or paste from clipboard
                  </span>
                </div>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setFile(file)
              event.target.value = ""
            }}
          />

          {selectedFile ? (
            <p className="truncate text-[10px] text-muted-foreground">
              {selectedFile.name}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isPending}
          >
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
