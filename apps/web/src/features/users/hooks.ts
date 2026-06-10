import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CreateUserValues, Role, UpdateUserValues } from '@educms/shared'
import { getApiErrorMessage } from '@/lib/api'
import * as usersApi from './api'

export function useUsers(filters: usersApi.UserListFilters) {
  return useQuery({
    queryKey: ['users', 'list', filters],
    queryFn: () => usersApi.fetchUsers(filters),
    staleTime: 30 * 1000,
  })
}

function useUserMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['analytics'] })
      toast.success(successMessage)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUserMutations() {
  return {
    create: useUserMutation(
      (values: CreateUserValues) => usersApi.createUser(values),
      'User created'
    ),
    update: useUserMutation(
      ({ id, values }: { id: number; values: UpdateUserValues }) =>
        usersApi.updateUser(id, values),
      'User updated'
    ),
    changeRole: useUserMutation(
      ({ id, role }: { id: number; role: Role }) => usersApi.changeRole(id, role),
      'Role updated'
    ),
    deactivate: useUserMutation(
      (id: number) => usersApi.deactivateUser(id),
      'User deactivated'
    ),
    activate: useUserMutation((id: number) => usersApi.activateUser(id), 'User activated'),
  }
}
