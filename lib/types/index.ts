import type { Collection } from "./collection"
import type { ImageMetadata } from "./image"

export interface MoodMemoryFolders {
  root: string
  images: string
  metadata: string
  collections: string
}

export interface MoodMemoryIndex {
  version: number
  folders: MoodMemoryFolders
  images: ImageMetadata[]
  collections: Collection[]
  updatedAt: string
}

export * from "./image"
export * from "./collection"
