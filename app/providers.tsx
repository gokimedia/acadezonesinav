'use client'

import AuthProvider from '@/components/providers/supabase-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
