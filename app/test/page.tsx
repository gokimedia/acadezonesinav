'use client'

import { useState, useEffect } from 'react'
import { testSupabaseConnection } from '@/lib/supabase-test'

export default function TestPage() {
  const [status, setStatus] = useState<string>('Testing connection...')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await testSupabaseConnection()
        setStatus(result.success ? 'Connection successful!' : `Connection failed: ${result.error}`)
      } catch (error) {
        setStatus(`Error: ${error.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Supabase Connection Test</h1>
      <p>{status}</p>
    </div>
  )
}
