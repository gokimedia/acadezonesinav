import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from './providers'

// Google Fonts ayarlarında display: 'swap' kullanmak, font yüklenmesi tamamlanana kadar
// sistemin yedek fontları kullanmasını sağlar, bu da daha iyi bir kullanıcı deneyimi sunar.
const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Acadezone Sınav Sistemi',
  description: 'Acadezone online sınav yönetim sistemi',
  // Diğer meta veriler (örneğin, meta etiketleri, Open Graph vb.) eklenebilir
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* 
          Skip Link (İçeriğe atla) 
          Erişilebilirliği artırmak için ekran okuyucu kullanıcılarına ve klavye navigasyonuna
          “içeriğe direkt geçiş” imkanı sunan bu link, focus aldığında görünür hale gelir.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white p-2 text-indigo-600 rounded shadow-sm"
        >
          İçeriğe geç
        </a>

        <Providers>
          {/* Ana içerik kısmını <main> içinde tanımlayarak semantik yapıyı güçlendiriyoruz */}
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
