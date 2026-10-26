'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor, JSONContent } from '@tiptap/react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { Color, FontFamily, TextStyle } from '@tiptap/extension-text-style'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Bold,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Star,
  Strikethrough,
  Underline,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { AiPanel } from '@/components/docs/ai-panel'
import { EditorToolbar } from '@/components/docs/editor-toolbar'
import { DocsLogo } from '@/components/docs/docs-logo'
import { countWords, displayTitle, type DocFull } from '@/lib/docs'

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error'

export type DocMeta = { id: string; title: string; updatedAt: string }

function textToNodes(text: string): JSONContent[] {
  const nodes: JSONContent[] = []
  let bullets: string[] = []
  const flushBullets = () => {
    if (bullets.length === 0) return
    nodes.push({
      type: 'bulletList',
      content: bullets.map((t) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }],
      })),
    })
    bullets = []
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const m = line.match(/^[-*•]\s+(.*)$/)
    if (m) {
      bullets.push(m[1])
      continue
    }
    flushBullets()
    if (line.length === 0) continue
    nodes.push({ type: 'paragraph', content: [{ type: 'text', text: line }] })
  }
  flushBullets()
  return nodes.length > 0 ? nodes : [{ type: 'paragraph' }]
}

function parseContent(raw: string): JSONContent {
  try {
    const j = JSON.parse(raw)
    if (j && typeof j === 'object' && j.type === 'doc') return j as JSONContent
  } catch {
    /* plain text fallback below */
  }
  return {
    type: 'doc',
    content: raw.trim()
      ? [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }]
      : [{ type: 'paragraph' }],
  }
}

export function EditorView({
  docId,
  onBack,
  onMetaChange,
}: {
  docId: string
  onBack: () => void
  onMetaChange: (meta: DocMeta | null) => void
}) {
  const [doc, setDoc] = useState<DocFull | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/documents/${docId}`)
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setStatus('missing')
          return
        }
        const data = await res.json()
        if (cancelled) return
        setDoc(data.document as DocFull)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('missing')
      })
    return () => {
      cancelled = true
    }
  }, [docId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8fafd]">
        <div className="h-16 flex items-center gap-4 px-6 border-b border-[#dadce0] bg-white">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-32 ml-auto" />
        </div>
        <div className="max-w-[816px] mx-auto mt-8 bg-white rounded-sm shadow-sm p-[8%] space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5" style={{ width: `${95 - i * 9}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (status === 'missing' || !doc) {
    return (
      <div className="min-h-screen bg-[#f8fafd] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-lg text-[#3c4043]">This document doesn&apos;t exist or was deleted.</p>
          <Button onClick={onBack}>Back to Docs home</Button>
        </div>
      </div>
    )
  }

  return <EditorSurface doc={doc} onBack={onBack} onMetaChange={onMetaChange} />
}

function EditorSurface({
  doc,
  onBack,
  onMetaChange,
}: {
  doc: DocFull
  onBack: () => void
  onMetaChange: (meta: DocMeta | null) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState(doc.title)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [wordCount, setWordCount] = useState(0)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [starred, setStarred] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const editorRef = useRef<Editor | null>(null)
  const titleRef = useRef(doc.title)
  const dirtyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const flushSave = useCallback(
    async (opts?: { keepalive?: boolean }) => {
      const ed = editorRef.current
      if (!ed || !dirtyRef.current) return
      const payload = {
        title: titleRef.current,
        content: JSON.stringify(ed.getJSON()),
      }
      dirtyRef.current = false
      setSaveState('saving')
      try {
        const res = await fetch(`/api/documents/${doc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: opts?.keepalive,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        onMetaChange(data.document as DocMeta)
        setSaveState('saved')
      } catch {
        dirtyRef.current = true
        setSaveState('error')
      }
    },
    [doc.id, onMetaChange]
  )

  const flushRef = useRef(flushSave)
  flushRef.current = flushSave

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    setSaveState('unsaved')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void flushRef.current(), 900)
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && dirtyRef.current) {
        void flushRef.current({ keepalive: true })
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const initialContent = useMemo(() => parseContent(doc.content), [doc.content])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing — or let AI Assist do the heavy lifting…',
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'docs-editor focus:outline-none',
        'aria-label': 'Document content',
      },
    },
    onUpdate: ({ editor: ed }) => {
      editorRef.current = ed
      setWordCount(countWords(ed.getText({ blockSeparator: ' ' })))
      scheduleSave()
    },
  })
  editorRef.current = editor

  useEffect(() => {
    if (editor) {
      setWordCount(countWords(editor.getText({ blockSeparator: ' ' })))
    }
  }, [editor])

  const goHome = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (dirtyRef.current) await flushRef.current()
    onBack()
  }

  const changeTitle = (value: string) => {
    setTitle(value)
    titleRef.current = value
    scheduleSave()
  }

  const getContext = useCallback(() => {
    const ed = editorRef.current
    if (!ed) return { selection: '', whole: '' }
    const { from, to } = ed.state.selection
    const selection = ed.state.doc.textBetween(from, to, '\n')
    return { selection, whole: ed.getText({ blockSeparator: '\n' }) }
  }, [])

  const insertAiResult = useCallback(
    (text: string, mode: 'replace-or-insert' | 'append') => {
      const ed = editorRef.current
      if (!ed) return
      const nodes = textToNodes(text)
      if (mode === 'append') ed.chain().focus('end').insertContent(nodes).run()
      else ed.chain().focus().insertContent(nodes).run()
      setAiOpen(false)
      setWordCount(countWords(ed.getText({ blockSeparator: ' ' })))
    },
    []
  )

  const applyAiTitle = useCallback(
    (newTitle: string) => {
      const clean = newTitle.replace(/^["'#\s]+|["'\s]+$/g, '').slice(0, 255)
      if (!clean) return
      changeTitle(clean)
      setAiOpen(false)
      toast({ title: `Title set to “${clean}”` })
    },
    [toast]
  )

  const deleteDoc = async () => {
    try {
      await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      onMetaChange(null)
      toast({ title: 'Document deleted' })
      onBack()
    } catch {
      toast({ title: 'Could not delete document', variant: 'destructive' })
    }
  }

  const saveStatusText =
    saveState === 'saved' ? 'All changes saved'
    : saveState === 'saving' ? 'Saving…'
    : saveState === 'error' ? 'Offline — changes not saved'
    : 'Saving…'

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="h-screen flex flex-col bg-[#f8fafd] text-[#1f1f1f]">
      {/* Header row 1: logo · title · save status */}
      <header className="h-14 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 bg-white border-b border-[#dadce0] shrink-0 z-30">
        <button onClick={goHome} className="p-1.5 rounded-full hover:bg-[#f1f3f4]" aria-label="Back to Docs home" title="Back to Docs home">
          <DocsLogo size={30} />
        </button>
        <div className="h-6 w-px bg-[#dadce0] mx-1" aria-hidden="true" />
        <input
          ref={titleInputRef}
          value={title}
          onChange={(e) => changeTitle(e.target.value)}
          placeholder="Untitled document"
          aria-label="Document title"
          className="min-w-0 w-[150px] sm:w-[260px] lg:w-[360px] h-9 rounded px-2 text-[18px] text-[#1f1f1f] placeholder:text-[#80868b] hover:bg-[#f1f3f4] focus:bg-[#f1f3f4] focus:outline-none transition-colors"
        />
        <button
          onClick={() => setStarred((s) => !s)}
          className="h-8 w-8 rounded-full hover:bg-[#f1f3f4] flex items-center justify-center"
          aria-label={starred ? 'Remove star' : 'Star document'}
          title="Star"
        >
          <Star className={`h-[18px] w-[18px] ${starred ? 'fill-[#f9ab00] text-[#f9ab00]' : 'text-[#444746]'}`} />
        </button>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          {saveState === 'error' ? (
            <button
              onClick={() => void flushSave()}
              className="flex items-center gap-1.5 text-[13px] text-red-600 hover:underline"
              title="Retry saving"
            >
              <CloudOff className="h-4 w-4" />
              <span className="hidden sm:inline">{saveStatusText}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-[13px] text-[#444746]" aria-live="polite">
              <Cloud className={`h-4 w-4 ${saveState === 'saved' ? 'text-[#188038]' : 'text-[#80868b]'}`} />
              <span className="hidden sm:inline">{saveStatusText}</span>
            </span>
          )}
          <div className="h-8 w-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[13px] font-medium select-none" title="You">
            U
          </div>
        </div>
      </header>

      {/* Header row 2: menu bar */}
      <div className="h-9 flex items-center px-2 sm:px-4 bg-white border-b border-[#dadce0] shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 h-7 rounded text-[14px] hover:bg-[#e9eef6]">File</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={goHome}>Back to home</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                titleInputRef.current?.focus()
                titleInputRef.current?.select()
              }}
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toast({ title: `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`, description: title.trim() || 'Untitled document' })
              }
            >
              Word count
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setConfirmDelete(true)}>
              Delete document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 h-7 rounded text-[14px] hover:bg-[#e9eef6]">Edit</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => editor?.chain().focus().undo().run()}>Undo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().redo().run()}>Redo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor?.chain().focus().selectAll().run()}>Select all</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
              Clear formatting
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 h-7 rounded text-[14px] hover:bg-[#e9eef6]">Insert</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
              Horizontal line
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().insertContent(today).run()}>
              Date
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBulletList().run()}>
              <List className="h-4 w-4" /> Bulleted list
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="h-4 w-4" /> Numbered list
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleTaskList().run()}>
              <ListChecks className="h-4 w-4" /> Checklist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
              <Quote className="h-4 w-4" /> Quote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 h-7 rounded text-[14px] hover:bg-[#e9eef6] flex items-center gap-0.5">
              Format <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBold().run()}>
              <Bold className="h-4 w-4" /> Bold
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleItalic().run()}>
              <Italic className="h-4 w-4" /> Italic
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleUnderline().run()}>
              <Underline className="h-4 w-4" /> Underline
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleStrike().run()}>
              <Strikethrough className="h-4 w-4" /> Strikethrough
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph()}>Normal text</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().setHeading({ level: 1 })}>Heading 1</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().setHeading({ level: 2 })}>Heading 2</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.chain().focus().setHeading({ level: 3 })}>Heading 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Toolbar */}
      <div className="h-12 flex items-center bg-white border-b border-[#dadce0] shrink-0 z-30">
        <div className="w-full">
          <EditorToolbar editor={editor} onOpenAi={() => setAiOpen(true)} aiBusy={aiBusy} />
        </div>
      </div>

      {/* Page */}
      <main className="flex-1 overflow-y-auto" aria-label="Document page">
        <div className="min-h-full px-2 sm:px-8 py-6 sm:py-9 flex justify-center">
          <div className="docs-page-content w-full max-w-[816px] bg-white rounded-[3px] shadow-[0_1px_3px_1px_rgba(60,64,67,.15)]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      {/* Word count chip */}
      <div className="fixed left-3 bottom-3 z-40 h-7 px-3 rounded-full bg-white/95 border border-[#dadce0] shadow-sm flex items-center text-xs text-[#444746] pointer-events-none">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </div>

      {/* AI Assist panel */}
      <AiPanel
        open={aiOpen}
        docId={doc.id}
        docTitle={title}
        getContext={getContext}
        onInsert={insertAiResult}
        onApplyTitle={applyAiTitle}
        onClose={() => setAiOpen(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              “{displayTitle(title)}” will be deleted permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setConfirmDelete(false)
                void deleteDoc()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
