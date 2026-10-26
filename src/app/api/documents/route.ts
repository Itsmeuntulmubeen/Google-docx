import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const listSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
}

export async function GET() {
  const documents = await db.document.findMany({
    orderBy: { updatedAt: 'desc' },
    select: listSelect,
  })
  return NextResponse.json({ documents })
}

const createBody = z.object({
  title: z.string().max(255).optional(),
  content: z.string().max(2_000_000).optional(),
})

export async function POST(req: Request) {
  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const parsed = createBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const document = await db.document.create({
    data: {
      title: parsed.data.title ?? 'Untitled document',
      content: parsed.data.content ?? '',
    },
    select: { ...listSelect, content: true },
  })
  return NextResponse.json({ document }, { status: 201 })
}
