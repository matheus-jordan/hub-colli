import Anthropic from '@anthropic-ai/sdk'
import { ClientDetail, AIAnalysis } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeClient(detail: ClientDetail): Promise<AIAnalysis> {
  const { client: c, currentMonth, previousMonth, staleData, weeklyHistory } = detail

  const staleWarnings = []
  if (staleData.meta.isStale) staleWarnings.push(`Meta Ads: último dado é de ${staleData.meta.daysOld} dias atrás (${staleData.meta.lastDate})`)
  if (staleData.google.isStale) staleWarnings.push(`Google Ads: último dado é de ${staleData.google.daysOld} dias atrás (${staleData.google.lastDate})`)

  const prompt = `Você é um especialista em tráfego pago e performance de marketing digital. Analise os dados abaixo do cliente "${c.name}" e gere um diagnóstico objetivo.

## Dados do mês atual
${currentMonth ? `
- Investimento: ${currentMonth.investment.formatted}
- Leads: ${currentMonth.leads.formatted}
- MQLs: ${currentMonth.mqls.formatted}
- SQLs: ${currentMonth.sqls.formatted}
- Vendas: ${currentMonth.sales.formatted}
- Faturamento: ${currentMonth.revenue.formatted}
- CPA: ${currentMonth.cpa.formatted}
- ROAS: ${currentMonth.roas.formatted}
- CPL: ${currentMonth.cpl.formatted}
` : 'Dados não disponíveis'}

## Comparativo mês anterior
${previousMonth ? `
- Investimento anterior: ${previousMonth.investment.formatted}
- Leads anterior: ${previousMonth.leads.formatted}
- ROAS anterior: ${previousMonth.roas.formatted}
- CPA anterior: ${previousMonth.cpa.formatted}
` : 'Não disponível'}

## Últimas semanas
${weeklyHistory.length > 0 ? weeklyHistory.slice(0, 3).map(w =>
  `Semana ${w.period}: Invest ${w.investment.formatted} | Leads ${w.leads.formatted} | ROAS ${w.roas.formatted}`
).join('\n') : 'Não disponível'}

## Alertas de dados
${staleWarnings.length > 0 ? staleWarnings.join('\n') : 'Dados atualizados'}

Responda APENAS em JSON válido com esta estrutura exata:
{
  "summary": "resumo executivo em 2 frases",
  "highlights": ["ponto positivo 1", "ponto positivo 2"],
  "warnings": ["alerta 1", "alerta 2"],
  "recommendations": ["ação recomendada 1", "ação recomendada 2", "ação recomendada 3"]
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
    return {
      summary: parsed.summary ?? '',
      highlights: parsed.highlights ?? [],
      warnings: parsed.warnings ?? [],
      recommendations: parsed.recommendations ?? [],
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      summary: text,
      highlights: [],
      warnings: staleWarnings,
      recommendations: [],
      generatedAt: new Date().toISOString(),
    }
  }
}
