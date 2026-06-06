"use client"

import { useEffect, useState } from "react"
import { CheckCircleIcon, CopyIcon, PuzzlePieceIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/components/ui/sonner"

export default function SettingsPage() {
  const [token, setToken] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("/api/extension/token")
        if (!response.ok) return
        const data = (await response.json()) as { token: string }
        setToken(data.token)

        window.postMessage(
          {
            type: "MOODMEMORY_AUTH",
            token: data.token,
          },
          window.location.origin
        )
      } catch {
        // Extension connect is optional
      }
    }

    void fetchToken()
  }, [])

  async function copyToken() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    toast.success("Extension token copied")
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-lg font-medium">Extension</h1>
        <p className="text-xs text-muted-foreground">
          Connect the MoodMemory Chrome extension to save images from any website.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PuzzlePieceIcon />
            Chrome Extension
          </CardTitle>
          <CardDescription>
            Load the unpacked extension from the <code>extension/dist</code>{" "}
            folder after running the build script.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="flex list-decimal flex-col gap-2 pl-4 text-xs text-muted-foreground">
            <li>Run <code>npm run build:extension</code> in the project root.</li>
            <li>Open Chrome → Extensions → Developer mode.</li>
            <li>Click Load unpacked and select the <code>extension/dist</code> folder.</li>
            <li>Visit this page while signed in to connect automatically.</li>
          </ol>

          {token ? (
            <div className="flex flex-col gap-3 border p-4">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircleIcon className="text-primary" />
                Extension token ready
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void copyToken()}>
                  <CopyIcon data-icon="inline-start" />
                  Copy token
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.postMessage(
                      { type: "MOODMEMORY_AUTH", token },
                      window.location.origin
                    )
                    setConnected(true)
                    toast.success("Extension connected")
                  }}
                >
                  Send to extension
                </Button>
              </div>
              {connected ? (
                <p className="text-[10px] text-muted-foreground">
                  Token sent. Open the extension popup to confirm connection.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
