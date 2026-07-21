#!/usr/bin/env node
/**
 * Check relative markdown links in README.md and docs/
 * Usage: node scripts/check-md-links.mjs
 * Exit 1 if any broken file targets are found.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g

/** @param {string} dir */
function walkMarkdown(dir) {
  /** @type {string[]} */
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      out.push(...walkMarkdown(full))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

/**
 * @param {string} href
 * @returns {boolean}
 */
function shouldSkip(href) {
  const t = href.trim()
  if (!t) return true
  if (t.startsWith('#')) return true // same-file anchors — not validated
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return true // http, https, mailto, …
  if (t.startsWith('//')) return true
  return false
}

/**
 * @param {string} fromFile
 * @param {string} href
 */
function resolveTarget(fromFile, href) {
  const bare = href.trim().split(/[\s#?]/)[0]
  if (!bare) return null
  const decoded = decodeURIComponent(bare)
  return path.resolve(path.dirname(fromFile), decoded)
}

function main() {
  const files = [
    path.join(ROOT, 'README.md'),
    ...walkMarkdown(path.join(ROOT, 'docs')),
  ].filter((f) => fs.existsSync(f))

  /** @type {{ file: string, line: number, href: string, resolved: string }[]} */
  const broken = []
  let checked = 0

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const lines = text.split(/\r?\n/)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      LINK_RE.lastIndex = 0
      let m
      while ((m = LINK_RE.exec(line)) !== null) {
        const href = m[2].trim()
        // strip optional title: url "title"
        const hrefOnly = href.replace(/\s+".*"$/, '').trim()
        if (shouldSkip(hrefOnly)) continue

        checked++
        const resolved = resolveTarget(file, hrefOnly)
        if (!resolved) continue

        if (!fs.existsSync(resolved)) {
          broken.push({
            file: path.relative(ROOT, file).replace(/\\/g, '/'),
            line: i + 1,
            href: hrefOnly,
            resolved: path.relative(ROOT, resolved).replace(/\\/g, '/'),
          })
        }
      }
    }
  }

  console.log(`Checked ${checked} relative link(s) in ${files.length} markdown file(s).`)

  if (broken.length === 0) {
    console.log('OK — no broken file targets.')
    process.exit(0)
  }

  console.error(`\nBroken links: ${broken.length}\n`)
  for (const b of broken) {
    console.error(`  ${b.file}:${b.line}`)
    console.error(`    href:     ${b.href}`)
    console.error(`    resolved: ${b.resolved}`)
    console.error('')
  }
  process.exit(1)
}

main()
