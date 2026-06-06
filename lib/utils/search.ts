import type { ImageMetadata } from "@/lib/types/image"

export function searchImages(
  images: ImageMetadata[],
  query: string,
  collection?: string
): ImageMetadata[] {
  const normalizedQuery = query.trim().toLowerCase()

  return images.filter((image) => {
    if (collection && image.collection !== collection) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const haystack = [
      image.title,
      image.notes,
      image.sourceUrl,
      image.collection,
      ...image.tags,
      ...image.aiTags,
      image.aiDescription,
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

export function sortImages(
  images: ImageMetadata[],
  sortBy: "savedAt" | "title" = "savedAt",
  sortOrder: "asc" | "desc" = "desc"
): ImageMetadata[] {
  const sorted = [...images].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title)
    }
    return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
  })

  return sortOrder === "desc" ? sorted.reverse() : sorted
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; hasMore: boolean } {
  const total = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    items: items.slice(start, end),
    total,
    hasMore: end < total,
  }
}
