import fs from 'node:fs'
import path from 'node:path'

const htmlPath = process.argv[2] || path.join(process.env.TEMP || '/tmp', 'revolut-home.html')
const html = fs.readFileSync(htmlPath, 'utf8')
const urls = [
  ...html.matchAll(/https?:\/\/[^"'\\s)>]+/g),
].map((m) => m[0].replace(/\\u002F/g, '/'))

const images = [...new Set(urls)].filter(
  (u) =>
    /\.(webp|png|jpe?g|svg)(\?|$)/i.test(u) ||
    u.includes('assets.revolut.com') ||
    u.includes('/website/images/'),
)

console.log(images.slice(0, 80).join('\n'))
console.error(`\nTotal: ${images.length}`)
