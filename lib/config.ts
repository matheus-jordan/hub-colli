import { Client } from './types'

export const CLIENTS: Client[] = [
  {
    id: 'aya-cleaning',
    name: 'Aya Cleaning',
    sheetId: '18pRCET-y0Fsa842qg2c2-NjFx9y0NnDdZD9scFjm_bw',
    color: '#f97316',
    contact: 'Thiago',
    since: 'nov 2025',
    links: {
      growthPack: 'https://docs.google.com/spreadsheets/d/18pRCET-y0Fsa842qg2c2-NjFx9y0NnDdZD9scFjm_bw',
    },
  },
  {
    id: 'cliente-2',
    name: 'Destra Consultoria', // confirmar nome
    sheetId: '1ou9JXRWFAUHisOgDmI6rE_2k6YUKaPu5YI3tpoGgV7A',
    color: '#3b82f6',
    links: {
      growthPack: 'https://docs.google.com/spreadsheets/d/1ou9JXRWFAUHisOgDmI6rE_2k6YUKaPu5YI3tpoGgV7A',
    },
  },
  {
    id: 'meca',
    name: 'Meca Automatizadores',
    sheetId: '17kt3sTvXVJmlIP3kL02j_-RdwSNoizIhx53xNMBGU1E',
    color: '#8b5cf6',
    links: {
      growthPack: 'https://docs.google.com/spreadsheets/d/17kt3sTvXVJmlIP3kL02j_-RdwSNoizIhx53xNMBGU1E',
    },
    sheetNames: {
      MONTHLY: '5.0 Acompanhamento Mensal',
      WEEKLY: '5.1 Acompanhamento Semanal',
    },
  },
  {
    id: 'nuveto',
    name: 'Nuveto Comunicações',
    sheetId: '12Z9WNmOkHHulA5QgKRiSLP2njOYMTqulXNUGgXq3CD8',
    color: '#06b6d4',
    links: {
      growthPack: 'https://docs.google.com/spreadsheets/d/12Z9WNmOkHHulA5QgKRiSLP2njOYMTqulXNUGgXq3CD8',
    },
  },
  {
    id: 'orion',
    name: 'Orion Importadora',
    sheetId: '1FM8aGzASkVMHfxUGQgEbnGSJHDiej3Sa1uYUg5gAjno',
    color: '#10b981',
    links: {
      growthPack: 'https://docs.google.com/spreadsheets/d/1FM8aGzASkVMHfxUGQgEbnGSJHDiej3Sa1uYUg5gAjno',
    },
  },
  {
    id: 'sol-interiors',
    name: 'Sol Interiors',
    sheetId: '1FdXD19caVEiEJxmIrDX4-stAhe18ku-bBxKxAl6E9u4',
    color: '#f59e0b',
    links: {
      growthPack: 'https://docs.google.com/spreadsheets/d/1FdXD19caVEiEJxmIrDX4-stAhe18ku-bBxKxAl6E9u4',
    },
    sheetNames: {
      MONTHLY: '5.0 Acompanhamento Mensal',
      WEEKLY: '5.1 Acompanhamento Semanal',
      PROJECTION: '1.0 Projeção - Atual Q2',
    },
  },
]

export const SHEET_NAMES = {
  DAILY: '5.0 Acompanhamento Diário',
  WEEKLY: '5.2 Acompanhamento Semanal',
  MONTHLY: '5.3 Acompanhamento Mensal',
  META_RAW: 'bd Meta Ads',
  GOOGLE_RAW: 'bd Google Ads',
  LEADS_LP: 'bd Leads LP',
  PROJECTION: '2.0 Projeção / Cenários',
  ROI: '6.5 Acompanhamento de ROI',
} as const

export const STALE_THRESHOLD_DAYS = 2
