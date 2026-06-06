import {
  FolderOpenIcon,
  ImagesIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  variant: "images" | "collections" | "search"
  action?: React.ReactNode
}

const content = {
  images: {
    icon: ImagesIcon,
    title: "Your visual memory is empty",
    description:
      "Install the MoodMemory extension and save inspiring images from anywhere on the web with one click.",
  },
  collections: {
    icon: FolderOpenIcon,
    title: "No collections yet",
    description:
      "Create collections to organize your saved images by theme, project, or mood.",
  },
  search: {
    icon: MagnifyingGlassIcon,
    title: "No results found",
    description:
      "Try a different search term or browse your full library instead.",
  },
} as const

export function EmptyState({ variant, action }: EmptyStateProps) {
  const { icon: Icon, title, description } = content[variant]

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center border bg-muted/40">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-2 max-w-md text-xs text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function EmptyStateAction({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props}>{children}</Button>
  )
}
