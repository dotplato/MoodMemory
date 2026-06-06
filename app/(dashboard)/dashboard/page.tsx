import { getCollectionsAction, getImagesAction } from "@/lib/actions"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const [imagesResult, collections] = await Promise.all([
    getImagesAction(undefined, undefined, 1, 48),
    getCollectionsAction(),
  ])

  return (
    <DashboardClient
      initialImages={imagesResult.images}
      initialTotal={imagesResult.total}
      collections={collections}
    />
  )
}
