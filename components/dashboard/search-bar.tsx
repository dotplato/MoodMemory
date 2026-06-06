"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search images, tags, notes, collections...",
}: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-16"
      />
      <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-0.5">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </div>
    </div>
  )
}
