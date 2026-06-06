import { mkdirSync, copyFileSync, writeFileSync } from "node:fs"
import { execSync } from "node:child_process"
import path from "node:path"

const root = path.resolve("extension")
const dist = path.join(root, "dist")
const src = path.join(root, "src")

mkdirSync(dist, { recursive: true })
mkdirSync(path.join(dist, "icons"), { recursive: true })

const entries = [
  ["background.ts", "background.js"],
  ["content.ts", "content.js"],
  ["popup.ts", "popup.js"],
]

for (const [input, output] of entries) {
  execSync(
    `npx esbuild ${path.join(src, input)} --bundle --format=esm --outfile=${path.join(dist, output)} --platform=browser`,
    { stdio: "inherit" }
  )
}

copyFileSync(path.join(root, "manifest.json"), path.join(dist, "manifest.json"))
copyFileSync(path.join(root, "popup.html"), path.join(dist, "popup.html"))
copyFileSync(path.join(root, "styles.css"), path.join(dist, "styles.css"))
copyFileSync(path.join(root, "popup.css"), path.join(dist, "popup.css"))

// Minimal 1x1 PNG placeholder (valid PNG bytes)
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
)

for (const size of [16, 48, 128]) {
  writeFileSync(path.join(dist, "icons", `icon${size}.png`), png)
}

console.log("Extension built to extension/dist")
