import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { Constraint } from './types'

const FILE = path.join(process.cwd(), 'data', 'constraints.json')

function read(): Record<string, Constraint[]> {
  try {
    return JSON.parse(readFileSync(FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function persist(data: Record<string, Constraint[]>) {
  writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getConstraints(clientId: string): Constraint[] {
  const all = read()
  return (all[clientId] ?? []).sort(
    (a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (b.status === 'active' && a.status !== 'active') return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  )
}

export function upsertConstraint(constraint: Constraint): void {
  const data = read()
  const list = data[constraint.clientId] ?? []
  const idx = list.findIndex(c => c.id === constraint.id)
  if (idx >= 0) list[idx] = constraint
  else list.push(constraint)
  data[constraint.clientId] = list
  persist(data)
}
