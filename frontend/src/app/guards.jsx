import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useMeQuery } from '../hooks/useDomainData'

export function RequireAuth() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function RequireManager() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const meQuery = useMeQuery()

  useEffect(() => {
    if (!user && meQuery.data) {
      setUser(meQuery.data)
    }
  }, [user, meQuery.data, setUser])

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  if (!user && meQuery.isLoading) {
    return <p>Loading manager access...</p>
  }

  if ((user ?? meQuery.data)?.role !== 'manager') {
    return <Navigate to="/account" replace />
  }

  return <Outlet />
}
