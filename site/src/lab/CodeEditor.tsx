import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { basicSetup } from 'codemirror'
import { useEffect, useRef } from 'react'

// Colours come from CSS variables (see lab.css) so the editor follows the site theme.
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: 'var(--code-keyword)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--code-string)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--code-comment)', fontStyle: 'italic' },
  { tag: [t.number, t.bool, t.null], color: 'var(--code-number)' },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName))], color: 'var(--code-function)' },
  { tag: [t.className, t.typeName], color: 'var(--code-function)' },
  { tag: t.self, color: 'var(--code-keyword)' },
])

const theme = EditorView.theme({
  '&': { color: 'var(--text-primary)', backgroundColor: 'var(--code-bg)', fontSize: '13.5px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.55' },
  '.cm-content': { caretColor: 'var(--text-primary)', padding: '10px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text-primary)' },
  '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--text-muted)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'var(--code-active)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--code-active)', color: 'var(--text-secondary)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'var(--code-selection)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--code-selection)', outline: 'none' },
  '&.cm-focused': { outline: 'none' },
})

interface Props {
  value: string
  onChange?: (value: string) => void
  onSave?: () => void
  readOnly?: boolean
  label: string
}

export function CodeEditor({ value, onChange, onSave, readOnly = false, label }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const handlers = useRef({ onChange, onSave })
  useEffect(() => {
    handlers.current = { onChange, onSave }
  })

  // Create the editor once per file (the parent gives each file its own key).
  useEffect(() => {
    if (!host.current) return
    const instance = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          python(),
          indentUnit.of('    '),
          keymap.of([
            {
              key: 'Mod-s',
              run: () => {
                handlers.current.onSave?.()
                return true
              },
            },
            indentWithTab,
          ]),
          syntaxHighlighting(highlight),
          theme,
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) handlers.current.onChange?.(update.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = instance
    return () => {
      instance.destroy()
      view.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, label])

  // When the text is replaced from outside (reload, reset), put it in the editor.
  useEffect(() => {
    const instance = view.current
    if (!instance) return
    const current = instance.state.doc.toString()
    if (current !== value) instance.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [value])

  return <div className="code-editor" ref={host} />
}
