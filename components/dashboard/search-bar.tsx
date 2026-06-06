"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  loading?: boolean
  compact?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search images, tags, notes, collections...",
  loading = false,
  compact = false,
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full", !compact && "max-w-xl")}>
      {loading ? (
        <Spinner className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2" />
      ) : (
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "border-0 bg-transparent pl-8 shadow-none focus-visible:border-0 focus-visible:ring-0",
          compact ? "h-8 pr-3" : "pr-16"
        )}
      />
      {!compact ? (
        <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      ) : null}
    </div>
  )
}
