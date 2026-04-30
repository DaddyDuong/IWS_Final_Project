import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { fetchProfile } from '../lib/customerApi'
import { useAuthStore } from '../stores/authStore'

export function RequireManager() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
  })

  if (profileQuery.isLoading) {
    return <p role="status" aria-live="polite">Checking manager permissions...</p>
  }

  if (profileQuery.isError || profileQuery.data?.role !== 'manager') {
    return <Navigate to="/profile" replace state={{ from: location, message: 'Manager access required.' }} />
  }

  return <Outlet />
}
