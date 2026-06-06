"use server"

import { revalidatePath } from "next/cache"
import { getAuthenticatedDriveToken } from "@/lib/auth-tokens"
import { createDriveService } from "@/lib/drive/service"
import type { SaveImageInput, UpdateImageInput } from "@/lib/types/image"
import type { CreateCollectionInput, UpdateCollectionInput } from "@/lib/types/collection"

async function getDriveService() {
  const accessToken = await getAuthenticatedDriveToken()
  if (!accessToken) {
    throw new Error("Unauthorized")
  }

  const service = createDriveService(accessToken)
  await service.initializeMoodMemory()
  return service
}

export async function saveImageAction(input: SaveImageInput) {
  const service = await getDriveService()
  const image = await service.uploadImage(input)
  revalidatePath("/dashboard")
  revalidatePath("/collections")
  return image
}

export async function updateImageAction(id: string, updates: UpdateImageInput) {
  const service = await getDriveService()
  const image = await service.updateImageMetadata(id, updates)
  revalidatePath("/dashboard")
  revalidatePath(`/image/${id}`)
  revalidatePath("/collections")
  return image
}

export async function deleteImageAction(id: string) {
  const service = await getDriveService()
  await service.deleteImage(id)
  revalidatePath("/dashboard")
  revalidatePath("/collections")
}

export async function createCollectionAction(input: CreateCollectionInput) {
  const service = await getDriveService()
  const collection = await service.createCollection(input)
  revalidatePath("/collections")
  revalidatePath("/dashboard")
  return collection
}

export async function updateCollectionAction(
  slug: string,
  updates: UpdateCollectionInput
) {
  const service = await getDriveService()
  const collection = await service.updateCollection(slug, updates)
  revalidatePath("/collections")
  revalidatePath(`/collections/${slug}`)
  revalidatePath("/dashboard")
  return collection
}

export async function deleteCollectionAction(slug: string) {
  const service = await getDriveService()
  await service.deleteCollection(slug)
  revalidatePath("/collections")
  revalidatePath("/dashboard")
}

export async function getImagesAction(
  query?: string,
  collection?: string,
  page = 1,
  pageSize = 48
) {
  const service = await getDriveService()
  return service.getAllImages({ query, collection }, page, pageSize)
}

export async function getImageAction(id: string) {
  const service = await getDriveService()
  return service.getImageMetadata(id)
}

export async function getCollectionsAction() {
  const service = await getDriveService()
  return service.getCollections()
}

export async function getCollectionAction(slug: string) {
  const service = await getDriveService()
  return service.getCollectionBySlug(slug)
}
