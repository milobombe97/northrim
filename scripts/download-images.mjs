import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'revolut')

const assets = {
  heroPortrait:
    'https://assets.revolut.com/published-assets-v3/4bcf4f81-c0b1-4bde-82f5-0b4cd2ddd2ef/61f4df02-d372-4ced-86ef-cb50176593a7.png',
  heroSky:
    'https://assets.revolut.com/published-assets-v3/c1d9d317-7303-4f79-8756-937632237bb5/344c3cc7-0d4d-4749-8f12-b677d289a4a5.png',
  salary:
    'https://assets.revolut.com/published-assets-v3/d6d0bfe6-bc41-44db-8dde-dd3665b3c359/65411b9a-e95d-4c34-a38e-d3e4fa53fa8d.png',
  savings:
    'https://assets.revolut.com/published-assets-v3/1b17207f-8c44-4e67-9637-2ed365bfb5a1/8fb2616d-e499-4546-8288-9db34a2e881f.png',
  cards:
    'https://assets.revolut.com/published-assets-v3/af2fd3c8-cfef-40f0-a673-4a2c9fa85d69/f36ebe42-c594-470e-8e8f-3fd9af86a9a5.png',
  air:
    'https://assets.revolut.com/published-assets-v3/baf74063-c481-431d-85a0-9e5743572f28/91d20a70-1a2d-46e1-8f45-ebd7e83196a8.png',
  security:
    'https://assets.revolut.com/published-assets-v3/6ca566dc-8294-4e99-afbd-c51804cc5af4/2fb9c781-10a1-4bbf-bb42-7526bcc81286.png',
  invest:
    'https://assets.revolut.com/published-assets-v3/2309e107-7172-4cfc-a965-dc0d7acd4b72/dce27cc2-39ac-4f46-b887-46b8e1f5e976.png',
  badgeTrustpilot:
    'https://assets.revolut.com/published-assets-v3/2ad33298-6664-45ae-b325-8c3782fc0b5c/1bc89c99-4c81-4639-970a-51a8a20a5f5c.png',
  badgeDigitalBank:
    'https://assets.revolut.com/published-assets-v3/c5c49070-312c-4567-8359-6ffc1624cafa/931fbf11-937a-45d4-9c9d-7078412a8ba9.png',
  menuKids:
    'https://assets.revolut.com/published-assets-v3/dfa154ba-a21c-4dc1-b9a3-4ce83ccdb1ca/3829d1d5-8883-4351-a6a8-a960d419f04e.png',
  menuBusiness:
    'https://assets.revolut.com/published-assets-v3/f9f2192a-0076-4545-8e1e-83d852ea5130/264c79dd-e283-4f7d-9e60-a11079c7fc02.png',
}

fs.mkdirSync(root, { recursive: true })

for (const [name, url] of Object.entries(assets)) {
  const ext = path.extname(new URL(url).pathname) || '.png'
  const dest = path.join(root, `${name}${ext}`)
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Failed ${name}: ${res.status}`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  console.log(`Saved ${name} -> ${dest} (${buf.length} bytes)`)
}

const manifest = Object.fromEntries(
  Object.entries(assets).map(([name, url]) => {
    const ext = path.extname(new URL(url).pathname) || '.png'
    return [name, `/images/revolut/${name}${ext}`]
  }),
)
fs.writeFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'images.json'),
  JSON.stringify(manifest, null, 2),
)
console.log('Wrote src/data/images.json')
