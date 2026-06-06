export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function uniqueSlug(base: string, existing: string[]): string {
  const slug = slugify(base) || "collection"
  if (!existing.includes(slug)) return slug

  let counter = 2
  while (existing.includes(`${slug}-${counter}`)) {
    counter++
  }
  return `${slug}-${counter}`
}
