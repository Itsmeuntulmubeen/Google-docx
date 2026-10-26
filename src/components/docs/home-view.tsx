'use client'

import { useMemo, useState } from 'react'
import {
  ChevronDown,
  FileText,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  SquarePen,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DocsLogo, DocsLogoWithText } from '@/components/docs/docs-logo'
import { TEMPLATES } from '@/lib/docs-templates'
import { displayTitle, relativeTime, type DocSummary } from '@/lib/docs'

type Props = {
  documents: DocSummary[] | null
  isBusy: boolean
  onOpenDoc: (id: string) => void
  onCreateDoc: (templateId: string) => Promise<DocSummary | null>
  onDeleteDoc: (id: string) => Promise<void>
  onRenameDoc: (id: string, title: string) => Promise<void>
}

export function HomeView({
  documents,
  isBusy,
  onOpenDoc,
  onCreateDoc,
  onDeleteDoc,
  onRenameDoc,
}: Props) {
  const [query, setQuery] = useState('')
  const [renameTarget, setRenameTarget] = useState<DocSummary | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DocSummary | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!documents) return null
    const q = query.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((d) => d.title.toLowerCase().includes(q))
  }, [documents, query])

  const handleCreate = async (templateId: string) => {
    setCreating(templateId)
    try {
      await onCreateDoc(templateId)
    } finally {
      setCreating(null)
    }
  }

  const handleRenameSubmit = async () => {
    if (!renameTarget) return
    const title = renameValue.trim()
    if (title.length > 0) {
      await onRenameDoc(renameTarget.id, title.slice(0, 255))
    }
    setRenameTarget(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafd] text-[#1f1f1f]">
      {/* Top bar */}
      <header className="h-16 flex items-center gap-2 px-2 sm:px-4 bg-[#f8fafd] sticky top-0 z-20">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-[#444746]" aria-label="Main menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
          </svg>
        </Button>
        <div className="select-none" aria-label="Docs">
          <DocsLogoWithText />
        </div>
        <div className="flex-1 flex justify-center px-2 sm:px-6">
          <div className="w-full max-w-[720px] h-12 flex items-center gap-3 rounded-full bg-[#e9eef6] hover:bg-[#e1e7f0] focus-within:bg-white focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.18)] px-4 transition-colors">
            <Search className="h-5 w-5 text-[#444746] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search documents"
              className="flex-1 bg-transparent outline-none text-base text-[#1f1f1f] placeholder:text-[#444746]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[#444746] hover:text-[#1f1f1f] text-sm"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div
          className="h-9 w-9 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-medium select-none shrink-0"
          title="You"
        >
          U
        </div>
      </header>

      {/* Start a new doc */}
      <section className="px-4 sm:px-6 pt-4 pb-2" aria-label="Start a new document">
        <div className="flex items-start gap-3 sm:gap-4 flex-nowrap overflow-x-auto pb-2">
          <button
            onClick={() => handleCreate('blank')}
            disabled={isBusy || creating !== null}
            className="w-[142px] h-[170px] shrink-0 rounded-lg border border-[#dadce0] bg-white hover:border-[#a8c7fa] hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] transition-all p-3 flex flex-col justify-between text-left disabled:opacity-60"
            aria-label="Create blank document"
          >
            <span className="h-10 w-10 rounded-full bg-[#e8f0fe] flex items-center justify-center">
              {creating === 'blank' ? (
                <span className="h-5 w-5 rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin" />
              ) : (
                <Plus className="h-6 w-6 text-[#1a73e8]" />
              )}
            </span>
            <span className="text-sm font-medium text-[#3c4043] leading-tight">
              {creating === 'blank' ? 'Creating…' : 'Blank\ndocument'}
            </span>
          </button>

          {TEMPLATES.filter((t) => t.id !== 'blank').map((t) => (
            <button
              key={t.id}
              onClick={() => handleCreate(t.id)}
              disabled={isBusy || creating !== null}
              className="w-[142px] h-[170px] shrink-0 rounded-lg border border-[#dadce0] bg-white hover:border-[#a8c7fa] hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] transition-all p-3 flex flex-col justify-between text-left disabled:opacity-60"
              aria-label={`Create ${t.name}`}
            >
              <span className="h-16 flex items-start justify-center pt-1 text-[#1a73e8]">
                {creating === t.id ? (
                  <span className="h-5 w-5 rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin mt-3" />
                ) : (
                  <DocsLogo size={34} />
                )}
              </span>
              <span className="text-xs font-medium text-[#3c4043] leading-tight">{t.name}</span>
            </button>
          ))}

          <div className="hidden md:flex h-[170px] items-center shrink-0 pl-2">
            <span className="text-sm text-[#1a73e8] font-medium flex items-center gap-2 cursor-pointer hover:underline">
              Template gallery <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>
      </section>

      {/* Recent documents */}
      <section className="px-4 sm:px-6 pb-10 flex-1" aria-label="Recent documents">
        <div className="max-w-[1000px] mx-auto">
          <div className="h-12 flex items-center gap-3 px-4 text-sm text-[#444746] border-b border-transparent">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Recent documents</span>
            <span className="ml-auto hidden sm:flex items-center gap-1 text-[#444746] cursor-pointer hover:bg-[#e1e7f0] rounded px-2 py-1">
              Owned by anyone <ChevronDown className="h-4 w-4" />
            </span>
          </div>

          {filtered === null ? (
            <div className="px-4 py-2 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-24 hidden sm:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <DocsLogo size={44} />
              <p className="mt-4 text-[#444746] text-sm">
                {query ? (
                  <>No documents match “{query}”.</>
                ) : (
                  <>No documents yet. Start a new doc above.</>
                )}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-transparent">
              {filtered.map((doc) => (
                <li key={doc.id}>
                  <div
                    className="group flex items-center gap-4 h-12 px-4 rounded-lg hover:bg-[#e1e7f0] cursor-pointer transition-colors"
                    onClick={() => onOpenDoc(doc.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onOpenDoc(doc.id)
                    }}
                    aria-label={`Open ${displayTitle(doc.title)}`}
                  >
                    <DocsLogo size={18} />
                    <span className="flex-1 min-w-0 truncate text-[14px] text-[#1f1f1f]">
                      {displayTitle(doc.title)}
                    </span>
                    <span className="hidden sm:block text-[13px] text-[#444746] shrink-0">You</span>
                    <span className="w-[110px] sm:w-[150px] text-right text-[13px] text-[#444746] shrink-0 tabular-nums">
                      {relativeTime(doc.updatedAt)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 text-[#444746]"
                          aria-label={`Options for ${displayTitle(doc.title)}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                        className="w-44"
                      >
                        <DropdownMenuItem onClick={() => onOpenDoc(doc.id)}>
                          <SquarePen className="h-4 w-4" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameTarget(doc)
                            setRenameValue(displayTitle(doc.title) === 'Untitled document' ? '' : doc.title)
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => setDeleteTarget(doc)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Rename dialog */}
      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
            }}
            placeholder="Document name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} disabled={renameValue.trim().length === 0}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget ? displayTitle(deleteTarget.title) : ''}” will be deleted permanently. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (deleteTarget) await onDeleteDoc(deleteTarget.id)
                setDeleteTarget(null)
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
