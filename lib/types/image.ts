export interface ImageMetadata {
  id: string
  title: string
  imageDriveId: string
  sourceUrl: string
  savedAt: string
  collection: string
  tags: string[]
  notes: string
  aiTags: string[]
  aiDescription: string
  dominantColors: string[]
}

export interface ImageListItem extends ImageMetadata {
  thumbnailUrl?: string
  collectionSlug?: string
}

export interface SaveImageInput {
  imageUrl: string
  pageUrl: string
  pageTitle: string
  collection?: string
  /** Base64-encoded image bytes captured by the browser extension */
  imageDataBase64?: string
  mimeType?: string
}

export interface UpdateImageInput {
  title?: string
  collection?: string
  tags?: string[]
  notes?: string
}

export interface ImageSearchFilters {
  query?: string
  collection?: string
  tags?: string[]
  sortBy?: "savedAt" | "title"
  sortOrder?: "asc" | "desc"
}

export interface PaginatedImages {
  images: ImageListItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
