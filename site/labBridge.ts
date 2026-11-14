// Lets the site, while it runs on your own machine, read and save the lab files
// in ../labs and run their tests with your Python.
//
// Safety: this is only active in `npm run dev`. It only touches the files a
// lab's lab.json lists, only runs pytest or the lab file in that lab's folder,
// and refuses any request that does not carry this server's token, that does
// not come over a loopback connection, or that was made by a non-local page.

import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const LABS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'labs')
const PREFIX = '/__lab/'
const VIRTUAL_ID = 'virtual:lab-bridge'
const RUN_TIMEOUT_MS = 120_000
const MAX_BODY = 1_000_000
const MAX_OUTPUT = 200_000
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

interface Manifest {
  title: string
  edit: string
  starter: string
  readonly: string[]
  solution: string
  steps?: { function: string; hint: string }[]
}

function findPython(): string {
  if (process.env.LAB_PYTHON) return process.env.LAB_PYTHON
  const venv = path.join(LABS_DIR, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
  return existsSync(venv) ? venv : 'python'
}

async function loadManifest(week: string): Promise<{ dir: string; manifest: Manifest }> {
  const dir = path.join(LABS_DIR, week)
  const manifest = JSON.parse(await readFile(path.join(dir, 'lab.json'), 'utf8')) as Manifest
  return { dir, manifest }
}

/** Resolve a manifest-listed file, refusing anything that leaves the lab folder. */
function inside(dir: string, relative: string): string {
  const full = path.resolve(dir, relative)
  if (!full.startsWith(dir + path.sep)) throw new Error('path escapes the lab folder')
  return full
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('request too large'))
        req.destroy()
      } else chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

interface RunResult {
  exitCode: number | null
  output: string
  timedOut: boolean
  durationMs: number
}

function run(python: string, args: string[], cwd: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const started = Date.now()
    let output = ''
    let timedOut = false
    const child = spawn(python, args, {
      cwd,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
      windowsHide: true,
    })
    const collect = (chunk: Buffer) => {
      if (output.length < MAX_OUTPUT) output += chunk.toString('utf8')
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, RUN_TIMEOUT_MS)
    const finish = (exitCode: number | null) => {
      clearTimeout(timer)
      resolve({ exitCode, output: output.slice(0, MAX_OUTPUT), timedOut, durationMs: Date.now() - started })
    }
    child.on('error', (err) => {
      output += `Could not start Python (${python}): ${err.message}\n`
      finish(null)
    })
    child.on('close', finish)
  })
}

export function labBridge(): Plugin {
  const token = randomBytes(24).toString('hex')
  let serving = false
  let busy = false

  const send = (res: ServerResponse, status: number, body: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(body))
  }

  async function handle(req: IncomingMessage, res: ServerResponse, rest: string) {
    // Three independent checks that the request comes from a page on this machine:
    // the connection itself is loopback (this holds even if the dev server was
    // started with --host and is reachable from the network), the address the
    // browser used is local (defeats DNS rebinding), and, when the browser says
    // which page is asking, that page is local too.
    const notLocal = () => send(res, 403, { error: 'The lab bridge only answers on this machine.' })
    if (!LOOPBACK.has(req.socket.remoteAddress ?? '')) return notLocal()
    const host = (req.headers.host ?? '').replace(/:\d+$/, '')
    if (!LOCAL_HOSTS.has(host)) return notLocal()
    const origin = req.headers.origin
    if (origin) {
      let originHost = ''
      try {
        originHost = new URL(origin).hostname
      } catch {
        /* not a URL: treated as non-local below */
      }
      if (!LOCAL_HOSTS.has(originHost)) return notLocal()
    }
    if (req.headers['x-lab-token'] !== token) return send(res, 403, { error: 'Missing or wrong lab token.' })

    const [week, action = ''] = rest.split('?')[0].split('/')
    if (!/^week\d{2}$/.test(week)) return send(res, 404, { error: 'Unknown lab.' })

    let dir: string
    let manifest: Manifest
    try {
      ;({ dir, manifest } = await loadManifest(week))
    } catch {
      return send(res, 404, { error: `No lab found at labs/${week}.` })
    }
    const editPath = inside(dir, manifest.edit)
    const python = findPython()

    if (req.method === 'GET' && action === '') {
      const files: Record<string, string> = {}
      for (const name of [manifest.edit, ...manifest.readonly]) files[name] = await readFile(inside(dir, name), 'utf8')
      return send(res, 200, { manifest, files, folder: `labs/${week}` })
    }

    if (req.method === 'GET' && action === 'solution') {
      return send(res, 200, { content: await readFile(inside(dir, manifest.solution), 'utf8') })
    }

    if (req.method === 'PUT' && action === 'file') {
      const { content } = JSON.parse(await readBody(req)) as { content?: unknown }
      if (typeof content !== 'string') return send(res, 400, { error: 'Expected { content: string }.' })
      await writeFile(editPath, content, 'utf8')
      return send(res, 200, { saved: true })
    }

    if (req.method === 'POST' && action === 'reset') {
      await copyFile(inside(dir, manifest.starter), editPath)
      return send(res, 200, { content: await readFile(editPath, 'utf8') })
    }

    if (req.method === 'POST' && action === 'run') {
      const { kind } = JSON.parse((await readBody(req)) || '{}') as { kind?: string }
      if (busy) return send(res, 409, { error: 'A run is already in progress.' })
      busy = true
      try {
        if (kind === 'script') {
          return send(res, 200, { kind, ...(await run(python, [manifest.edit], dir)), tests: [] })
        }
        const reportDir = await mkdtemp(path.join(tmpdir(), 'lab-report-'))
        const reportPath = path.join(reportDir, 'report.json')
        const module = manifest.edit.replace(/\.py$/, '')
        const result = await run(python, ['-m', 'pytest', '-q', '--tb=short', '--impl', module, '--lab-report', reportPath], dir)
        let tests: unknown[] = []
        try {
          tests = JSON.parse(await readFile(reportPath, 'utf8')) as unknown[]
        } catch {
          /* pytest did not get far enough to write a report */
        }
        await rm(reportDir, { recursive: true, force: true })
        return send(res, 200, { kind: 'tests', ...result, tests })
      } finally {
        busy = false
      }
    }

    return send(res, 404, { error: 'Unknown lab request.' })
  }

  return {
    name: 'lab-bridge',
    configResolved(config) {
      serving = config.command === 'serve' && !config.isProduction
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? '\0' + VIRTUAL_ID : undefined
    },
    load(id) {
      if (id !== '\0' + VIRTUAL_ID) return undefined
      // A built copy of the site has no bridge: the page then shows the lab read-only.
      return `export const labBridge = ${JSON.stringify(serving ? { available: true, token } : { available: false, token: '' })}`
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(PREFIX)) return next()
        handle(req, res, req.url.slice(PREFIX.length)).catch((err: unknown) =>
          send(res, 500, { error: err instanceof Error ? err.message : String(err) }),
        )
      })
    },
  }
}
