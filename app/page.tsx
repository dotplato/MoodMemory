import Link from "next/link"
import { auth } from "@/lib/auth"
import { MoodMemoryLogo } from "@/components/brand/moodmemory-logo"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: "/icons/save-one-click.png",
    label: "Save anything in One Click",
  },
  {
    icon: "/icons/keep-in-drive.png",
    label: "Keep everything in Google Drive",
  },
  {
    icon: "/icons/search-organize.png",
    label: "Search and organize anywhere",
  },
] as const

export default async function HomePage() {
  const session = await auth()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="grid grid-cols-3 items-center px-6 py-6 md:px-10">
        <div aria-hidden="true" />
        <div className="flex justify-center">
          <MoodMemoryLogo href="/" />
        </div>
        <div className="flex justify-end">
          <Button
            variant="ghost"
            render={<Link href={session ? "/dashboard" : "/login"} />}
          >
            {session ? "Open library" : "Get started"}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center md:px-10">
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold md:text-5xl lg:text-7xl">
            Every Inspiration now becomes a memory
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Save any inspiration you find across the internet on your mood board
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/login" />}>
              Start with Google
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/login?callbackUrl=/settings" />}
            >
              Install Extension
            </Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-12 px-6 pb-16 md:grid-cols-3 md:gap-8 md:px-10">
          {features.map((feature) => (
            <article
              key={feature.label}
              className="flex flex-col items-center gap-4 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.icon}
                alt=""
                width={120}
                height={120}
                className="h-24 w-auto object-contain md:h-28"
              />
              <p className="max-w-[180px] text-md leading-snug text-muted-foreground">
                {feature.label}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
