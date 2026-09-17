import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(dirname(new URL(import.meta.url).pathname), '..')
const compiledDir = join(root, '.deploy', 'audio-data')
const tempDir = join(root, '.deploy', 'audio-temp')
const outputDir = join(root, 'public', 'audio')
const force = process.argv.includes('--force')
const voiceArgument = process.argv.find((argument) => argument.startsWith('--voice='))
const voice = voiceArgument?.split('=')[1] || 'Samantha'
const leadingSilenceMs = 140
const trailingSilenceSeconds = 0.28

const variants = [
  { kind: 'word', rate: 128, text: (word) => `${word.english}.` },
  { kind: 'phrase', rate: 135, text: (word) => `${word.phrase}.` },
  { kind: 'sentence', rate: 138, text: (word) => word.sentence },
]

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

let generated = 0
let skipped = 0
try {
  for (const word of WORDS) {
    for (const variant of variants) {
      const key = `${word.id}-${variant.kind}`
      const output = join(outputDir, `${key}.mp3`)
      if (!force && existsSync(output)) {
        skipped += 1
        continue
      }

      const source = join(tempDir, `${key}.aiff`)
      const encoded = join(tempDir, `${key}.mp3`)
      execFileSync('/usr/bin/say', ['-v', voice, '-r', String(variant.rate), '-o', source, variant.text(word)])
      execFileSync('/opt/homebrew/bin/ffmpeg', [
        '-y', '-loglevel', 'error', '-i', source,
        '-af', `highpass=f=70,lowpass=f=10000,loudnorm=I=-17:TP=-2:LRA=7,adelay=${leadingSilenceMs},apad=pad_dur=${trailingSilenceSeconds},asetpts=N/SR/TB`,
        '-codec:a', 'libmp3lame', '-b:a', '64k', '-ar', '44100', '-ac', '1',
        '-metadata', `title=${word.english} — ${variant.kind}`,
        '-metadata', `artist=Vườn Từ Vựng (${voice})`,
        encoded,
      ])
      renameSync(encoded, output)
      rmSync(source, { force: true })
      generated += 1
      if (generated % 25 === 0) process.stdout.write(`Generated ${generated} audio files…\n`)
    }
  }

  writeFileSync(join(outputDir, 'manifest.json'), `${JSON.stringify({
    version: 2,
    generatedAt: new Date().toISOString(),
    voice,
    locale: 'en-US',
    files: WORDS.length * variants.length,
    words: WORDS.length,
    processing: {
      rates: Object.fromEntries(variants.map(({ kind, rate }) => [kind, rate])),
      leadingSilenceMs,
      trailingSilenceMs: trailingSilenceSeconds * 1000,
      loudness: '-17 LUFS',
      truePeak: '-2 dBTP',
      sampleRate: 44100,
      channels: 1,
      bitrate: '64k',
    },
  }, null, 2)}\n`)
} finally {
  rmSync(compiledDir, { recursive: true, force: true })
  rmSync(tempDir, { recursive: true, force: true })
}

console.log(`Audio ready: ${generated} generated, ${skipped} already existed, ${WORDS.length} words, voice ${voice}.`)
