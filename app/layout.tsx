import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Hub do Account Manager',
  description: 'Painel de gestão de clientes Colli',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{children}</body>
    </html>
  )
}
