"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { CommandPalette } from "@/components/command-palette"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false)

  useKeyboardShortcut("k", () => setCommandOpen(true), { meta: true })

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar onOpenCommand={() => setCommandOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
