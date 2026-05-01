import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export const httpClient = axios.create({
  baseURL,
  timeout: 15000,
})

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const currentToken = useAuthStore.getState().token
      if (currentToken) {
        useAuthStore.getState().clearSession()
      }
    }

    return Promise.reject(error)
  },
)
