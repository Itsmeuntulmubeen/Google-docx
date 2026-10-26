import { NextResponse } from 'next/server'
import { z } from 'zod'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

const bodySchema = z.object({
  documentId: z.string().min(1),
  action: z.enum(['continue', 'improve', 'summarize', 'title']),
  context: z.string().max(40_000).default(''),
  title: z.string().max(255).default(''),
})

const MAX_CONTEXT = 4_000

function buildMessages(action: string, docTitle: string, context: string) {
  const trimmed = context.slice(-MAX_CONTEXT)
  const languageRule =
    'Write in the same language as the document text. If the text is empty or mostly non-verbal, use English.'
  switch (action) {
    case 'continue':
      return [
        {
          role: 'assistant' as const,
          content:
            'You are a writing assistant inside a document editor. You continue documents naturally. Match the tone, style, register and formatting conventions of the existing text. Never repeat or rephrase what is already written. Output ONLY the continuation text — no preamble, no explanations, no quotes around it.',
        },
        {
          role: 'user' as const,
          content: `Document title: "${docTitle}"\n\nHere is the document so far (it ends where the text ends):\n\n"""\n${trimmed}\n"""\n\nContinue writing naturally from that point. 1-3 short paragraphs maximum. ${languageRule}`,
        },
      ]
    case 'improve':
      return [
        {
          role: 'assistant' as const,
          content:
            'You are an editor inside a document editor. You rewrite text to be clearer, better structured and grammatically correct while strictly preserving the original meaning, tone and language. Output ONLY the rewritten text — no preamble, no explanations.',
        },
        {
          role: 'user' as const,
          content: `Document title: "${docTitle}"\n\nRewrite the following text to be clearer and better written, preserving its meaning and approximate length:\n\n"""\n${trimmed}\n"""`,
        },
      ]
    case 'summarize':
      return [
        {
          role: 'assistant' as const,
          content:
            'You summarize documents as concise bullet points. Each bullet starts with "- " and fits on one line. Cover the key points only. Output ONLY the bullets — no preamble, no headings.',
        },
        {
          role: 'user' as const,
          content: `Document title: "${docTitle}"\n\nSummarize this document in 3-6 bullet points:\n\n"""\n${trimmed}\n"""`,
        },
      ]
    case 'title':
      return [
        {
          role: 'assistant' as const,
          content:
            'You suggest short, specific document titles. Output ONLY the title text — max 6 words, no quotes, no period, no explanation.',
        },
        {
          role: 'user' as const,
          content: `Suggest a concise, descriptive title (max 6 words) for this document:\n\n"""\n${trimmed}\n"""`,
        },
      ]
    default:
      throw new Error('Unknown action')
  }
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { documentId, action, context, title } = parsed.data

  if (context.trim().length === 0) {
    return NextResponse.json(
      { error: 'Nothing to work with — write something first.' },
      { status: 400 }
    )
  }

  const document = await db.document.findUnique({
    where: { id: documentId },
    select: { id: true },
  })
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  let result = ''
  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: buildMessages(action, title || 'Untitled document', context),
      thinking: { type: 'disabled' },
    })
    result = String(completion?.choices?.[0]?.message?.content ?? '').trim()
  } catch (err) {
    console.error('[ai] completion failed:', err)
    return NextResponse.json(
      { error: 'AI service is unavailable right now. Please try again.' },
      { status: 502 }
    )
  }

  if (result.length === 0) {
    return NextResponse.json(
      { error: 'The AI returned an empty response. Please try again.' },
      { status: 502 }
    )
  }

  // Strip surrounding markdown fences if the model added them
  result = result
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()

  await db.aiInteraction.create({
    data: {
      documentId,
      action,
      inputText: context.slice(-2_000),
      result: result.slice(0, 20_000),
    },
  })

  return NextResponse.json({ result })
}
