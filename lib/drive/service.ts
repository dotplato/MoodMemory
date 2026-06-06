import { v4 as uuidv4 } from "uuid"
import type { drive_v3 } from "googleapis"
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from "@/lib/types/collection"
import type {
  ImageMetadata,
  ImageSearchFilters,
  PaginatedImages,
  SaveImageInput,
  UpdateImageInput,
} from "@/lib/types/image"
import type { MoodMemoryIndex } from "@/lib/types"
import { uniqueSlug } from "@/lib/utils/slug"
import { paginate, searchImages, sortImages } from "@/lib/utils/search"
import { createDriveClient } from "./client"
import {
  createFolder,
  createJsonFile,
  deleteFile,
  findFileByName,
  findFolderByName,
  getExtensionFromMime,
  INDEX_FILENAME,
  MOODMEMORY_ROOT,
  FOLDER_NAMES,
  readJsonFile,
  writeJsonFile,
} from "./helpers"

import { uploadBinaryFile, verifyDriveFile } from "./upload"

export class DriveService {
  private drive: drive_v3.Drive
  private accessToken: string
  private indexFileId: string | null = null

  constructor(accessToken: string) {
    this.accessToken = accessToken
    this.drive = createDriveClient(accessToken)
  }

  async initializeMoodMemory(): Promise<MoodMemoryIndex> {
    const existing = await this.loadIndex()
    if (existing) {
      return existing
    }

    const rootId = await this.createRootFolder()
    const imagesId = await this.createImagesFolder(rootId)
    const metadataId = await this.createMetadataFolder(rootId)
    const collectionsId = await this.createCollectionsFolder(rootId)

    const defaultCollection: Collection = {
      id: uuidv4(),
      name: "Uncategorized",
      slug: "uncategorized",
      createdAt: new Date().toISOString(),
      imageCount: 0,
    }

    const index: MoodMemoryIndex = {
      version: 1,
      folders: {
        root: rootId,
        images: imagesId,
        metadata: metadataId,
        collections: collectionsId,
      },
      images: [],
      collections: [defaultCollection],
      updatedAt: new Date().toISOString(),
    }

    this.indexFileId = await createJsonFile(
      this.drive,
      INDEX_FILENAME,
      rootId,
      index
    )

    await createJsonFile(
      this.drive,
      `${defaultCollection.slug}.json`,
      collectionsId,
      defaultCollection
    )

    return index
  }

  async createRootFolder(): Promise<string> {
    const existing = await findFolderByName(this.drive, MOODMEMORY_ROOT)
    if (existing) return existing
    return createFolder(this.drive, MOODMEMORY_ROOT)
  }

  async createImagesFolder(rootId: string): Promise<string> {
    const existing = await findFolderByName(
      this.drive,
      FOLDER_NAMES.images,
      rootId
    )
    if (existing) return existing
    return createFolder(this.drive, FOLDER_NAMES.images, rootId)
  }

  async createMetadataFolder(rootId: string): Promise<string> {
    const existing = await findFolderByName(
      this.drive,
      FOLDER_NAMES.metadata,
      rootId
    )
    if (existing) return existing
    return createFolder(this.drive, FOLDER_NAMES.metadata, rootId)
  }

  async createCollectionsFolder(rootId: string): Promise<string> {
    const existing = await findFolderByName(
      this.drive,
      FOLDER_NAMES.collections,
      rootId
    )
    if (existing) return existing
    return createFolder(this.drive, FOLDER_NAMES.collections, rootId)
  }

  private async loadIndex(): Promise<MoodMemoryIndex | null> {
    const rootId = await findFolderByName(this.drive, MOODMEMORY_ROOT)
    if (!rootId) return null

    const indexFileId = await findFileByName(this.drive, INDEX_FILENAME, rootId)
    if (!indexFileId) return null

    this.indexFileId = indexFileId
    return readJsonFile<MoodMemoryIndex>(this.drive, indexFileId)
  }

  private async getIndex(): Promise<MoodMemoryIndex> {
    const index = await this.loadIndex()
    if (!index) {
      return this.initializeMoodMemory()
    }
    return index
  }

  private async saveIndex(index: MoodMemoryIndex): Promise<void> {
    if (!this.indexFileId) {
      const rootId = index.folders.root
      this.indexFileId =
        (await findFileByName(this.drive, INDEX_FILENAME, rootId)) ??
        (await createJsonFile(this.drive, INDEX_FILENAME, rootId, index))
    }

    index.updatedAt = new Date().toISOString()
    await writeJsonFile(this.drive, this.indexFileId, index)
  }

  async uploadImage(input: SaveImageInput): Promise<ImageMetadata> {
    const index = await this.getIndex()
    await this.ensureFolderIds(index)

    const { buffer, mimeType } = await this.resolveImageBytes(input)
    const extension = getExtensionFromMime(mimeType)
    const id = uuidv4()
    const filename = `${id}.${extension}`

    const imageDriveId = await uploadBinaryFile({
      accessToken: this.accessToken,
      parentId: index.folders.images,
      name: filename,
      mimeType,
      buffer,
    })

    await verifyDriveFile(this.accessToken, imageDriveId)

    const collectionName = input.collection ?? "Uncategorized"
    const metadata: ImageMetadata = {
      id,
      title: input.pageTitle || "Untitled",
      imageDriveId,
      sourceUrl: input.pageUrl,
      savedAt: new Date().toISOString(),
      collection: collectionName,
      tags: [],
      notes: "",
      aiTags: [],
      aiDescription: "",
      dominantColors: [],
    }

    await createJsonFile(
      this.drive,
      `${id}.json`,
      index.folders.metadata,
      metadata
    )

    index.images.unshift(metadata)
    this.updateCollectionCounts(index)
    await this.saveIndex(index)

    return metadata
  }

  private async ensureFolderIds(index: MoodMemoryIndex): Promise<void> {
    const rootId =
      (await findFolderByName(this.drive, MOODMEMORY_ROOT)) ??
      index.folders.root

    const imagesId =
      (await findFolderByName(this.drive, FOLDER_NAMES.images, rootId)) ??
      (await this.createImagesFolder(rootId))

    const metadataId =
      (await findFolderByName(this.drive, FOLDER_NAMES.metadata, rootId)) ??
      (await this.createMetadataFolder(rootId))

    const collectionsId =
      (await findFolderByName(this.drive, FOLDER_NAMES.collections, rootId)) ??
      (await this.createCollectionsFolder(rootId))

    index.folders = {
      root: rootId,
      images: imagesId,
      metadata: metadataId,
      collections: collectionsId,
    }
  }

  private async resolveImageBytes(
    input: SaveImageInput
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    if (input.imageDataBase64) {
      const buffer = Buffer.from(input.imageDataBase64, "base64")

      if (buffer.length < 128) {
        throw new Error("Image data from extension is empty or too small")
      }

      const mimeType = input.mimeType?.startsWith("image/")
        ? input.mimeType
        : "image/jpeg"

      return { buffer, mimeType }
    }

    const fetched = await this.fetchImageBuffer(input.imageUrl, input.pageUrl)
    return {
      buffer: Buffer.from(fetched.buffer),
      mimeType: fetched.mimeType,
    }
  }

  private async fetchImageBuffer(
    imageUrl: string,
    pageUrl?: string
  ): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
    let resolvedUrl = imageUrl.trim()

    if (resolvedUrl.startsWith("//")) {
      resolvedUrl = `https:${resolvedUrl}`
    }

    if (resolvedUrl.startsWith("/")) {
      if (!pageUrl) {
        throw new Error("Cannot resolve relative image URL without page URL")
      }
      resolvedUrl = new URL(resolvedUrl, pageUrl).toString()
    }

    const referer = (() => {
      try {
        const base = pageUrl ?? imageUrl
        return new URL(base).origin + "/"
      } catch {
        return undefined
      }
    })()

    const response = await fetch(resolvedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        ...(referer ? { Referer: referer } : {}),
      },
      redirect: "follow",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ?? ""

    if (!contentType.startsWith("image/")) {
      throw new Error(
        `URL did not return an image (${contentType || "unknown type"})`
      )
    }

    const buffer = await response.arrayBuffer()

    if (buffer.byteLength < 128) {
      throw new Error("Downloaded image is empty or too small")
    }

    return { buffer, mimeType: contentType }
  }

  async deleteImage(id: string): Promise<void> {
    const index = await this.getIndex()
    const image = index.images.find((item) => item.id === id)

    if (!image) {
      throw new Error("Image not found")
    }

    await deleteFile(this.drive, image.imageDriveId)

    const metadataFileId = await findFileByName(
      this.drive,
      `${id}.json`,
      index.folders.metadata
    )
    if (metadataFileId) {
      await deleteFile(this.drive, metadataFileId)
    }

    index.images = index.images.filter((item) => item.id !== id)
    this.updateCollectionCounts(index)
    await this.saveIndex(index)
  }

  async updateImageMetadata(
    id: string,
    updates: UpdateImageInput
  ): Promise<ImageMetadata> {
    const index = await this.getIndex()
    const imageIndex = index.images.findIndex((item) => item.id === id)

    if (imageIndex === -1) {
      throw new Error("Image not found")
    }

    const updated: ImageMetadata = {
      ...index.images[imageIndex],
      ...updates,
    }

    index.images[imageIndex] = updated
    this.updateCollectionCounts(index)
    await this.saveIndex(index)

    const metadataFileId = await findFileByName(
      this.drive,
      `${id}.json`,
      index.folders.metadata
    )
    if (metadataFileId) {
      await writeJsonFile(this.drive, metadataFileId, updated)
    }

    return updated
  }

  async getImageMetadata(id: string): Promise<ImageMetadata | null> {
    const index = await this.getIndex()
    return index.images.find((item) => item.id === id) ?? null
  }

  async getAllImages(
    filters: ImageSearchFilters = {},
    page = 1,
    pageSize = 48
  ): Promise<PaginatedImages> {
    const index = await this.getIndex()
    let results = searchImages(
      index.images,
      filters.query ?? "",
      filters.collection
    )

    results = sortImages(
      results,
      filters.sortBy ?? "savedAt",
      filters.sortOrder ?? "desc"
    )

    const { items, total, hasMore } = paginate(results, page, pageSize)

    return {
      images: items.map((image) => ({
        ...image,
        collectionSlug: index.collections.find((c) => c.name === image.collection)
          ?.slug,
      })),
      total,
      page,
      pageSize,
      hasMore,
    }
  }

  async searchImages(
    query: string,
    page = 1,
    pageSize = 48
  ): Promise<PaginatedImages> {
    return this.getAllImages({ query }, page, pageSize)
  }

  async getCollections(): Promise<Collection[]> {
    const index = await this.getIndex()
    return index.collections
  }

  async createCollection(input: CreateCollectionInput): Promise<Collection> {
    const index = await this.getIndex()
    const existingSlugs = index.collections.map((c) => c.slug)

    const collection: Collection = {
      id: uuidv4(),
      name: input.name,
      slug: uniqueSlug(input.name, existingSlugs),
      createdAt: new Date().toISOString(),
      imageCount: 0,
      description: input.description,
    }

    await createJsonFile(
      this.drive,
      `${collection.slug}.json`,
      index.folders.collections,
      collection
    )

    index.collections.push(collection)
    await this.saveIndex(index)

    return collection
  }

  async updateCollection(
    slug: string,
    updates: UpdateCollectionInput
  ): Promise<Collection> {
    const index = await this.getIndex()
    const collectionIndex = index.collections.findIndex((c) => c.slug === slug)

    if (collectionIndex === -1) {
      throw new Error("Collection not found")
    }

    const current = index.collections[collectionIndex]
    const newName = updates.name ?? current.name
    const existingSlugs = index.collections
      .filter((c) => c.slug !== slug)
      .map((c) => c.slug)

    const updated: Collection = {
      ...current,
      ...updates,
      name: newName,
      slug: updates.name ? uniqueSlug(newName, existingSlugs) : current.slug,
    }

    if (updates.name && updated.slug !== slug) {
      index.images = index.images.map((image) =>
        image.collection === current.name
          ? { ...image, collection: updated.name }
          : image
      )

      const oldFileId = await findFileByName(
        this.drive,
        `${slug}.json`,
        index.folders.collections
      )
      if (oldFileId) {
        await deleteFile(this.drive, oldFileId)
      }

      await createJsonFile(
        this.drive,
        `${updated.slug}.json`,
        index.folders.collections,
        updated
      )
    } else {
      const fileId = await findFileByName(
        this.drive,
        `${slug}.json`,
        index.folders.collections
      )
      if (fileId) {
        await writeJsonFile(this.drive, fileId, updated)
      }
    }

    index.collections[collectionIndex] = updated
    this.updateCollectionCounts(index)
    await this.saveIndex(index)

    return updated
  }

  async deleteCollection(slug: string): Promise<void> {
    if (slug === "uncategorized") {
      throw new Error("Cannot delete the default collection")
    }

    const index = await this.getIndex()
    const collection = index.collections.find((c) => c.slug === slug)

    if (!collection) {
      throw new Error("Collection not found")
    }

    index.images = index.images.map((image) =>
      image.collection === collection.name
        ? { ...image, collection: "Uncategorized" }
        : image
    )

    index.collections = index.collections.filter((c) => c.slug !== slug)

    const fileId = await findFileByName(
      this.drive,
      `${slug}.json`,
      index.folders.collections
    )
    if (fileId) {
      await deleteFile(this.drive, fileId)
    }

    this.updateCollectionCounts(index)
    await this.saveIndex(index)
  }

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const index = await this.getIndex()
    return index.collections.find((c) => c.slug === slug) ?? null
  }

  async getImageBuffer(
    imageDriveId: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const { getDriveFileBuffer } = await import("./media")
    return getDriveFileBuffer(this.drive, imageDriveId)
  }

  async getImageStream(imageDriveId: string) {
    const response = await this.drive.files.get(
      { fileId: imageDriveId, alt: "media" },
      { responseType: "stream" }
    )
    return response.data
  }

  async getImageMimeType(imageDriveId: string): Promise<string> {
    const response = await this.drive.files.get({
      fileId: imageDriveId,
      fields: "mimeType",
    })
    return response.data.mimeType ?? "image/jpeg"
  }

  private updateCollectionCounts(index: MoodMemoryIndex): void {
    const counts = new Map<string, number>()

    for (const image of index.images) {
      counts.set(image.collection, (counts.get(image.collection) ?? 0) + 1)
    }

    index.collections = index.collections.map((collection) => ({
      ...collection,
      imageCount: counts.get(collection.name) ?? 0,
    }))
  }
}

export function createDriveService(accessToken: string): DriveService {
  return new DriveService(accessToken)
}
