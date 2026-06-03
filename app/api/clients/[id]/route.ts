import { NextResponse } from 'next/server'
import { CLIENTS } from '@/lib/config'
import { getClientDetail } from '@/lib/data'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = CLIENTS.find(c => c.id === id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const period = new URL(req.url).searchParams.get('period') ?? undefined
  const detail = await getClientDetail(client, period)
  return NextResponse.json(detail)
}
