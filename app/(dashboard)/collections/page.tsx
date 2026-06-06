import { getCollectionsAction } from "@/lib/actions"
import { CollectionsClient } from "@/components/collections/collections-client"

export default async function CollectionsPage() {
  const collections = await getCollectionsAction()

  return <CollectionsClient collections={collections} />
}
