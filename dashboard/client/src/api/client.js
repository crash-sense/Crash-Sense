import axios from 'axios'

// Create one axios instance with base URL already set
// Every React component imports THIS instead of raw axios
// So if your backend URL changes — you change it in ONE place only
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds — if server doesn't respond, stop waiting
})

export default apiClient