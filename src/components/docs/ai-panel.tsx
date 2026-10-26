'use client'

import { useEffect, useState } from 'react'
import { Copy, RefreshCw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { countWords } from '@/lib/docs'

type AiAction = 'continue' | 'improve' | 'summarize' | 'title'

const ACTIONS: { id: AiAction; label: string; hint: string }[] = [
  { id: 'continue', label: 'Continue writing', hint: 'Pick up where the document ends' },
  { id: 'improve', label: 'Improve writing', hint: 'Rewrite the selection (or whole doc) for clarity' },
  { id: 'summarize', label: 'Summarize', hint: 'Bullet-point summary appended to the doc' },
  { id: 'title', label: 'Suggest title', hint: 'A short title based on the content' },
]

type Props = {
  open: boolean
  docId: string
  docTitle: string
  getContext: () => { selection: string; whole: string }
  onInsert: (text: string, mode: 'replace-or-insert' | 'append') => void
  onApplyTitle: (title: string) => void
  onClose: () => void
}

export function AiPanel({ open, docId, docTitle, getContext, onInsert, onApplyTitle, onClose }: Props) {
  const [action, setAction] = useState<AiAction | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [contextLabel, setContextLabel] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (!open) {
      setAction(null)
      setLoading(false)
      setResult('')
      setError('')
      setContextLabel('')
    }
  }, [open])

  if (!open) return null

  const run = async (chosen: AiAction) => {
    const { selection, whole } = getContext()
    const text = chosen === 'improve' && selection.trim().length > 0 ? selection : whole
    if (text.trim().length === 0) {
      setError('The document is empty — write something first, then use AI Assist.')
      setResult('')
      setAction(chosen)
      return
    }
    setAction(chosen)
    setLoading(true)
    setError('')
    setResult('')
    setContextLabel(
      chosen === 'improve' && selection.trim().length > 0
        ? `Selection · ${countWords(selection)} words`
        : `Whole document · ${countWords(whole)} words`
    )
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, action: chosen, context: text, title: docTitle }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data?.error ?? 'AI request failed. Please try again.'))
      } else {
        setResult(String(data?.result ?? ''))
      }
    } catch {
      setError('Network error — could not reach the AI service.')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result)
      toast({ title: 'Copied to clipboard' })
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' })
    }
  }

  const current = ACTIONS.find((a) => a.id === action)

  return (
    <aside
      className="fixed z-50 inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:top-[104px] sm:bottom-4 sm:w-[400px] rounded-xl border border-[#dadce0] bg-white shadow-[0_4px_24px_rgba(60,64,67,0.25)] flex flex-col"
      aria-label="AI Assist panel"
    >
      <div className="h-12 flex items-center gap-2 px-4 border-b border-[#e8eaed] shrink-0">
        <Sparkles className="h-4 w-4 text-[#1a73e8]" />
        <span className="font-medium text-[15px]">AI Assist</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="ml-auto h-8 w-8 rounded-full text-[#444746]"
          aria-label="Close AI Assist"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 flex flex-wrap gap-1.5 border-b border-[#e8eaed] shrink-0">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => run(a.id)}
            disabled={loading}
            title={a.hint}
            className={`h-8 px-3 rounded-full text-[13px] border transition-colors disabled:opacity-60 ${
              action === a.id
                ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#174ea6] font-medium'
                : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {loading && (
          <div className="flex items-center gap-3 text-[#444746] text-sm">
            <span className="h-4 w-4 rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin" />
            Thinking…
          </div>
        )}

        {!loading && error && (
          <div className="space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            {action && (
              <Button variant="outline" size="sm" onClick={() => run(action)}>
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </Button>
            )}
          </div>
        )}

        {!loading && !error && !result && (
          <div className="text-sm text-[#444746] space-y-2">
            <p className="font-medium text-[#3c4043]">What can I help with?</p>
            <ul className="list-disc pl-5 space-y-1 text-[13.5px]">
              <li><b>Continue writing</b> — extend your document in the same voice</li>
              <li><b>Improve writing</b> — select text first, or improve the whole doc</li>
              <li><b>Summarize</b> — add a bullet summary at the end</li>
              <li><b>Suggest title</b> — name the document from its content</li>
            </ul>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wide text-[#80868b]">
              {current?.label} · {contextLabel}
            </div>
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-[#1f1f1f]">
              {result}
            </div>
          </div>
        )}
      </div>

      {!loading && result && (
        <div className="p-3 border-t border-[#e8eaed] flex flex-wrap gap-2 shrink-0">
          {action === 'continue' && (
            <Button size="sm" onClick={() => onInsert(result, 'replace-or-insert')}>
              Insert at cursor
            </Button>
          )}
          {action === 'improve' && (
            <Button size="sm" onClick={() => onInsert(result, 'replace-or-insert')}>
              {contextLabel.startsWith('Selection') ? 'Replace selection' : 'Insert at cursor'}
            </Button>
          )}
          {action === 'summarize' && (
            <Button size="sm" onClick={() => onInsert(result, 'append')}>
              Append to document
            </Button>
          )}
          {action === 'title' && (
            <Button size="sm" onClick={() => onApplyTitle(result.trim().split('\n')[0] ?? '')}>
              Apply as title
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={copyResult}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          {action && (
            <Button variant="outline" size="sm" onClick={() => run(action)}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
          )}
        </div>
      )}
    </aside>
  )
}
