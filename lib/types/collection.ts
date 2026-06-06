export interface Collection {
  id: string
  name: string
  slug: string
  createdAt: string
  imageCount: number
  description?: string
}

export interface CreateCollectionInput {
  name: string
  description?: string
}

export interface UpdateCollectionInput {
  name?: string
  description?: string
}
