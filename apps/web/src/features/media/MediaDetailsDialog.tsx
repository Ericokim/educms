import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { updateMediaSchema, type MediaItem, type UpdateMediaValues } from '@educms/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { mediaUrl } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { useDeleteMedia, useUpdateMedia } from './hooks'

export function MediaDetailsDialog({
  item,
  canManage,
  onClose,
}: {
  item: MediaItem | null
  canManage: boolean
  onClose: () => void
}) {
  const updateMutation = useUpdateMedia()
  const deleteMutation = useDeleteMedia()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMediaValues>({
    resolver: zodResolver(updateMediaSchema),
    defaultValues: { altText: '', caption: '' },
  })

  useEffect(() => {
    if (item) reset({ altText: item.altText ?? '', caption: item.caption ?? '' })
  }, [item, reset])

  async function onSubmit(values: UpdateMediaValues) {
    if (!item) return
    try {
      await updateMutation.mutateAsync({ id: item.id, values })
      onClose()
    } catch {
      // Surfaced by the mutation's onError toast.
    }
  }

  return (
    <>
      <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {item && (
            <>
              <DialogHeader>
                <DialogTitle className="break-all">{item.originalName}</DialogTitle>
                <DialogDescription>
                  {(item.sizeBytes / 1024).toFixed(0)} KB · {item.mimeType} · uploaded by{' '}
                  {item.uploadedBy ?? 'unknown'} on {formatDateTime(item.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-64 overflow-hidden rounded-lg border bg-muted/30">
                {item.mimeType.startsWith('image/') ? (
                  <img
                    src={mediaUrl(item.url)}
                    alt={item.altText ?? item.originalName}
                    className="mx-auto max-h-64 object-contain"
                  />
                ) : (
                  <a
                    href={mediaUrl(item.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-6 text-center text-sm underline"
                  >
                    Open PDF in a new tab
                  </a>
                )}
              </div>

              {canManage ? (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <Field data-invalid={!!errors.altText}>
                    <FieldLabel htmlFor="media-alt">Alt text</FieldLabel>
                    <Input
                      id="media-alt"
                      placeholder="Describe the image for screen readers"
                      {...register('altText')}
                    />
                    {errors.altText && <FieldError>{errors.altText.message}</FieldError>}
                  </Field>
                  <Field data-invalid={!!errors.caption}>
                    <FieldLabel htmlFor="media-caption">Caption</FieldLabel>
                    <Textarea id="media-caption" rows={2} {...register('caption')} />
                    {errors.caption && <FieldError>{errors.caption.message}</FieldError>}
                  </Field>
                  <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving…' : 'Save details'}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {item.altText ? `Alt text: ${item.altText}` : 'No alt text set.'}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this file?"
        description="The file will be removed permanently. Posts using it as a featured image will lose it."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (item) {
            deleteMutation.mutate(item.id, { onSuccess: onClose })
          }
          setConfirmDelete(false)
        }}
      />
    </>
  )
}
