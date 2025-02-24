import { createContext, useContext } from 'react'

const initialState = {
  loading: false,
  error: null,
  user: null
}

const Context = createContext(initialState)

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <Context.Provider value={initialState}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
