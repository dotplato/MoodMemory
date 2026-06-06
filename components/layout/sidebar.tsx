"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FolderIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

const navItems = [
  { href: "/dashboard", label: "Library", icon: HouseIcon },
  { href: "/collections", label: "Collections", icon: FolderIcon },
  { href: "/settings", label: "Extension", icon: PuzzlePieceIcon },
]

interface SidebarProps {
  onOpenCommand?: () => void
}

export function Sidebar({ onOpenCommand }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
          <span className="text-xs font-medium">M</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">MoodMemory</p>
          <p className="truncate text-[10px] text-muted-foreground">
            Visual memory
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-2.5 py-2 text-xs transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onOpenCommand}
        >
          <MagnifyingGlassIcon data-icon="inline-start" />
          Search
          <span className="ml-auto flex items-center gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </Button>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Theme</span>
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  )
}
