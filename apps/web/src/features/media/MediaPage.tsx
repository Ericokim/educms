import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Upload } from 'lucide-react'
import { ROLES } from '@educms/shared'
import type { MediaItem } from '@educms/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAuth } from '@/features/auth/auth-context'
import { mediaUrl } from '@/lib/api'
import { MediaDetailsDialog } from './MediaDetailsDialog'
import { useMediaList, useUploadMedia } from './hooks'

export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  if (item.mimeType.startsWith('image/')) {
    return (
      <img
        src={mediaUrl(item.url)}
        alt={item.altText ?? item.originalName}
        loading="lazy"
        className={className ?? 'size-full object-cover'}
      />
    )
  }
  return (
    <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
      <FileText className="size-8" aria-hidden="true" />
      <span className="px-2 text-center text-xs">PDF</span>
    </div>
  )
}

export function MediaPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const media = useMediaList(page)
  const upload = useUploadMedia()

  const pagination = media.data?.pagination
  if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
    setPage(pagination.totalPages)
  }

  const canManage = (item: MediaItem) =>
    user?.role === ROLES.ADMIN ||
    user?.role === ROLES.EDITOR ||
    item.uploadedById === user?.id

  function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) upload.mutate(file)
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="text-muted-foreground">
            Images and documents for use in posts (max 5 MB)
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            className="sr-only"
            aria-label="Choose a file to upload"
            onChange={onFilePicked}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            <Upload aria-hidden="true" />
            {upload.isPending ? 'Uploading…' : 'Upload file'}
          </Button>
        </div>
      </div>

      {media.isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : media.isError ? (
        <ErrorState
          message="The media library couldn’t be loaded."
          onRetry={() => media.refetch()}
        />
      ) : media.data.items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No media yet"
          description="Upload images or PDFs to use them in posts."
        >
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            Upload file
          </Button>
        </EmptyState>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {media.data.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="group block w-full overflow-hidden rounded-lg border bg-muted/30 text-left focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Open details for ${item.originalName}`}
                >
                  <div className="aspect-square overflow-hidden">
                    <MediaThumb item={item} />
                  </div>
                  <div className="border-t p-2">
                    <p className="truncate text-xs font-medium">{item.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} files
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

      <MediaDetailsDialog
        item={selected}
        canManage={selected ? canManage(selected) : false}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
