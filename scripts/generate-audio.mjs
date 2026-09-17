import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(dirname(new URL(import.meta.url).pathname), '..')
const compiledDir = join(root, '.deploy', 'audio-data')
const tempDir = join(root, '.deploy', 'audio-temp')
const outputDir = join(root, 'public', 'audio')

mkdirSync(compiledDir, { recursive: true })
mkdirSync(tempDir, { recursive: true })
mkdirSync(outputDir, { recursive: true })

execFileSync(join(root, 'node_modules', '.bin', 'tsc'), [
  join(root, 'src', 'data', 'curriculum.ts'),
  join(root, 'src', 'types.ts'),
  '--ignoreConfig',
  '--outDir', compiledDir,
  '--module', 'ES2022',
  '--target', 'ES2022',
  '--moduleResolution', 'bundler',
  '--skipLibCheck',
  '--declaration', 'false',
  '--esModuleInterop',
], { stdio: 'inherit' })

const moduleUrl = pathToFileURL(join(compiledDir, 'data', 'curriculum.js')).href
const { WORDS } = await import(`${moduleUrl}?v=${Date.now()}`)
const variants = [
  ['word', (word) => word.english],
  ['phrase', (word) => word.phrase],
  ['sentence', (word) => word.sentence],
]

let generated = 0
let skipped = 0
for (const word of WORDS) {
  for (const [kind, getText] of variants) {
    const key = `${word.id}-${kind}`
    const output = join(outputDir, `${key}.mp3`)
    if (existsSync(output)) {
      skipped += 1
      continue
    }

    const source = join(tempDir, `${key}.aiff`)
    execFileSync('/usr/bin/say', ['-v', 'Samantha', '-r', '145', '-o', source, getText(word)])
    execFileSync('/opt/homebrew/bin/ffmpeg', [
      '-y', '-loglevel', 'error', '-i', source,
      '-codec:a', 'libmp3lame', '-b:a', '64k', '-ar', '44100', '-ac', '1', output,
    ])
    rmSync(source)
    generated += 1
    if (generated % 25 === 0) process.stdout.write(`Generated ${generated} audio files…\n`)
  }
}

rmSync(compiledDir, { recursive: true, force: true })
rmSync(tempDir, { recursive: true, force: true })
console.log(`Audio ready: ${generated} generated, ${skipped} already existed, ${WORDS.length} words.`)
