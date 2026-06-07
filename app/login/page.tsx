"use client"

import { signIn } from "next-auth/react"
import { GoogleLogoIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6 light">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to MoodMemory</CardTitle>
          <CardDescription>
            Connect your Google account to save and organize inspiring images in
            your own Google Drive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <GoogleLogoIcon data-icon="inline-start" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
