import axios from 'axios'

// Iisang axios instance para sa buong app
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Kunin ang { message } galing sa server para maipakita sa user
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    // Mongoose validation: { message: "Validation failed", errors: [...] }
    if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join('. ')
    return data?.message || error.message
  }
  return 'Something went wrong'
}

export default api
