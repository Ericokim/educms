import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'
import * as publicApi from './api'

export function usePublicPosts(filters: publicApi.PublicPostFilters) {
  return useQuery({
    queryKey: ['public', 'posts', filters],
    queryFn: () => publicApi.fetchPublicPosts(filters),
    staleTime: 60 * 1000,
  })
}

export function usePublicPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'post', slug],
    queryFn: () => publicApi.fetchPublicPost(slug as string),
    enabled: !!slug,
    staleTime: 60 * 1000,
  })
}

export function usePublicCategories() {
  return useQuery({
    queryKey: ['public', 'categories'],
    queryFn: publicApi.fetchPublicCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePublicComments(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'comments', slug],
    queryFn: () => publicApi.fetchPublicComments(slug as string),
    enabled: !!slug,
  })
}

export function useSubmitPublicComment(slug: string) {
  return useMutation({
    mutationFn: (content: string) => publicApi.submitPublicComment(slug, content),
    onSuccess: () => {
      toast.success('Thanks! Your comment will appear once it is approved.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

/** Fire-and-forget view tracking; once per slug per mount. */
export function useRecordView(slug: string | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!slug) return
    publicApi
      .recordView(slug)
      .then(() => queryClient.invalidateQueries({ queryKey: ['analytics'] }))
      .catch(() => {
        // View tracking must never disturb reading.
      })
  }, [slug, queryClient])
}
