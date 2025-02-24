// Mock user hook that always returns null
export const useUser = () => {
  return {
    user: null,
    loading: false,
    error: null
  }
}
