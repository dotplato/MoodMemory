"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

interface LibrarySearchContextValue {
  query: string
  setQuery: (query: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

const LibrarySearchContext = createContext<LibrarySearchContextValue | null>(
  null
)

export function LibrarySearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const value = useMemo(
    () => ({ query, setQuery, loading, setLoading }),
    [query, loading]
  )

  return (
    <LibrarySearchContext.Provider value={value}>
      {children}
    </LibrarySearchContext.Provider>
  )
}

export function useLibrarySearch() {
  const context = useContext(LibrarySearchContext)
  if (!context) {
    throw new Error("useLibrarySearch must be used within LibrarySearchProvider")
  }
  return context
}
