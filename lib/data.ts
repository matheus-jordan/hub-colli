import { Client, ClientSummary, ClientDetail, ClientStatus, StaleDataInfo } from './types'
import { readSheet, parseMonthlyRow, parseWeeklyRow, daysAgo } from './sheets'
import { SHEET_NAMES, STALE_THRESHOLD_DAYS } from './config'

function getLastDate(rows: Record<string, string>[], ...colVariants: string[]): string | null {
  const dateCol = rows[0]
    ? Object.keys(rows[0]).find(k => colVariants.some(v => k.toLowerCase().includes(v.toLowerCase())))
    : null
  if (!dateCol) return null
  const dates = rows.map(r => r[dateCol]).filter(Boolean)
  return dates.length ? dates[dates.length - 1] : null
}

function calcStatus(stale: StaleDataInfo, roasValue: number | null): ClientStatus {
  if (stale.meta.isStale || stale.google.isStale) return 'danger'
  if (roasValue === null) return 'unknown'
  if (roasValue < 1) return 'danger'
  if (roasValue < 1.5) return 'warning'
  return 'ok'
}

export async function getClientSummary(client: Client): Promise<ClientSummary> {
  const [monthlyRows, metaRows, googleRows] = await Promise.all([
    readSheet(client.sheetId, SHEET_NAMES.MONTHLY),
    readSheet(client.sheetId, SHEET_NAMES.META_RAW),
    readSheet(client.sheetId, SHEET_NAMES.GOOGLE_RAW),
  ])

  const monthlyMetrics = monthlyRows
    .filter(r => Object.values(r).some(v => v.trim()))
    .map(parseMonthlyRow)
    .filter(m => m.period)
    .reverse()

  const metaLastDate = getLastDate(metaRows, 'day', 'dia', 'data')
  const googleLastDate = getLastDate(googleRows, 'day', 'dia', 'data')

  const staleData: StaleDataInfo = {
    meta: {
      lastDate: metaLastDate,
      daysOld: daysAgo(metaLastDate),
      isStale: daysAgo(metaLastDate) > STALE_THRESHOLD_DAYS,
    },
    google: {
      lastDate: googleLastDate,
      daysOld: daysAgo(googleLastDate),
      isStale: daysAgo(googleLastDate) > STALE_THRESHOLD_DAYS,
    },
  }

  const currentMonth = monthlyMetrics[0] ?? null
  const previousMonth = monthlyMetrics[1] ?? null
  const status = calcStatus(staleData, currentMonth?.roas.value ?? null)

  return { client, status, currentMonth, previousMonth, staleData, lastUpdated: new Date().toISOString() }
}

export async function getClientDetail(client: Client): Promise<ClientDetail> {
  const summary = await getClientSummary(client)

  const [monthlyRows, weeklyRows] = await Promise.all([
    readSheet(client.sheetId, SHEET_NAMES.MONTHLY),
    readSheet(client.sheetId, SHEET_NAMES.WEEKLY),
  ])

  const monthlyHistory = monthlyRows
    .filter(r => Object.values(r).some(v => v.trim()))
    .map(parseMonthlyRow)
    .filter(m => m.period)
    .reverse()
    .slice(0, 6)

  const weeklyHistory = weeklyRows
    .filter(r => Object.values(r).some(v => v.trim()))
    .map(parseWeeklyRow)
    .filter(w => w.period)
    .reverse()
    .slice(0, 8)

  return { ...summary, monthlyHistory, weeklyHistory }
}
