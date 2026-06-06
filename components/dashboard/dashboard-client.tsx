"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import type { ImageListItem } from "@/lib/types/image"
import type { Collection } from "@/lib/types/collection"
import { getImagesAction } from "@/lib/actions"
import { useDebounce } from "@/hooks/use-debounce"
import { SearchBar } from "@/components/dashboard/search-bar"
import { MasonryGrid } from "@/components/dashboard/masonry-grid"
import { EmptyState } from "@/components/dashboard/empty-states"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  const [query, setQuery] = useState("")
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  )
  const [images, setImages] = useState(initialImages)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialImages.length < initialTotal)
  const [isPending, startTransition] = useTransition()
  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    setPage(1)
    startTransition(async () => {
      const result = await getImagesAction(
        debouncedQuery || undefined,
        selectedCollection ?? undefined,
        1,
        48
      )
      setImages(result.images)
      setTotal(result.total)
      setHasMore(result.hasMore)
    })
  }, [debouncedQuery, selectedCollection])

  function loadMore() {
    const nextPage = page + 1
    startTransition(async () => {
      const result = await getImagesAction(
        debouncedQuery || undefined,
        selectedCollection ?? undefined,
        nextPage,
        48
      )
      setImages((current) => [...current, ...result.images])
      setPage(nextPage)
      setHasMore(result.hasMore)
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-medium">Library</h1>
          <p className="text-xs text-muted-foreground">
            {total} saved {total === 1 ? "image" : "images"}
          </p>
        </div>
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCollection === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCollection(null)}
        >
          All
        </Badge>
        {collections.map((collection) => (
          <Badge
            key={collection.id}
            variant={
              selectedCollection === collection.name ? "default" : "outline"
            }
            className="cursor-pointer"
            onClick={() => setSelectedCollection(collection.name)}
          >
            {collection.name}
          </Badge>
        ))}
      </div>

      {images.length === 0 && !isPending ? (
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
          <MasonryGrid images={images} loading={isPending && page === 1} />
          {hasMore ? (
            <div className="flex justify-center pb-8">
              <Button variant="outline" onClick={loadMore} disabled={isPending}>
                {isPending ? "Loading..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
