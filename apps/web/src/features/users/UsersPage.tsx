import { useState } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, UserPlus, Users } from 'lucide-react'
import { ALL_ROLES, type Role, type User } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { useAuth } from '@/features/auth/auth-context'
import { formatDate } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { UserDialog, type UserFormValues } from './UserDialog'
import { useUserMutations, useUsers } from './hooks'

const PAGE_SIZE = 10

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [role, setRole] = useState<string>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const [roleTarget, setRoleTarget] = useState<{ user: User; role: Role } | null>(null)

  const filters = {
    page,
    limit: PAGE_SIZE,
    role: role === 'all' ? undefined : role,
    search: debouncedSearch || undefined,
  }
  const users = useUsers(filters)
  const { create, update, changeRole, deactivate, activate } = useUserMutations()

  const pagination = users.data?.pagination
  if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
    setPage(pagination.totalPages)
  }

  async function handleSubmit(values: UserFormValues) {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values })
      } else {
        await create.mutateAsync(values)
      }
      setDialogOpen(false)
      setEditing(null)
    } catch {
      // Surfaced by the mutation's onError toast; keep the dialog open.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage accounts and roles</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <UserPlus aria-hidden="true" /> New user
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search username or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full sm:w-64"
          aria-label="Search users"
        />
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {users.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : users.isError ? (
        <ErrorState message="The users couldn’t be loaded." onRetry={() => users.refetch()} />
      ) : users.data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try adjusting your search or role filter."
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.items.map((user) => {
                  const isSelf = user.id === currentUser?.id
                  const displayName =
                    [user.firstName, user.lastName].filter(Boolean).join(' ') || '—'
                  return (
                    <TableRow key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                      <TableCell>
                        <p className="font-medium">
                          {user.username}
                          {isSelf && (
                            <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{displayName}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${user.username}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditing(user)
                                setDialogOpen(true)
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            {!isSelf && (
                              <>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>Change role</DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                      {ALL_ROLES.filter((r) => r !== user.role).map((r) => (
                                        <DropdownMenuItem
                                          key={r}
                                          className="capitalize"
                                          onSelect={() =>
                                            setRoleTarget({ user, role: r as Role })
                                          }
                                        >
                                          {r}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                {user.isActive ? (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => setDeactivateTarget(user)}
                                  >
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onSelect={() => activate.mutate(user.id)}>
                                    Activate
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft aria-hidden="true" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <UserDialog
        open={dialogOpen}
        editing={editing}
        isSubmitting={create.isPending || update.isPending}
        onClose={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={roleTarget !== null}
        onOpenChange={(open) => !open && setRoleTarget(null)}
        title={`Make ${roleTarget?.user.username} ${roleTarget?.role === 'admin' ? 'an' : 'a'} ${roleTarget?.role}?`}
        description={
          roleTarget?.role === 'admin'
            ? 'Administrators have full access to all content, users, and settings.'
            : `Their permissions will change immediately, including any active sessions.`
        }
        confirmLabel="Change role"
        onConfirm={() => {
          if (roleTarget) changeRole.mutate({ id: roleTarget.user.id, role: roleTarget.role })
          setRoleTarget(null)
        }}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title={`Deactivate ${deactivateTarget?.username}?`}
        description="They will be logged out immediately and unable to sign in until reactivated. Their content is kept."
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => {
          if (deactivateTarget) deactivate.mutate(deactivateTarget.id)
          setDeactivateTarget(null)
        }}
      />
    </div>
  )
}
