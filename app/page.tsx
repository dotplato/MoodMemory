import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const session = await auth()

  return (
    <div className="min-h-svh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
            <span className="text-sm font-medium">M</span>
          </div>
          <span className="text-sm font-medium">MoodMemory</span>
        </div>
        <Button render={<Link href={session ? "/dashboard" : "/login"} />}>
          {session ? "Open library" : "Get started"}
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <section className="max-w-3xl">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Personal inspiration library
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium md:text-6xl">
            Every image that inspires you becomes part of your creative memory.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            MoodMemory lets you save images from anywhere on the web with one
            click, store them in your own Google Drive, and browse a beautiful,
            searchable visual library.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/login" />}>
              Start with Google
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login?callbackUrl=/settings" />}>
              Install extension
            </Button>
          </div>
        </section>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Save in one click",
              description:
                "Hover any image on the web and save it instantly with the MoodMemory extension.",
            },
            {
              title: "Your Google Drive",
              description:
                "All images and metadata live in your own Drive. No external database required.",
            },
            {
              title: "Search & organize",
              description:
                "Browse a Pinterest-style grid, create collections, and search across tags and notes.",
            },
          ].map((feature) => (
            <article key={feature.title} className="border p-5">
              <h2 className="text-sm font-medium">{feature.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
