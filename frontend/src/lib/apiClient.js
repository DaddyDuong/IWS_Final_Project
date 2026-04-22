import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (!token) {
    return config
  }

  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  }
})
