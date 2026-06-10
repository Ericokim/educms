import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { useAuth } from './auth-context'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, loadFailed, retryLoad } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner label="Checking your session…" />
  }

  // A transient server/network failure should not log the user out.
  if (loadFailed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-xl font-semibold">Can’t reach the server</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your session couldn’t be loaded. Check your connection and try again.
        </p>
        <Button onClick={retryLoad}>Try again</Button>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
