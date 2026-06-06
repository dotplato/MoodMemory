"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target === "_blank") return
      if (anchor.origin !== window.location.origin) return
      if (anchor.pathname === pathname) return

      timers.current.forEach((timer) => window.clearTimeout(timer))
      timers.current = []
      setVisible(true)
      setProgress(14)
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [pathname])

  useEffect(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []

    if (!visible && progress === 0) {
      return
    }

    setVisible(true)
    setProgress((current) => (current > 0 ? current : 18))

    timers.current.push(
      window.setTimeout(() => setProgress(46), 100),
      window.setTimeout(() => setProgress(72), 260),
      window.setTimeout(() => setProgress(92), 480),
      window.setTimeout(() => setProgress(100), 700),
      window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 920)
    )

    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      timers.current = []
    }
  }, [pathname])

  if (!visible) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
      <div
        className={cn(
          "h-full bg-primary transition-[width] duration-300 ease-out",
          progress >= 100 && "opacity-0 transition-opacity duration-200"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
