import fs from 'node:fs'
import path from 'node:path'

const htmlPath = process.argv[2]
const html = fs.readFileSync(htmlPath, 'utf8')
const found = new Set()

for (const re of [
  /https:\/\/assets\.revolut\.com[^"'\\]+/g,
  /\/website\/images\/[^"'\\]+/g,
  /"src":"(https:[^"]+)"/g,
  /"url":"(https:[^"]+\.(webp|png|jpg))"/gi,
]) {
  for (const m of html.matchAll(re)) {
    found.add(m[1] ?? m[0])
  }
}

const list = [...found]
console.log(list.join('\n'))
console.error(`Total ${list.length}`)
