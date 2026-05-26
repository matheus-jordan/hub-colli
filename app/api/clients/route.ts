import { NextResponse } from 'next/server'
import { CLIENTS } from '@/lib/config'
import { getClientSummary } from '@/lib/data'

export const revalidate = 1800

export async function GET() {
  const summaries = await Promise.all(CLIENTS.map(getClientSummary))
  return NextResponse.json(summaries)
}
