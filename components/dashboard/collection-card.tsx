import Link from "next/link"
import { FolderIcon, ImagesIcon } from "@phosphor-icons/react/dist/ssr"
import type { Collection } from "@/lib/types/collection"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CollectionCardProps {
  collection: Collection
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.slug}`}>
      <Card className="transition-colors hover:border-foreground/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{collection.name}</CardTitle>
            <FolderIcon className="text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              <ImagesIcon />
              {collection.imageCount} images
            </Badge>
            {collection.description ? (
              <p className="line-clamp-1 text-[10px] text-muted-foreground">
                {collection.description}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
