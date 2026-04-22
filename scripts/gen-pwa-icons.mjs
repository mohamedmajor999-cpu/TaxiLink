import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SVG_PATH = resolve(ROOT, 'apps/web/public/brand/icon.svg')
const OUT_DIR = resolve(ROOT, 'apps/web/public/icons')

const TARGETS = [
  { name: 'icon-192.png', size: 192, bg: '#FFFFFF', padding: 0.12 },
  { name: 'icon-512.png', size: 512, bg: '#FFFFFF', padding: 0.12 },
  { name: 'apple-touch-icon.png', size: 180, bg: '#FFFFFF', padding: 0.12 },
]

const pinSvg = await readFile(SVG_PATH, 'utf8')
const bodyMatch = pinSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
if (!bodyMatch) throw new Error('SVG body not found')
const body = bodyMatch[1]

for (const { name, size, bg, padding } of TARGETS) {
  const pad = Math.round(120 * padding)
  const inner = 120 - pad * 2
  const scale = inner / 120
  const ty = (160 - 160 * scale) / 2
  const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet">
  <rect width="120" height="160" fill="${bg}"/>
  <g transform="translate(${pad}, ${ty}) scale(${scale})">${body}</g>
</svg>`
  const png = new Resvg(wrapped, { fitTo: { mode: 'width', value: size } }).render().asPng()
  await writeFile(resolve(OUT_DIR, name), png)
  console.log(`wrote ${name} (${size}x${size})`)
}
