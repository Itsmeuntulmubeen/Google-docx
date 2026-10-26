import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

const patchBody = z.object({
  title: z.string().max(255).optional(),
  content: z.string().max(2_000_000).optional(),
})

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const document = await db.document.findUnique({ where: { id } })
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  return NextResponse.json({ document })
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = patchBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const existing = await db.document.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const document = await db.document.update({
    where: { id },
    data: parsed.data,
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json({ document })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const existing = await db.document.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }
  await db.document.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
