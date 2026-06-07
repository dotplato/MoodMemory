"use client"

import { useEffect } from "react"
import { CheckCircleIcon } from "@phosphor-icons/react"

export default function ExtensionConnectPage() {
  useEffect(() => {
    async function connect() {
      const response = await fetch("/api/extension/token")
      if (!response.ok) return

      const data = (await response.json()) as { token: string }
      window.postMessage(
        { type: "MOODMEMORY_AUTH", token: data.token },
        window.location.origin
      )
    }

    void connect()
  }, [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center light">
      <CheckCircleIcon className="size-8" />
      <div>
        <h1 className="text-sm font-medium">Extension connected</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          You can close this tab and start saving images from anywhere on the web.
        </p>
      </div>
    </div>
  )
}
