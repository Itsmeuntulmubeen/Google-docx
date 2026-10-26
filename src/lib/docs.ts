import type { JSONContent } from '@tiptap/core'

export type DocSummary = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type DocFull = DocSummary & { content: string }

export const UNTITLED = 'Untitled document'

export function displayTitle(title: string): string {
  return title.trim().length > 0 ? title : UNTITLED
}

export function docToPlainText(json: JSONContent): string {
  const out: string[] = []
  const walk = (node: JSONContent, isRoot: boolean) => {
    switch (node.type) {
      case 'text':
        out.push(node.text ?? '')
        break
      case 'hardBreak':
        out.push('\n')
        break
      case 'heading':
      case 'paragraph':
      case 'blockquote':
      case 'codeBlock':
      case 'listItem':
        if (!isRoot) out.push('\n')
        for (const child of node.content ?? []) walk(child, false)
        if (node.type === 'listItem') out.push('')
        break
      case 'bulletList':
      case 'orderedList':
      case 'taskList':
        for (const child of node.content ?? []) walk(child, false)
        break
      default:
        for (const child of node.content ?? []) walk(child, false)
    }
  }
  walk(json, true)
  return out
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed.length === 0) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

export function relativeTime(iso: string): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return '—'
  const diff = Date.now() - then.getTime()
  const min = 60_000
  if (diff < min) return 'Just now'
  if (diff < 60 * min) {
    const m = Math.floor(diff / min)
    return `${m} minute${m === 1 ? '' : 's'} ago`
  }
  if (diff < 24 * 60 * min) {
    const h = Math.floor(diff / (60 * min))
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  if (diff < 7 * 24 * 60 * min) {
    const d = Math.floor(diff / (24 * 60 * min))
    return `${d} day${d === 1 ? '' : 's'} ago`
  }
  return then.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: then.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}
