"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  FolderIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PuzzlePieceIcon,
  SignOutIcon,
  SunIcon,
} from "@phosphor-icons/react"
import { MoodMemoryLogo } from "@/components/brand/moodmemory-logo"
import { cn } from "@/lib/utils"
import { useLibrarySearch } from "@/components/providers/library-search-provider"
import { SearchBar } from "@/components/dashboard/search-bar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/dashboard", label: "Library", icon: HouseIcon },
  { href: "/collections", label: "Collections", icon: FolderIcon },
]

interface AppHeaderProps {
  onOpenCommand?: () => void
}

export function AppHeader({ onOpenCommand }: AppHeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const { query, setQuery, loading } = useLibrarySearch()

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "MM"

  const isDark = resolvedTheme === "dark"

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-4 border-b px-4 md:px-6">
      <nav className="flex min-w-0 items-center gap-1 md:gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 text-xs transition-colors md:px-2.5",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <MoodMemoryLogo
        href="/dashboard"
        className="absolute left-1/2 -translate-x-1/2"
      />

      <div className="ml-auto flex min-w-0 items-center gap-2">
        <div className="hidden w-44 md:block lg:w-56 xl:w-64">
          <SearchBar
            value={query}
            onChange={setQuery}
            loading={loading}
            placeholder="Search..."
            compact
          />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenCommand}
          aria-label="Search"
        >
          <MagnifyingGlassIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/settings" aria-label="Extension settings" />}
        >
          <PuzzlePieceIcon />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Account menu">
                <Avatar className="size-7">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuItem disabled>
              {session?.user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
              {isDark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <SignOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
