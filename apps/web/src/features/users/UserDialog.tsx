import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import {
  ALL_ROLES,
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
  type Role,
  type User,
} from '@educms/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type UserFormValues = CreateUserValues

const EMPTY_FORM: UserFormValues = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'author',
}

const createResolver = zodResolver(createUserSchema) as Resolver<UserFormValues>
const updateResolver = zodResolver(updateUserSchema) as unknown as Resolver<UserFormValues>

export function UserDialog({
  open,
  editing,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  open: boolean
  editing: User | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: UserFormValues) => Promise<void>
}) {
  const isEdit = editing !== null

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: isEdit ? updateResolver : createResolver,
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      editing
        ? {
            username: editing.username,
            email: editing.email,
            password: '',
            firstName: editing.firstName ?? '',
            lastName: editing.lastName ?? '',
            role: editing.role,
          }
        : EMPTY_FORM
    )
  }, [open, editing, reset])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${editing.username}` : 'New user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update account details. Leave the password empty to keep it unchanged.'
              : 'Create an account and assign a role.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="user-first">First name</FieldLabel>
              <Input id="user-first" {...register('firstName')} />
              {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor="user-last">Last name</FieldLabel>
              <Input id="user-last" {...register('lastName')} />
              {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
            </Field>
          </div>
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="user-username">Username</FieldLabel>
            <Input id="user-username" autoComplete="off" {...register('username')} />
            {errors.username && <FieldError>{errors.username.message}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="user-email">Email</FieldLabel>
            <Input id="user-email" type="email" autoComplete="off" {...register('email')} />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="user-password">
              {isEdit ? 'New password' : 'Password'}
            </FieldLabel>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {isEdit && <FieldDescription>Leave empty to keep the current password.</FieldDescription>}
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </Field>
          {!isEdit && (
            <Field>
              <FieldLabel htmlFor="user-role">Role</FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as Role)}
                  >
                    <SelectTrigger id="user-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((role) => (
                        <SelectItem key={role} value={role} className="capitalize">
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
