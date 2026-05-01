import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  AUTH_STORAGE_KEY,
  normalizePersistedSession,
  sanitizeSessionToken,
  sanitizeSessionUser,
} from './authSession'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({
        token: sanitizeSessionToken(token),
        user: sanitizeSessionUser(user),
      }),
      setUser: (user) => set({ user: sanitizeSessionUser(user) }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedSession(persistedState),
      }),
    },
  ),
)
