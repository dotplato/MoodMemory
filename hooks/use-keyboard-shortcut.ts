"use client"

import { useEffect } from "react"

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { meta?: boolean; ctrl?: boolean }
) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const metaOrCtrl = options?.meta
        ? event.metaKey || event.ctrlKey
        : options?.ctrl
          ? event.ctrlKey
          : false

      if (!metaOrCtrl) return
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA")
      ) {
        return
      }

      event.preventDefault()
      callback()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [key, callback, options?.meta, options?.ctrl])
}
