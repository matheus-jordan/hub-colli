import Papa from 'papaparse'
import { MetricValue, MonthlyMetrics, WeeklyMetrics } from './types'

const BASE = 'https://docs.google.com/spreadsheets/d'

export async function readSheet(sheetId: string, sheetName: string): Promise<Record<string, string>[]> {
  const url = `${BASE}/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { 'Accept': 'text/csv' },
    })
    if (!res.ok) return []
    const text = await res.text()
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
    const rows = result.data
    if (rows.length < 2) return []

    // Find header row: first row that has meaningful column names (not just dates or empty)
    let headerIdx = 0
    for (let i = 0; i < Math.min(6, rows.length); i++) {
      const hasKeyword = rows[i].some(cell =>
        /invest|lead|roas|cpa|venda|fatur|mql|sql|mês|semana|dia|week|period/i.test(cell)
      )
      if (hasKeyword) { headerIdx = i; break }
    }

    const headers = rows[headerIdx].map(h => h.trim().replace(/\s+/g, ' '))
    return rows.slice(headerIdx + 1)
      .filter(row => row.some(c => c.trim()))
      .map(row => {
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { if (h) obj[h] = (row[i] ?? '').trim() })
        return obj
      })
  } catch {
    return []
  }
}

export function parseNumber(raw: string): number | null {
  if (!raw || raw === '-' || raw === '') return null
  const cleaned = raw.replace(/[R$\s%]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

export function fmtCurrency(v: number | null): string {
  if (v === null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export function fmtNumber(v: number | null, dec = 0): string {
  if (v === null) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: dec }).format(v)
}

export function fmtRoas(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(2) + 'x'
}

function metric(raw: string, fmt: (v: number | null) => string): MetricValue {
  const value = parseNumber(raw)
  return { value, formatted: fmt(value) }
}

function findCol(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find(col => col.toLowerCase().includes(k.toLowerCase()))
    if (found) return row[found] ?? ''
  }
  return ''
}

export function parseMonthlyRow(row: Record<string, string>): MonthlyMetrics {
  const period = findCol(row, 'mês', 'período', 'semana', 'dia', 'month', 'week')
  return {
    period: period || Object.values(row)[0] || '',
    investment: metric(findCol(row, 'invest'), fmtCurrency),
    leads: metric(findCol(row, 'leads'), v => fmtNumber(v)),
    mqls: metric(findCol(row, 'mql'), v => fmtNumber(v)),
    sqls: metric(findCol(row, 'sql'), v => fmtNumber(v)),
    sales: metric(findCol(row, 'venda'), v => fmtNumber(v)),
    revenue: metric(findCol(row, 'fatur', 'receita'), fmtCurrency),
    cpa: metric(findCol(row, 'cpa'), fmtCurrency),
    roas: metric(findCol(row, 'roas'), fmtRoas),
    cpl: metric(findCol(row, 'cpl'), fmtCurrency),
  }
}

export function parseWeeklyRow(row: Record<string, string>): WeeklyMetrics {
  const period = findCol(row, 'semana', 'week', 'período', 'dia')
  return {
    period: period || Object.values(row)[0] || '',
    investment: metric(findCol(row, 'invest'), fmtCurrency),
    leads: metric(findCol(row, 'leads'), v => fmtNumber(v)),
    mqls: metric(findCol(row, 'mql'), v => fmtNumber(v)),
    roas: metric(findCol(row, 'roas'), fmtRoas),
    cpa: metric(findCol(row, 'cpa'), fmtCurrency),
  }
}

export function parseDate(s: string): Date | null {
  if (!s) return null
  let d = new Date(s)
  if (!isNaN(d.getTime())) return d
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) {
    d = new Date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

export function daysAgo(dateStr: string | null): number {
  if (!dateStr) return 999
  const d = parseDate(dateStr)
  if (!d) return 999
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}
