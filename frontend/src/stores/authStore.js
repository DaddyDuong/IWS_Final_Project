import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { sanitizeToken } from './authToken'

const AUTH_STORAGE_KEY = 'laptop-retail-auth'

const authStoreConfig = (set) => ({
  token: null,
  setToken: (token) => set({ token: sanitizeToken(token) }),
  clearAuth: () => set({ token: null }),
})

function mergeAuthState(persistedState, currentState) {
  const persistedToken = persistedState?.token
  const token = sanitizeToken(persistedToken)

  if (persistedToken && !token) {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // no-op: storage can be unavailable in private contexts
    }
  }

  return {
    ...currentState,
    token,
  }
}

export const useAuthStore = create(
  persist(authStoreConfig, {
    name: AUTH_STORAGE_KEY,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ token: state.token }),
    merge: mergeAuthState,
  }),
)
