import { Link } from 'react-router-dom'
import type { Role } from '@educms/shared'
import { Button } from '@/components/ui/button'
import { useAuth } from './auth-context'

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground">
          You don’t have permission to view this page.
        </p>
        <Button asChild variant="outline">
          <Link to="/admin">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
