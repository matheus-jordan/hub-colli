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
  // Investimento
  'investimento':               'investment',
  // Leads — variantes com e sem "(manual)"
  'leads':                      'leads',
  'leads (manual)':             'leads',
  // MQLs
  'mqls':                       'mqls',
  'mqls (manual)':              'mqls',
  'mql (manual)':               'mqls',
  // SQLs
  'sqls':                       'sqls',
  'sqls (manual)':              'sqls',
  'sql (manual)':               'sqls',
  // Vendas
  'vendas':                     'sales',
  'vendas (manual)':            'sales',
  // Faturamento / Receita
  'faturamento v4':             'revenue',
  'faturamento v4 (manual)':    'revenue',
  'faturamento':                'revenue',
  'receita captada':            'revenue',
  'valor de venda (manual)':    'revenue',
  // ROAS
  'roas':                       'roas',
  'roas captado':               'roas',
  // CPL
  'custo por lead':             'cpl',
  // CPA
  'custo por venda':            'cpa',
  'custo por sql':              'cpa',
  'custo por venda (manual)':   'cpa',
  // CTR
  'ctr':                        'ctr',
  'taxa de conversão':          'ctr',
  'taxa de conversão (lead)':   'ctr',
  '% tax conversão (lead)':     'ctr',
  // CPM
  'custo por mil impressões':   'cpm',
  'cpm':                        'cpm',
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

export function fmtPercent(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(2) + '%'
}

function mv(raw: string, fmt: (v: number | null) => string): MetricValue {
  const value = parseNum(raw)
  return { value, formatted: fmt(value) }
}

function emptyMetrics(period: string): MonthlyMetrics {
  const e: MetricValue = { value: null, formatted: '—' }
  return { period, investment: e, leads: e, mqls: e, sqls: e, sales: e, revenue: e, cpa: e, roas: e, cpl: e, ctr: e, cpm: e }
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

export interface ChannelMonthlyMetrics {
  total: MonthlyMetrics[]
  meta: MonthlyMetrics[]
  google: MonthlyMetrics[]
}

function buildMetricsFromMap(
  metricRowMap: Record<string, number>,
  rows: string[][],
  colIndices: number[],
  periodFn: (colIdx: number) => string
): MonthlyMetrics[] {
  const fmtMap: Record<keyof MonthlyMetrics, (v: number | null) => string> = {
    period: () => '',
    investment: fmtCurrency,
    leads: v => fmtNumber(v),
    mqls: v => fmtNumber(v),
    sqls: v => fmtNumber(v),
    sales: v => fmtNumber(v),
    revenue: fmtCurrency,
    cpa: fmtCurrency,
    roas: fmtRoas,
    cpl: fmtCurrency,
    ctr: fmtPercent,
    cpm: fmtCurrency,
  }

  return colIndices.map(colIdx => {
    const period = periodFn(colIdx)
    const m = emptyMetrics(period)
    Object.entries(MONTHLY_METRICS).forEach(([label, field]) => {
      const rowIdx = metricRowMap[label]
      if (rowIdx === undefined) return
      const raw = rows[rowIdx]?.[colIdx] ?? ''
      if (!raw) return
      ;(m[field] as MetricValue) = mv(raw, fmtMap[field])
    })
    // ROAS só faz sentido quando há faturamento
    if (m.revenue.value === null) {
      m.roas = { value: null, formatted: '—' }
    }
    return m
  })
}

export async function readTransposedMonthlyChannels(sheetId: string, sheetName: string): Promise<ChannelMonthlyMetrics> {
  const rows = await fetchRaw(sheetId, sheetName)
  const empty: ChannelMonthlyMetrics = { total: [], meta: [], google: [] }
  if (rows.length < 5) return empty

  const lbl = (row: string[]) => (row[0] ?? '').trim().toLowerCase()
  const dateRowIdx  = rows.findIndex(r => /data\s+inicial/i.test(lbl(r)))
  const yearRowIdx  = rows.findIndex(r => /^ano$/i.test(lbl(r)))
  const monthRowIdx = rows.findIndex(r => /^m[eê]s$/i.test(lbl(r)))
  if (dateRowIdx < 0) return empty

  // Fronteiras de seção por label (linha pode variar entre clientes)
  const metaStart   = rows.findIndex(r => /investimento\s+meta/i.test(lbl(r)))
  const googleStart = rows.findIndex(r => /investimento\s+google/i.test(lbl(r)))
  const hasChannels = metaStart >= 0 || googleStart >= 0

  // Índice do "investimento" total (antes das seções de canal)
  const totalInvestIdx = rows.findIndex(r => /^investimento$/i.test(lbl(r)))
  const investRowIdx = totalInvestIdx >= 0 ? totalInvestIdx : (metaStart >= 0 ? metaStart : 0)

  const colIndices = findBestColumns(rows, dateRowIdx, investRowIdx, 6)
  if (colIndices.length === 0) return empty

  const periodFn = (colIdx: number) => {
    const dateStr   = rows[dateRowIdx]?.[colIdx] ?? ''
    const year      = rows[yearRowIdx]?.[colIdx] ?? ''
    const monthName = rows[monthRowIdx]?.[colIdx] ?? ''
    return monthName && year ? `${monthName}/${year}` : (dateStr || `col${colIdx}`)
  }

  function buildMap(startIdx: number, endIdx: number): Record<string, number> {
    const map: Record<string, number> = {}
    const end = endIdx >= 0 ? endIdx : rows.length
    for (let i = startIdx; i < end; i++) {
      const label = lbl(rows[i])
      if (!label) continue
      if (MONTHLY_METRICS[label] !== undefined && map[label] === undefined) {
        map[label] = i
      }
    }
    return map
  }

  if (!hasChannels) {
    // Sem seções de canal: scan completo
    return {
      total: buildMetricsFromMap(buildMap(0, -1), rows, colIndices, periodFn),
      meta: [],
      google: [],
    }
  }

  // Total: linhas antes de "Investimento Meta" (ou antes de "Investimento Google" se não tiver Meta)
  const totalEnd = metaStart >= 0 ? metaStart : (googleStart >= 0 ? googleStart : rows.length)
  const totalMap = buildMap(0, totalEnd)
  // Garante que investimento total está no mapa (pode estar antes do Indicadores V4)
  if (totalInvestIdx >= 0 && totalMap['investimento'] === undefined) {
    totalMap['investimento'] = totalInvestIdx
  }

  // Meta: de "Investimento Meta" até "Investimento Google" (ou fim)
  const metaMap: Record<string, number> = {}
  if (metaStart >= 0) {
    const metaEnd = googleStart >= 0 ? googleStart : rows.length
    metaMap['investimento'] = metaStart  // "Investimento Meta" row IS the investment
    Object.assign(metaMap, buildMap(metaStart + 1, metaEnd))
  }

  // Google: de "Investimento Google" até fim
  const googleMap: Record<string, number> = {}
  if (googleStart >= 0) {
    googleMap['investimento'] = googleStart  // "Investimento Google" row IS the investment
    Object.assign(googleMap, buildMap(googleStart + 1, rows.length))
  }

  return {
    total:  buildMetricsFromMap(totalMap,  rows, colIndices, periodFn),
    meta:   buildMetricsFromMap(metaMap,   rows, colIndices, periodFn),
    google: buildMetricsFromMap(googleMap, rows, colIndices, periodFn),
  }
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

  // Só escaneia linhas antes de "Investimento Meta/Google" para pegar total correto
  const metaStartIdx   = rows.findIndex(r => /investimento\s+meta/i.test(labelCol(r)))
  const googleStartIdx = rows.findIndex(r => /investimento\s+google/i.test(labelCol(r)))
  const scanEnd = metaStartIdx >= 0 ? metaStartIdx : (googleStartIdx >= 0 ? googleStartIdx : rows.length)

  const metricRowMap: Record<string, number> = {}
  for (let i = 0; i < scanEnd; i++) {
    const label = labelCol(rows[i])
    if (label && metricRowMap[label] === undefined) metricRowMap[label] = i
  }

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
        ctr: fmtPercent,
        cpm: fmtCurrency,
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
