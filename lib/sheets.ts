import Papa from 'papaparse'
import { MetricValue, MonthlyMetrics, WeeklyMetrics } from './types'

const BASE = 'https://docs.google.com/spreadsheets/d'

// ── Raw 2D fetch ────────────────────────────────────────────────────────────

async function fetchRaw(sheetId: string, sheetName: string): Promise<string[][]> {
  const url = `${BASE}/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const text = await res.text()
    const result = Papa.parse<string[]>(text, { skipEmptyLines: false })
    return result.data
  } catch {
    return []
  }
}

// ── Row-oriented sheets (bd Meta Ads, bd Google Ads, bd Leads LP) ───────────

export async function readSheet(sheetId: string, sheetName: string): Promise<Record<string, string>[]> {
  const rows = await fetchRaw(sheetId, sheetName)
  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.trim())
  return rows.slice(1)
    .filter(row => row.some(c => c.trim()))
    .map(row => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { if (h) obj[h] = (row[i] ?? '').trim() })
      return obj
    })
}

// ── Transposed sheets (monthly and weekly: rows=metrics, cols=periods) ──────
//
// Structure:
//   row 0: labels    → col 0 = "Ano",          col 1..N = year numbers
//   row 1: labels    → col 0 = "Data inicial",  col 1..N = "01/MM/YYYY"
//   row 2: labels    → col 0 = "Data final",    col 1..N = "DD/MM/YYYY"
//   row 3: labels    → col 0 = "Mês",           col 1..N = "janeiro"...
//   row 4+: metrics  → col 0 = metric name,     col 1..N = values

const MONTHLY_METRICS: Record<string, keyof MonthlyMetrics> = {
  'investimento':          'investment',
  'leads':                 'leads',
  'mqls':                  'mqls',
  'sqls':                  'sqls',
  'vendas':                'sales',
  'faturamento v4':        'revenue',
  'faturamento':           'revenue',
  'roas':                  'roas',
  'custo por lead':        'cpl',
  'custo por venda':       'cpa',
  'custo por sql':         'cpa',
}

const WEEKLY_METRICS: Record<string, keyof WeeklyMetrics> = {
  'investimento':  'investment',
  'leads':         'leads',
  'mqls':          'mqls',
  'roas':          'roas',
  'custo por lead':'cpa',
  'custo por venda':'cpa',
}

function parseNum(raw: string): number | null {
  if (!raw || raw === '-' || raw.trim() === '') return null
  const cleaned = raw.replace(/[R$\s%]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) || n === 0 ? null : n
}

export function parseNumber(raw: string): number | null { return parseNum(raw) }

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

function mv(raw: string, fmt: (v: number | null) => string): MetricValue {
  const value = parseNum(raw)
  return { value, formatted: fmt(value) }
}

function emptyMetrics(period: string): MonthlyMetrics {
  const e: MetricValue = { value: null, formatted: '—' }
  return { period, investment: e, leads: e, mqls: e, sqls: e, sales: e, revenue: e, cpa: e, roas: e, cpl: e }
}

function emptyWeekly(period: string): WeeklyMetrics {
  const e: MetricValue = { value: null, formatted: '—' }
  return { period, investment: e, leads: e, mqls: e, roas: e, cpa: e }
}

// Parse date "01/05/2026" or "01/05" → Date | null
export function parseDate(s: string): Date | null {
  if (!s) return null
  // ISO format
  let d = new Date(s)
  if (!isNaN(d.getTime())) return d
  // DD/MM/YYYY
  const full = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (full) {
    d = new Date(`${full[3]}-${full[2].padStart(2,'0')}-${full[1].padStart(2,'0')}`)
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

// Find the column index for the most recent month that has investment data
function findBestColumns(rows: string[][], dateRowIdx: number, investRowIdx: number, count: number): number[] {
  if (rows.length === 0) return []
  const totalCols = rows[0].length

  // Collect column indices that have a valid date AND non-zero investment (or just valid date)
  const candidates: { colIdx: number; date: Date }[] = []
  for (let c = 1; c < totalCols; c++) {
    const dateStr = rows[dateRowIdx]?.[c] ?? ''
    const d = parseDate(dateStr)
    if (!d) continue
    candidates.push({ colIdx: c, date: d })
  }

  // Sort descending by date, return most recent N
  candidates.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Prefer columns where investment row has a value
  if (investRowIdx >= 0) {
    const withData = candidates.filter(c => parseNum(rows[investRowIdx]?.[c.colIdx] ?? '') !== null)
    if (withData.length >= count) return withData.slice(0, count).map(c => c.colIdx)
  }

  return candidates.slice(0, count).map(c => c.colIdx)
}

export async function readTransposedMonthly(sheetId: string, sheetName: string): Promise<MonthlyMetrics[]> {
  const rows = await fetchRaw(sheetId, sheetName)
  if (rows.length < 5) return []

  // Find row indices
  const labelCol = (row: string[]) => (row[0] ?? '').trim().toLowerCase()
  const dateRowIdx = rows.findIndex(r => /data inicial/i.test(labelCol(r)))
  const yearRowIdx = rows.findIndex(r => /^ano$/i.test(labelCol(r)))
  const monthRowIdx = rows.findIndex(r => /^mês$/i.test(labelCol(r)))
  const investRowIdx = rows.findIndex(r => /^investimento$/i.test(labelCol(r)))

  if (dateRowIdx < 0) return []

  const colIndices = findBestColumns(rows, dateRowIdx, investRowIdx, 6)
  if (colIndices.length === 0) return []

  // Build label → row index map
  const metricRowMap: Record<string, number> = {}
  rows.forEach((row, idx) => {
    const label = labelCol(row)
    if (label) metricRowMap[label] = idx
  })

  return colIndices.map(colIdx => {
    const dateStr = rows[dateRowIdx]?.[colIdx] ?? ''
    const year = rows[yearRowIdx]?.[colIdx] ?? ''
    const monthName = rows[monthRowIdx]?.[colIdx] ?? ''

    // Build period label using month name from sheet ("janeiro/2026")
    // Avoid parseDate on year-only strings ("2026") which resolve to Jan 1
    const period = monthName && year
      ? `${monthName}/${year}`
      : (dateStr || `col${colIdx}`)

    const m = emptyMetrics(period)

    Object.entries(MONTHLY_METRICS).forEach(([label, field]) => {
      const rowIdx = metricRowMap[label]
      if (rowIdx === undefined) return
      const raw = rows[rowIdx]?.[colIdx] ?? ''
      if (!raw) return

      const fmtMap: Record<keyof MonthlyMetrics, (v: number | null) => string> = {
        period: () => period,
        investment: fmtCurrency,
        leads: v => fmtNumber(v),
        mqls: v => fmtNumber(v),
        sqls: v => fmtNumber(v),
        sales: v => fmtNumber(v),
        revenue: fmtCurrency,
        cpa: fmtCurrency,
        roas: fmtRoas,
        cpl: fmtCurrency,
      }
      ;(m[field] as MetricValue) = mv(raw, fmtMap[field])
    })

    return m
  })
}

export async function readTransposedWeekly(sheetId: string, sheetName: string): Promise<WeeklyMetrics[]> {
  const rows = await fetchRaw(sheetId, sheetName)
  if (rows.length < 4) return []

  const labelCol = (row: string[]) => (row[0] ?? '').trim().toLowerCase()
  const dateRowIdx = rows.findIndex(r => /data inicial/i.test(labelCol(r)))
  const investRowIdx = rows.findIndex(r => /^investimento$/i.test(labelCol(r)))

  if (dateRowIdx < 0) return []

  const colIndices = findBestColumns(rows, dateRowIdx, investRowIdx, 8)
  if (colIndices.length === 0) return []

  const metricRowMap: Record<string, number> = {}
  rows.forEach((row, idx) => {
    const label = labelCol(row)
    if (label) metricRowMap[label] = idx
  })

  return colIndices.map(colIdx => {
    const dateStr = rows[dateRowIdx]?.[colIdx] ?? ''
    const endStr = rows[dateRowIdx + 1]?.[colIdx] ?? ''
    const period = dateStr && endStr ? `${dateStr} – ${endStr}` : dateStr

    const w = emptyWeekly(period)

    Object.entries(WEEKLY_METRICS).forEach(([label, field]) => {
      const rowIdx = metricRowMap[label]
      if (rowIdx === undefined) return
      const raw = rows[rowIdx]?.[colIdx] ?? ''
      if (!raw) return
      const fmtMap: Record<keyof WeeklyMetrics, (v: number | null) => string> = {
        period: () => period,
        investment: fmtCurrency,
        leads: v => fmtNumber(v),
        mqls: v => fmtNumber(v),
        roas: fmtRoas,
        cpa: fmtCurrency,
      }
      ;(w[field] as MetricValue) = mv(raw, fmtMap[field])
    })

    return w
  })
}
