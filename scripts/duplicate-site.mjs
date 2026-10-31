#!/usr/bin/env node
/**
 * Copy this repo to a new folder and wire the same Supabase backend.
 * Usage: node scripts/duplicate-site.mjs ../my-new-bank-site
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const targetArg = process.argv[2]

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  '.git',
  '.vite',
  '.temp',
])

const SKIP_FILES = new Set(['.env.local'])

function shouldSkip(relPath) {
  const parts = relPath.split(path.sep)
  if (parts.some((p) => SKIP_DIRS.has(p))) return true
  const base = path.basename(relPath)
  if (SKIP_FILES.has(base)) return true
  return false
}

function copyTree(src, dest, rel = '') {
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const nextRel = rel ? `${rel}${path.sep}${entry.name}` : entry.name
    if (shouldSkip(nextRel)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true })
      copyTree(from, to, nextRel)
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to)
    }
  }
}

function readProjectRef() {
  const refFile = path.join(repoRoot, 'supabase', '.temp', 'project-ref')
  if (!fs.existsSync(refFile)) return null
  return fs.readFileSync(refFile, 'utf8').trim() || null
}

function printChecklist(targetDir, projectRef) {
  const lines = [
    '',
    '--- Duplicate site checklist (shared backend) ---',
    '',
    'Already done by this script:',
    `  • Copied source tree → ${targetDir}`,
    '  • Reused .env from source (same VITE_SUPABASE_* as original site)',
    '',
  ]
  if (projectRef) {
    lines.push(
      `Linked Supabase project ref: ${projectRef}`,
      `Auth URLs: https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`,
      '',
    )
  }
  lines.push(
    'You do NOT redo:',
    '  • Supabase database / migrations / RPCs',
    '  • Resend domain verification or API key (stays in Supabase secrets)',
    '  • Edge Function deploy (transactional-email) unless you changed email code',
    '',
    'One-time per NEW public URL (Supabase Dashboard → Authentication → URL Configuration):',
    '  • Add Site URL (or keep primary domain)',
    '  • Add Redirect URLs: https://YOUR-NEW-DOMAIN/** and http://localhost:5173/**',
    '',
    'Deploy the new frontend only:',
    `  cd "${targetDir}"`,
    '  npm install && npm run build',
    '  vercel link   # new Vercel project',
    '  vercel env add VITE_SUPABASE_URL production',
    '  vercel env add VITE_SUPABASE_ANON_KEY production',
    '  vercel --prod',
    '',
  )
  console.log(lines.join('\n'))
}

if (!targetArg) {
  console.error('Usage: node scripts/duplicate-site.mjs <target-directory>')
  process.exit(1)
}

const targetDir = path.resolve(process.cwd(), targetArg)
if (fs.existsSync(targetDir)) {
  console.error(`Target already exists: ${targetDir}`)
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })
copyTree(repoRoot, targetDir)

const sourceEnv = path.join(repoRoot, '.env')
const destEnv = path.join(targetDir, '.env')
if (fs.existsSync(sourceEnv)) {
  fs.copyFileSync(sourceEnv, destEnv)
  console.log('Copied .env (same Supabase keys as original).')
} else {
  fs.copyFileSync(path.join(repoRoot, 'shared-backend.env.example'), destEnv)
  console.log('No source .env — wrote template from shared-backend.env.example (fill in keys).')
}

printChecklist(targetDir, readProjectRef())
