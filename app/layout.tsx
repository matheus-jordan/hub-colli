import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from 'next/font/google'
import './globals.css'

const ibmPlex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ibm-plex' })
const ibmPlexCond = IBM_Plex_Sans_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-ibm-cond' })

export const metadata: Metadata = {
  title: 'Hub Colli · V4 Command Center',
  description: 'Painel de gestão de clientes Colli',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${ibmPlex.variable} ${ibmPlexCond.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
