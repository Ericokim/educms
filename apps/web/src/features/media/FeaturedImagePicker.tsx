import { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import type { MediaItem } from '@educms/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { mediaUrl } from '@/lib/api'
import { useMediaList } from './hooks'

/**
 * Picks an image from the media library for a post's featured image.
 * Stores only the media id; the preview is looked up from the list cache.
 */
export function FeaturedImagePicker({
  value,
  onChange,
}: {
  value: number | null | undefined
  onChange: (id: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const media = useMediaList(page)

  const images = media.data?.items.filter((item) => item.mimeType.startsWith('image/')) ?? []
  const selected = media.data?.items.find((item) => item.id === value)

  function pick(item: MediaItem) {
    onChange(item.id)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-lg border">
          {selected ? (
            <img
              src={mediaUrl(selected.url)}
              alt={selected.altText ?? selected.originalName}
              className="max-h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Image #{value}
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 size-7"
            aria-label="Remove featured image"
            onClick={() => onChange(null)}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
          <ImageIcon aria-hidden="true" /> Choose image
        </Button>
      )}
      {value && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Change image
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a featured image</DialogTitle>
            <DialogDescription>Images from the media library</DialogDescription>
          </DialogHeader>
          {media.isPending ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : media.isError ? (
            <ErrorState
              message="The media library couldn’t be loaded."
              onRetry={() => media.refetch()}
            />
          ) : images.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No images yet"
              description="Upload images on the Media page first."
            />
          ) : (
            <>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => pick(item)}
                      className="block aspect-square w-full overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Use ${item.originalName} as featured image`}
                    >
                      <img
                        src={mediaUrl(item.url)}
                        alt={item.altText ?? item.originalName}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              {media.data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= media.data.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
