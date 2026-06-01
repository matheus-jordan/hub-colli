import { NextResponse } from 'next/server'
import { getConstraints, upsertConstraint } from '@/lib/constraints'
import { Constraint } from '@/lib/types'

type Ctx = { params: Promise<{ clientId: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { clientId } = await params
  return NextResponse.json(getConstraints(clientId))
}

export async function POST(req: Request, { params }: Ctx) {
  const { clientId } = await params
  const body = await req.json()
  const constraint: Constraint = {
    id: crypto.randomUUID(),
    clientId,
    title: body.title,
    context: body.context ?? '',
    status: 'active',
    deadline: body.deadline ?? null,
    linkedEkyteTaskIds: body.linkedEkyteTaskIds ?? [],
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  }
  upsertConstraint(constraint)
  return NextResponse.json(constraint, { status: 201 })
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { clientId } = await params
  const body = await req.json()
  const existing = getConstraints(clientId).find(c => c.id === body.id)
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const updated: Constraint = {
    ...existing,
    ...body,
    clientId,
    resolvedAt:
      body.status === 'resolved' && !existing.resolvedAt
        ? new Date().toISOString()
        : existing.status === 'active' && body.status === 'active'
        ? null
        : existing.resolvedAt,
  }
  upsertConstraint(updated)
  return NextResponse.json(updated)
}
