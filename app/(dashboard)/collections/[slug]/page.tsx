import { notFound } from "next/navigation"
import { getCollectionAction, getImagesAction } from "@/lib/actions"
import { CollectionDetailClient } from "@/components/collections/collection-detail-client"

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const collection = await getCollectionAction(slug)

  if (!collection) {
    notFound()
  }

  const imagesResult = await getImagesAction(undefined, collection.name, 1, 100)

  return (
    <CollectionDetailClient
      collection={collection}
      images={imagesResult.images}
    />
  )
}
