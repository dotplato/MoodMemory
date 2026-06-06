"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import type { ImageListItem } from "@/lib/types/image"
import type { Collection } from "@/lib/types/collection"
import { getImagesAction } from "@/lib/actions"
import { useDebounce } from "@/hooks/use-debounce"
import { useLibrarySearch } from "@/components/providers/library-search-provider"
import { MasonryGrid } from "@/components/dashboard/masonry-grid"
import { CollectionFilters } from "@/components/dashboard/collection-filters"
import { UploadImageDialog } from "@/components/dashboard/upload-image-dialog"
import { EmptyState } from "@/components/dashboard/empty-states"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
  initialImages: ImageListItem[]
  initialTotal: number
  collections: Collection[]
}

export function DashboardClient({
  initialImages,
  initialTotal,
  collections,
}: DashboardClientProps) {
  const { query, setLoading } = useLibrarySearch()
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  )
  const [images, setImages] = useState(initialImages)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialImages.length < initialTotal)
  const [isRefetching, setIsRefetching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debouncedQuery = useDebounce(query, 250)
  const isFirstFetch = useRef(true)

  const fetchImages = useCallback(
    async (
      nextPage: number,
      options?: { showSearchLoading?: boolean; replace?: boolean }
    ) => {
      const showSearchLoading = options?.showSearchLoading ?? false
      const replace = options?.replace ?? nextPage === 1

      if (showSearchLoading) {
        setLoading(true)
      } else if (replace) {
        setIsRefetching(true)
      }

      try {
        const result = await getImagesAction(
          debouncedQuery || undefined,
          selectedCollection ?? undefined,
          nextPage,
          48
        )

        if (replace) {
          setImages(result.images)
          setTotal(result.total)
          setPage(nextPage)
          setHasMore(result.hasMore)
        } else {
          setImages((current) => [...current, ...result.images])
          setPage(nextPage)
          setHasMore(result.hasMore)
        }
      } finally {
        if (showSearchLoading) {
          setLoading(false)
        }
        setIsRefetching(false)
      }
    },
    [debouncedQuery, selectedCollection, setLoading]
  )

  useEffect(() => {
    if (isFirstFetch.current) {
      isFirstFetch.current = false
      return
    }

    setPage(1)
    startTransition(() => {
      void fetchImages(1, { showSearchLoading: Boolean(debouncedQuery) })
    })
  }, [debouncedQuery, selectedCollection, fetchImages])

  useEffect(() => {
    function handleLibraryUpdate() {
      void fetchImages(1)
    }

    window.addEventListener("moodmemory:library-updated", handleLibraryUpdate)
    return () =>
      window.removeEventListener("moodmemory:library-updated", handleLibraryUpdate)
  }, [fetchImages])

  function loadMore() {
    const nextPage = page + 1
    startTransition(() => {
      void fetchImages(nextPage, { replace: false })
    })
  }

  function handleImageCollectionChange(imageId: string, collection: string) {
    setImages((current) => {
      const updated = current.map((item) =>
        item.id === imageId ? { ...item, collection } : item
      )

      if (selectedCollection && selectedCollection !== collection) {
        return updated.filter((item) => item.id !== imageId)
      }

      return updated
    })

    if (selectedCollection && selectedCollection !== collection) {
      setTotal((current) => Math.max(0, current - 1))
    }
  }

  const showEmptyState = images.length === 0 && !isRefetching && !isPending

  return (
    <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <CollectionFilters
          collections={collections}
          selected={selectedCollection}
          onSelect={setSelectedCollection}
        />
        <UploadImageDialog
          collections={collections}
          defaultCollection={selectedCollection}
          onUploaded={() => void fetchImages(1)}
        />
      </div>

      {showEmptyState ? (
        <EmptyState
          variant={debouncedQuery ? "search" : "images"}
          action={
            debouncedQuery ? undefined : (
              <Button render={<Link href="/settings" />}>Install extension</Button>
            )
          }
        />
      ) : (
        <>
          <MasonryGrid
            images={images}
            collections={collections}
            onCollectionChange={handleImageCollectionChange}
            className={cn(
              (isRefetching || (isPending && page === 1)) &&
                "opacity-60 transition-opacity"
            )}
          />
          {hasMore ? (
            <div className="flex justify-center pb-8">
              <Button variant="outline" onClick={loadMore} disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          ) : null}
        </>
      )}

      {total > 0 ? (
        <p className="pb-2 text-center text-[10px] text-muted-foreground">
          {total} saved {total === 1 ? "image" : "images"}
        </p>
      ) : null}
    </div>
  )
}
