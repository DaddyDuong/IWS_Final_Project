import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const authStoreConfig = (set) => ({
  token: null,
  setToken: (token) => set({ token }),
  clearAuth: () => set({ token: null }),
})

export const useAuthStore = create(
  persist(authStoreConfig, {
    name: 'laptop-retail-auth',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ token: state.token }),
  }),
)
