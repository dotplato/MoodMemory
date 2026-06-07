import Link from "next/link"
import { cn } from "@/lib/utils"

interface MoodMemoryLogoProps {
  href?: string
  className?: string
}

export function MoodMemoryLogo({ href, className }: MoodMemoryLogoProps) {
  const logos = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/m-logo.png"
        alt="MoodMemory"
        width={28}
        height={28}
        className="h-7 w-auto md:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/full-logo.png"
        alt="MoodMemory"
        width={180}
        height={32}
        className="hidden h-8 w-auto md:block"
      />
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn("inline-flex shrink-0 items-center", className)}
      >
        {logos}
      </Link>
    )
  }

  return (
    <div className={cn("inline-flex shrink-0 items-center", className)}>
      {logos}
    </div>
  )
}
