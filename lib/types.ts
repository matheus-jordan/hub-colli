export type ClientStatus = 'ok' | 'warning' | 'danger' | 'unknown'

export interface ClientLinks {
  growthPack?: string
  metaAds?: string
  googleAds?: string
  drive?: string
  crm?: string
  landingPage?: string
  accessSheet?: string
  backupContacts?: string
  [key: string]: string | undefined
}

export interface Client {
  id: string
  name: string
  sheetId: string
  color: string
  contact?: string
  since?: string
  links: ClientLinks
}

export interface MetricValue {
  value: number | null
  formatted: string
}

export interface MonthlyMetrics {
  period: string
  investment: MetricValue
  leads: MetricValue
  mqls: MetricValue
  sqls: MetricValue
  sales: MetricValue
  revenue: MetricValue
  cpa: MetricValue
  roas: MetricValue
  cpl: MetricValue
}

export interface WeeklyMetrics {
  period: string
  investment: MetricValue
  leads: MetricValue
  mqls: MetricValue
  roas: MetricValue
  cpa: MetricValue
}

export interface StaleChannel {
  lastDate: string | null
  daysOld: number
  isStale: boolean
}

export interface StaleDataInfo {
  meta: StaleChannel
  google: StaleChannel
}

export interface ClientSummary {
  client: Client
  status: ClientStatus
  currentMonth: MonthlyMetrics | null
  previousMonth: MonthlyMetrics | null
  staleData: StaleDataInfo
  lastUpdated: string
  availablePeriods: string[]
}

export interface ClientDetail extends ClientSummary {
  monthlyHistory: MonthlyMetrics[]
  weeklyHistory: WeeklyMetrics[]
  metaHistory: MonthlyMetrics[]
  googleHistory: MonthlyMetrics[]
}

export interface Task {
  id: string
  clientId: string
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'done'
  createdAt: string
  dueDate?: string
}

export interface HistoryEntry {
  id: string
  clientId: string
  date: string
  type: 'meeting' | 'call' | 'message' | 'note'
  summary: string
  createdAt: string
}

export interface AIAnalysis {
  summary: string
  highlights: string[]
  warnings: string[]
  recommendations: string[]
  generatedAt: string
}

export interface ConstraintTask {
  id: string
  title: string
  done: boolean
  uploadedToEkyte: boolean
}

export interface Constraint {
  id: string
  clientId: string
  title: string
  context: string
  status: 'active' | 'resolved'
  deadline: string | null
  linkedEkyteTaskIds: string[]
  tasks: ConstraintTask[]
  createdAt: string
  resolvedAt: string | null
}

export interface EkyteTask {
  id: string
  title: string
  statusCode: number
  statusLabel: string
  projectName: string
  dueDate?: string
}
