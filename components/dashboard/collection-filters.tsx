"use client"

import { cn } from "@/lib/utils"

interface CollectionFiltersProps {
  collections: Array<{ id: string; name: string }>
  selected: string | null
  onSelect: (collection: string | null) => void
}

export function CollectionFilters({
  collections,
  selected,
  onSelect,
}: CollectionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-5 pb-1">
      <FilterTab active={selected === null} onClick={() => onSelect(null)}>
        All
      </FilterTab>
      {collections.map((collection) => (
        <FilterTab
          key={collection.id}
          active={selected === collection.name}
          onClick={() => onSelect(collection.name)}
        >
          {collection.name}
        </FilterTab>
      ))}
    </div>
  )
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-xs transition-colors",
        active
          ? "text-foreground underline decoration-foreground underline-offset-4"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
