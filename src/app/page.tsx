'use client'

import { useCallback, useEffect, useState } from 'react'
import { HomeView } from '@/components/docs/home-view'
import { EditorView, type DocMeta } from '@/components/docs/editor-view'
import { TEMPLATES } from '@/lib/docs-templates'
import type { DocSummary } from '@/lib/docs'

type View = { name: 'home' } | { name: 'editor'; id: string }

export default function Page() {
  const [view, setView] = useState<View>({ name: 'home' })
  const [documents, setDocuments] = useState<DocSummary[] | null>(null)

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      if (!res.ok) return
      const data = await res.json()
      setDocuments(data.documents as DocSummary[])
    } catch {
      // keep previous state on transient network errors
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/documents')
        if (cancelled || !res.ok) return
        const data = await res.json()
        if (!cancelled) setDocuments(data.documents as DocSummary[])
      } catch {
        // keep previous state on transient network errors
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const upsertMeta = useCallback(
    (meta: DocMeta | null) => {
      if (meta === null) {
        // Document was deleted from the editor
        const currentId = view.name === 'editor' ? view.id : null
        setDocuments((prev) => (prev && currentId ? prev.filter((d) => d.id !== currentId) : prev))
        return
      }
      setDocuments((prev) => {
        if (!prev) return prev
        const existing = prev.find((d) => d.id === meta.id)
        const next: DocSummary = {
          id: meta.id,
          title: meta.title,
          createdAt: existing?.createdAt ?? meta.updatedAt,
          updatedAt: meta.updatedAt,
        }
        return [next, ...prev.filter((d) => d.id !== meta.id)]
      })
    },
    [view]
  )

  const createDoc = useCallback(
    async (templateId: string): Promise<DocSummary | null> => {
      const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]
      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: template.title, content: JSON.stringify(template.content) }),
        })
        if (!res.ok) return null
        const data = await res.json()
        const created = data.document as DocSummary & { content: string }
        setDocuments((prev) => [created, ...(prev ?? [])])
        setView({ name: 'editor', id: created.id })
        return created
      } catch {
        return null
      }
    },
    []
  )

  const deleteDoc = useCallback(
    async (id: string) => {
      setDocuments((prev) => prev?.filter((d) => d.id !== id) ?? prev)
      try {
        await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      } catch {
        void refreshDocuments()
      }
    },
    [refreshDocuments]
  )

  const renameDoc = useCallback(async (id: string, title: string) => {
    setDocuments((prev) => prev?.map((d) => (d.id === id ? { ...d, title } : d)) ?? prev)
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      void refreshDocuments()
    } catch {
      void refreshDocuments()
    }
  }, [refreshDocuments])

  if (view.name === 'editor') {
    return (
      <EditorView
        key={view.id}
        docId={view.id}
        onBack={() => setView({ name: 'home' })}
        onMetaChange={upsertMeta}
      />
    )
  }

  return (
    <HomeView
      documents={documents}
      isBusy={false}
      onOpenDoc={(id) => setView({ name: 'editor', id })}
      onCreateDoc={createDoc}
      onDeleteDoc={deleteDoc}
      onRenameDoc={renameDoc}
    />
  )
}
