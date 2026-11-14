import { useCallback, useEffect, useRef, useState } from 'react'
import { labBridge } from 'virtual:lab-bridge'
import { CodeEditor } from './CodeEditor'
import './lab.css'

interface Manifest {
  title: string
  edit: string
  readonly: string[]
  steps?: { function: string; hint: string }[]
}

interface TestResult {
  name: string
  outcome: 'passed' | 'failed' | 'skipped'
  message: string
}

interface RunResult {
  kind: 'tests' | 'script'
  exitCode: number | null
  output: string
  timedOut: boolean
  durationMs: number
  tests: TestResult[]
}

type Load =
  | { state: 'loading' }
  | { state: 'unavailable'; reason: string }
  | { state: 'ready'; manifest: Manifest; files: Record<string, string>; folder: string }

async function call<T>(week: string, action: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/__lab/${week}${action ? `/${action}` : ''}`, {
    ...init,
    headers: { 'x-lab-token': labBridge.token, 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`)
  return body
}

/** "test_q_from_v_one_step[kwargs0-3]" -> "q from v one step (case 1)" */
function readableName(name: string): string {
  const match = /^test_(.*?)(?:\[(.*)\])?$/.exec(name)
  if (!match) return name
  const base = match[1].replace(/_/g, ' ')
  const param = match[2] ? / *kwargs(\d+)/.exec(match[2]) : null
  return param ? `${base} (case ${Number(param[1]) + 1})` : match[2] ? `${base} (${match[2]})` : base
}

function readableMessage(t: TestResult): string {
  if (t.outcome === 'passed') return ''
  if (/^NotImplementedError/.test(t.message)) return 'Not implemented yet.'
  const lines = t.message.split('\n').filter((line) => line.trim() !== '')
  // A syntax or import error starts with a file location; its last line names the problem.
  return /^\s*File "/.test(lines[0] ?? '') ? lines[lines.length - 1] : (lines[0] ?? '')
}

export function LabRunner({ week }: { week: string }) {
  const [load, setLoad] = useState<Load>(
    labBridge.available ? { state: 'loading' } : { state: 'unavailable', reason: 'hosted' },
  )
  const [code, setCode] = useState('')
  const [saved, setSaved] = useState('')
  const [tab, setTab] = useState('')
  const [solution, setSolution] = useState<string | null>(null)
  const [running, setRunning] = useState<null | 'tests' | 'script'>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [notice, setNotice] = useState('')
  const dirty = code !== saved
  const state = useRef({ code, saved })
  useEffect(() => {
    state.current = { code, saved }
  })

  const fetchLab = useCallback(async () => {
    if (!labBridge.available) return
    try {
      const data = await call<{ manifest: Manifest; files: Record<string, string>; folder: string }>(week, '')
      setLoad({ state: 'ready', ...data })
      setTab((current) => current || data.manifest.edit)
      // Pick up edits made in another editor, unless there are unsaved changes here.
      if (state.current.code === state.current.saved) {
        setCode(data.files[data.manifest.edit])
        setSaved(data.files[data.manifest.edit])
      }
    } catch (err) {
      setLoad({ state: 'unavailable', reason: err instanceof Error ? err.message : String(err) })
    }
  }, [week])

  useEffect(() => {
    // Loading the files from disk is the external sync this effect exists for.
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchLab()
    const onFocus = () => void fetchLab()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchLab])

  const save = useCallback(async () => {
    const content = state.current.code
    if (content === state.current.saved) return true
    try {
      await call(week, 'file', { method: 'PUT', body: JSON.stringify({ content }) })
      setSaved(content)
      setNotice('Saved.')
      return true
    } catch (err) {
      setNotice(`Could not save: ${err instanceof Error ? err.message : String(err)}`)
      return false
    }
  }, [week])

  const run = async (kind: 'tests' | 'script') => {
    setRunning(kind)
    setNotice('')
    try {
      if (await save()) setResult(await call<RunResult>(week, 'run', { method: 'POST', body: JSON.stringify({ kind }) }))
    } catch (err) {
      setNotice(`Could not run: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setRunning(null)
    }
  }

  const reset = async () => {
    if (!window.confirm('Replace lab.py with the empty starter version? Your current code in this file will be lost.')) return
    try {
      const { content } = await call<{ content: string }>(week, 'reset', { method: 'POST' })
      setCode(content)
      setSaved(content)
      setResult(null)
      setNotice('Reset to the starter file.')
    } catch (err) {
      setNotice(`Could not reset: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const showSolution = async () => {
    if (solution === null) {
      if (!window.confirm('Show the reference solution? It is worth getting the tests to pass on your own first.')) return
      try {
        setSolution((await call<{ content: string }>(week, 'solution')).content)
      } catch (err) {
        setNotice(`Could not load the solution: ${err instanceof Error ? err.message : String(err)}`)
        return
      }
    }
    setTab('solution')
  }

  if (load.state === 'loading') return <div className="lab lab-empty">Loading the lab…</div>

  if (load.state === 'unavailable') {
    return (
      <div className="lab lab-empty">
        <strong>The in-page lab needs the site to be running on your machine.</strong>
        <p>
          Start it with <code>npm --prefix site run dev</code>, or work in the folder <code>labs/{week}</code>{' '}
          directly and run <code>python -m pytest</code> there.
        </p>
        {load.reason !== 'hosted' && <p className="dim small">Details: {load.reason}</p>}
      </div>
    )
  }

  const { manifest, files, folder } = load
  const tabs = [manifest.edit, ...manifest.readonly, ...(solution !== null ? ['solution'] : [])]
  const passed = result?.tests.filter((t) => t.outcome === 'passed').length ?? 0
  const total = result?.tests.length ?? 0

  return (
    <div className="lab">
      <header className="lab-head">
        <span className="playground-tag">Lab</span>
        <h3 className="playground-title">{manifest.title}</h3>
        <span className="lab-folder">
          {folder}/{manifest.edit}
        </span>
      </header>

      {manifest.steps && (
        <ol className="lab-steps">
          {manifest.steps.map((s) => (
            <li key={s.function}>
              <code>{s.function}</code>
              <span>{s.hint}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="lab-tabs" role="tablist" aria-label="Lab files">
        {tabs.map((name) => (
          <button
            type="button"
            role="tab"
            key={name}
            aria-selected={tab === name}
            className={`lab-tab ${tab === name ? 'is-active' : ''}`}
            onClick={() => setTab(name)}
          >
            {name === 'solution' ? 'solution.py' : name}
            {name === manifest.edit ? (dirty ? ' •' : '') : <span className="lab-tab-note">read-only</span>}
          </button>
        ))}
      </div>

      {tab === manifest.edit ? (
        <CodeEditor key="edit" label="Your lab code" value={code} onChange={setCode} onSave={() => void save()} />
      ) : (
        <CodeEditor key={tab} label={`${tab}, read-only`} value={tab === 'solution' ? (solution ?? '') : files[tab]} readOnly />
      )}

      <div className="lab-actions">
        <button type="button" className="btn btn-primary" onClick={() => void run('tests')} disabled={running !== null}>
          {running === 'tests' ? 'Running tests…' : 'Run tests'}
        </button>
        <button type="button" className="btn" onClick={() => void run('script')} disabled={running !== null}>
          {running === 'script' ? 'Running…' : `Run ${manifest.edit}`}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => void save()} disabled={!dirty}>
          {dirty ? 'Save (Ctrl+S)' : 'Saved'}
        </button>
        <span className="lab-spacer" />
        <button type="button" className="btn btn-quiet" onClick={() => void showSolution()}>
          {solution === null ? 'Show solution' : 'View solution'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => void reset()}>
          Reset to starter
        </button>
      </div>

      {notice && (
        <p className="lab-notice" role="status">
          {notice}
        </p>
      )}

      {result && (
        <section className="lab-result" aria-live="polite">
          {result.kind === 'tests' ? (
            <>
              <div className={`lab-summary ${total > 0 && passed === total ? 'is-pass' : 'is-fail'}`}>
                {result.timedOut
                  ? 'The run was stopped after two minutes.'
                  : total === 0
                    ? 'The tests could not start. See the output below.'
                    : passed === total
                      ? `✓ All ${total} tests pass.`
                      : `${passed} of ${total} tests pass.`}
                <span className="dim"> {(result.durationMs / 1000).toFixed(1)} s</span>
              </div>
              <ul className="lab-tests">
                {result.tests.map((t) => (
                  <li key={t.name} className={`is-${t.outcome}`}>
                    <span className="lab-test-mark" aria-hidden="true">
                      {t.outcome === 'passed' ? '✓' : t.outcome === 'failed' ? '✕' : '–'}
                    </span>
                    <span className="lab-test-name">
                      {readableName(t.name)}
                      <span className="lab-test-outcome"> {t.outcome}</span>
                    </span>
                    {t.outcome !== 'passed' && <span className="lab-test-message">{readableMessage(t)}</span>}
                  </li>
                ))}
              </ul>
              <details className="lab-output" open={total === 0}>
                <summary>Full pytest output</summary>
                <pre>{result.output || '(no output)'}</pre>
              </details>
            </>
          ) : (
            <>
              <div className={`lab-summary ${result.exitCode === 0 ? 'is-pass' : 'is-fail'}`}>
                {result.exitCode === 0 ? `✓ ${manifest.edit} ran.` : `${manifest.edit} stopped with an error.`}
                <span className="dim"> {(result.durationMs / 1000).toFixed(1)} s</span>
              </div>
              <pre className="lab-stdout">{result.output || '(no output)'}</pre>
            </>
          )}
        </section>
      )}
    </div>
  )
}
