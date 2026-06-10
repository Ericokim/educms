import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/features/auth/auth-context'

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleLogout() {
    await logout()
    // Land on a clean login page: without this, ProtectedRoute records the
    // current page as the return path and the NEXT user to sign in gets sent
    // there - an access-denied page if their role can't view it.
    navigate('/login', { replace: true })
    toast.success('Logged out')
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
              <Badge variant="secondary" className="hidden capitalize sm:inline-flex">
                {user.role}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p>{displayName}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
