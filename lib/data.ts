import { Client, ClientSummary, ClientDetail, ClientStatus, StaleDataInfo } from './types'
import { readSheet, readTransposedMonthly, readTransposedWeekly, daysAgo } from './sheets'
import { SHEET_NAMES, STALE_THRESHOLD_DAYS } from './config'

function getLastDate(rows: Record<string, string>[]): string | null {
  if (rows.length === 0) return null
  // Try common date column names
  const dateCol = Object.keys(rows[0]).find(k => /^day$|^dia$|^data/i.test(k.trim()))
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
  const [monthlyMetrics, metaRows, googleRows] = await Promise.all([
    readTransposedMonthly(client.sheetId, SHEET_NAMES.MONTHLY),
    readSheet(client.sheetId, SHEET_NAMES.META_RAW),
    readSheet(client.sheetId, SHEET_NAMES.GOOGLE_RAW),
  ])

  const metaLastDate = getLastDate(metaRows)
  const googleLastDate = getLastDate(googleRows)

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
  const [summary, monthlyHistory, weeklyHistory] = await Promise.all([
    getClientSummary(client),
    readTransposedMonthly(client.sheetId, SHEET_NAMES.MONTHLY),
    readTransposedWeekly(client.sheetId, SHEET_NAMES.WEEKLY),
  ])

  return { ...summary, monthlyHistory, weeklyHistory }
}
