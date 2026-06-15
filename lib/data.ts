import { Client, ClientSummary, ClientDetail, ClientStatus, StaleDataInfo } from './types'
import { readTransposedMonthly, readTransposedMonthlyChannels, readTransposedWeekly, readMediaPace, daysAgo } from './sheets'
import { SHEET_NAMES, STALE_THRESHOLD_DAYS } from './config'

// Usa o período mais recente do mensal como indicador de atualização
function periodToLastDate(period: string): string | null {
  if (!period) return null
  const MONTHS: Record<string, number> = {
    janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
    julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
  }
  const parts = period.split('/')
  // "maio/2026"
  if (parts.length === 2) {
    const monthNum = MONTHS[parts[0].toLowerCase()]
    if (monthNum !== undefined) {
      return new Date(parseInt(parts[1]), monthNum + 1, 0).toISOString().slice(0, 10)
    }
  }
  // "01/05/2026"
  if (parts.length === 3) {
    const month = parseInt(parts[1]) - 1
    const year  = parseInt(parts[2])
    if (!isNaN(month) && !isNaN(year)) {
      return new Date(year, month + 1, 0).toISOString().slice(0, 10)
    }
  }
  return null
}

function calcStatus(stale: StaleDataInfo, roasValue: number | null): ClientStatus {
  if (stale.meta.isStale || stale.google.isStale) return 'danger'
  if (roasValue === null) return 'unknown'
  if (roasValue < 1) return 'danger'
  if (roasValue < 1.5) return 'warning'
  return 'ok'
}

export async function getClientSummary(client: Client, selectedPeriod?: string): Promise<ClientSummary> {
  const [monthlyMetrics, mediaPace] = await Promise.all([
    readTransposedMonthly(client.sheetId, SHEET_NAMES.MONTHLY),
    readMediaPace(client.sheetId, SHEET_NAMES.PROJECTION),
  ])

  // Usa a aba mensal como fonte de atualização para ambos os canais
  const lastDate = periodToLastDate(monthlyMetrics[0]?.period ?? '')
  const staleData: StaleDataInfo = {
    meta: {
      lastDate,
      daysOld: daysAgo(lastDate),
      isStale: daysAgo(lastDate) > STALE_THRESHOLD_DAYS,
    },
    google: {
      lastDate,
      daysOld: daysAgo(lastDate),
      isStale: daysAgo(lastDate) > STALE_THRESHOLD_DAYS,
    },
  }

  const availablePeriods = monthlyMetrics.map(m => m.period)
  const selectedIdx = selectedPeriod
    ? monthlyMetrics.findIndex(m => m.period === selectedPeriod)
    : -1
  const effectiveIdx = selectedIdx >= 0 ? selectedIdx : 0

  const currentMonth  = monthlyMetrics[effectiveIdx]     ?? null
  const previousMonth = monthlyMetrics[effectiveIdx + 1] ?? null
  const status = calcStatus(staleData, currentMonth?.roas.value ?? null)

  return { client, status, currentMonth, previousMonth, staleData, mediaPace, lastUpdated: new Date().toISOString(), availablePeriods }
}

export async function getClientDetail(client: Client, selectedPeriod?: string): Promise<ClientDetail> {
  const [summary, channels, weeklyHistory] = await Promise.all([
    getClientSummary(client, selectedPeriod),
    readTransposedMonthlyChannels(client.sheetId, SHEET_NAMES.MONTHLY),
    readTransposedWeekly(client.sheetId, SHEET_NAMES.WEEKLY),
  ])

  return {
    ...summary,
    monthlyHistory: channels.total,
    metaHistory:    channels.meta,
    googleHistory:  channels.google,
    weeklyHistory,
  }
}
