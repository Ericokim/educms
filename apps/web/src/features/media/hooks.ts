import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UpdateMediaValues } from '@educms/shared'
import { getApiErrorMessage } from '@/lib/api'
import * as mediaApi from './api'

export function useMediaList(page: number, limit?: number) {
  return useQuery({
    queryKey: ['media', 'list', { page, limit }],
    queryFn: () => mediaApi.fetchMedia(page, limit),
    staleTime: 30 * 1000,
  })
}

function useMediaInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['media'] })
    void queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }
}

export function useUploadMedia() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: (file: File) => mediaApi.uploadMedia(file),
    onSuccess: () => {
      invalidate()
      toast.success('File uploaded')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUpdateMedia() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateMediaValues }) =>
      mediaApi.updateMedia(id, values),
    onSuccess: () => {
      invalidate()
      toast.success('Media updated')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useDeleteMedia() {
  const invalidate = useMediaInvalidation()
  return useMutation({
    mutationFn: (id: number) => mediaApi.deleteMedia(id),
    onSuccess: () => {
      invalidate()
      toast.success('Media deleted')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
