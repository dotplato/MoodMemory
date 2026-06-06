"use client"

import { useState } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { CommandPalette } from "@/components/command-palette"
import { NavigationProgress } from "@/components/layout/navigation-progress"
import { ExtensionSyncProvider } from "@/components/providers/extension-sync-provider"
import { LibrarySearchProvider } from "@/components/providers/library-search-provider"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false)

  useKeyboardShortcut("k", () => setCommandOpen(true), { meta: true })

  return (
    <LibrarySearchProvider>
      <ExtensionSyncProvider>
        <div className="flex h-svh flex-col overflow-hidden bg-background">
          <NavigationProgress />
          <AppHeader onOpenCommand={() => setCommandOpen(true)} />
          <main className="relative flex-1 overflow-auto">{children}</main>
          <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
      </ExtensionSyncProvider>
    </LibrarySearchProvider>
  )
}
