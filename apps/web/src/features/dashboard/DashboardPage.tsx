import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user?.firstName ?? user?.username}
        </h1>
        <p className="text-muted-foreground">
          You are signed in as <span className="capitalize">{user?.role}</span>.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Real statistics, recent posts, and pending comments arrive in Phase 5. Use the
            navigation above to explore the sections available to your role.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
