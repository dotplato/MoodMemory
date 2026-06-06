import { notFound } from "next/navigation"
import { getImageAction } from "@/lib/actions"
import { ImageDetail } from "@/components/image/image-detail"

export default async function ImagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const image = await getImageAction(id)

  if (!image) {
    notFound()
  }

  return <ImageDetail image={image} />
}
