import { ShieldAlert } from 'lucide-react'
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
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="size-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
        <p className="max-w-md text-muted-foreground">
          Your current role{user ? (
            <>
              , <span className="font-medium capitalize text-foreground">{user.role}</span>,
            </>
          ) : null}{' '}
          does not allow access to this admin section. You can return to your dashboard or
          browse published content.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/admin">Back to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Browse public site</Link>
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
