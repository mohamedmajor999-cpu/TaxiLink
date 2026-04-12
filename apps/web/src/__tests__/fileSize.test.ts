/**
 * Garde-fou automatique : vérifie que chaque fichier source respecte
 * les seuils de lignes par type de répertoire.
 *
 * Ajouter un fichier dans EXCLUDED si c'est de l'auto-généré (ex: Supabase types).
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

// Seuils max par préfixe de chemin (relatif à src/)
const THRESHOLDS: [string, number][] = [
  ['components/', 200],
  ['app/',        200],
  ['hooks/',      150],
  ['services/',   150],
  ['lib/',        100],
  ['store/',      200],
  ['constants/',  100],
]

// Fichiers auto-générés ou légitimement volumineux — exclus du contrôle
const EXCLUDED = new Set([
  'lib/supabase/types.ts',
])

function collectFiles(dir: string, base = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) return collectFiles(join(dir, e.name), rel)
    return /\.tsx?$/.test(e.name) ? [rel] : []
  })
}

function lineCount(filePath: string): number {
  return readFileSync(filePath, 'utf8').split('\n').length
}

function maxLines(rel: string): number | null {
  for (const [prefix, max] of THRESHOLDS) {
    if (rel.startsWith(prefix)) return max
  }
  return null
}

const __filename = fileURLToPath(import.meta.url)
const SRC = join(dirname(__filename), '..')

const violations = collectFiles(SRC)
  .filter((f) => !EXCLUDED.has(f) && !f.startsWith('__tests__/'))
  .map((rel) => ({ rel, max: maxLines(rel), lines: lineCount(join(SRC, rel)) }))
  .filter(({ max, lines }) => max !== null && lines > max!)

describe('Seuils de taille de fichiers source', () => {
  it('aucun fichier ne dépasse son seuil de lignes', () => {
    if (violations.length === 0) return

    const report = violations
      .map(({ rel, lines, max }) => `  ${rel}: ${lines} lignes (max ${max})`)
      .join('\n')

    expect.fail(`${violations.length} fichier(s) dépassent leur seuil :\n${report}`)
  })
})
