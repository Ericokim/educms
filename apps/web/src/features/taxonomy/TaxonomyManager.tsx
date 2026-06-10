import { useState } from 'react'
import { FolderTree, PlusCircle } from 'lucide-react'
import { useForm, type Resolver } from 'react-hook-form'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import type { TaxonomyFormSubmit } from './hooks'

export interface TaxonomyItem {
  id: number
  name: string
  slug: string
  description?: string | null
  postCount: number
}

interface TaxonomyManagerProps {
  title: string
  subtitle: string
  entityLabel: string
  hasDescription: boolean
  resolver: Resolver<TaxonomyFormSubmit>
  query: UseQueryResult<TaxonomyItem[]>
  create: UseMutationResult<unknown, Error, TaxonomyFormSubmit>
  update: UseMutationResult<unknown, Error, { id: number; values: TaxonomyFormSubmit }>
  remove: UseMutationResult<unknown, Error, number>
}

const EMPTY_FORM: TaxonomyFormSubmit = { name: '', slug: '', description: '' }

export function TaxonomyManager({
  title,
  subtitle,
  entityLabel,
  hasDescription,
  resolver,
  query,
  create,
  update,
  remove,
}: TaxonomyManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaxonomyItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyItem | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaxonomyFormSubmit>({
    resolver,
    defaultValues: EMPTY_FORM,
  })

  function openCreate() {
    setEditing(null)
    reset(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(item: TaxonomyItem) {
    setEditing(item)
    reset({ name: item.name, slug: item.slug, description: item.description ?? '' })
    setDialogOpen(true)
  }

  async function onSubmit(values: TaxonomyFormSubmit) {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values })
      } else {
        await create.mutateAsync(values)
      }
      setDialogOpen(false)
    } catch {
      // Already surfaced by the mutation's onError toast; keep the dialog
      // open so the user can correct the input (e.g. duplicate name).
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle aria-hidden="true" /> New {entityLabel}
        </Button>
      </div>

      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          message={`The ${title.toLowerCase()} couldn’t be loaded.`}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={`No ${title.toLowerCase()} yet`}
          description={`Create your first ${entityLabel} to organize content.`}
        >
          <Button variant="outline" size="sm" onClick={openCreate}>
            New {entityLabel}
          </Button>
        </EmptyState>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                {hasDescription && (
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                )}
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="w-36 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {item.slug}
                  </TableCell>
                  {hasDescription && (
                    <TableCell className="hidden md:table-cell max-w-72 truncate text-muted-foreground">
                      {item.description || '—'}
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">{item.postCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${entityLabel}` : `New ${entityLabel}`}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Update the ${entityLabel} details.`
                : `Add a new ${entityLabel} to organize content.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="taxonomy-name">Name</FieldLabel>
              <Input id="taxonomy-name" aria-invalid={!!errors.name} {...register('name')} />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.slug}>
              <FieldLabel htmlFor="taxonomy-slug">Slug</FieldLabel>
              <Input
                id="taxonomy-slug"
                placeholder="auto-generated from name"
                {...register('slug')}
              />
              <FieldDescription>Leave empty to generate from the name.</FieldDescription>
              {errors.slug && <FieldError>{errors.slug.message}</FieldError>}
            </Field>
            {hasDescription && (
              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="taxonomy-description">Description</FieldLabel>
                <Textarea id="taxonomy-description" rows={3} {...register('description')} />
                {errors.description && <FieldError>{errors.description.message}</FieldError>}
              </Field>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete “${deleteTarget?.name}”?`}
        description={
          deleteTarget && deleteTarget.postCount > 0
            ? `${deleteTarget.postCount} post(s) use this ${entityLabel}. They will be kept, but the ${entityLabel} will be removed from them.`
            : `This ${entityLabel} will be permanently deleted.`
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
