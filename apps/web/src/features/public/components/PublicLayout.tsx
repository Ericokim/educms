import { Suspense } from 'react'
import { GraduationCap, Search } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Articles', to: '/articles' },
  { label: 'Categories', to: '/categories' },
]

export function PublicLayout() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="EduCMS home">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">EduCMS</span>
          </Link>
          <nav aria-label="Public" className="flex flex-1 items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'text-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/search"
              aria-label="Search"
              className={({ isActive }) =>
                cn(
                  'rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'text-foreground'
                )
              }
            >
              <Search className="size-4" aria-hidden="true" />
            </NavLink>
          </nav>
          <Button asChild variant={isAuthenticated ? 'default' : 'outline'} size="sm">
            <Link to={isAuthenticated ? '/admin' : '/login'}>
              {isAuthenticated ? 'Dashboard' : 'Sign in'}
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4" aria-hidden="true" />
            <span>EduCMS — educational content for everyone</span>
          </div>
          <nav aria-label="Footer" className="flex gap-4">
            <Link to="/articles" className="hover:text-foreground">
              Articles
            </Link>
            <Link to="/categories" className="hover:text-foreground">
              Categories
            </Link>
            <Link to="/search" className="hover:text-foreground">
              Search
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Staff sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
