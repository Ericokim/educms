import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PostFormValues } from '@educms/shared'
import { getApiErrorMessage } from '@/lib/api'
import * as postsApi from './api'

export function usePosts(filters: postsApi.PostListFilters) {
  return useQuery({
    queryKey: ['posts', 'list', filters],
    queryFn: () => postsApi.fetchPosts(filters),
    staleTime: 30 * 1000,
  })
}

export function usePost(id: number | undefined) {
  return useQuery({
    queryKey: ['posts', 'detail', id],
    queryFn: () => postsApi.fetchPost(id as number),
    enabled: id !== undefined,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'list'],
    queryFn: postsApi.fetchCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['tags', 'list'],
    queryFn: postsApi.fetchTags,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePostVersions(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['posts', 'versions', id],
    queryFn: () => postsApi.fetchVersions(id as number),
    enabled: enabled && id !== undefined,
  })
}

/** Invalidate every post-related query after a mutation. */
function usePostInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['posts'] })
    void queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }
}

export function useCreatePost() {
  const invalidate = usePostInvalidation()
  return useMutation({
    mutationFn: (values: PostFormValues) => postsApi.createPost(values),
    onSuccess: () => {
      invalidate()
      toast.success('Post created')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useUpdatePost(id: number) {
  const invalidate = usePostInvalidation()
  return useMutation({
    mutationFn: (values: PostFormValues) => postsApi.updatePost(id, values),
    onSuccess: () => {
      invalidate()
      toast.success('Post saved')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function usePublishPost() {
  const invalidate = usePostInvalidation()
  return useMutation({
    mutationFn: (id: number) => postsApi.publishPost(id),
    onSuccess: () => {
      invalidate()
      toast.success('Post published')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useArchivePost() {
  const invalidate = usePostInvalidation()
  return useMutation({
    mutationFn: (id: number) => postsApi.archivePost(id),
    onSuccess: () => {
      invalidate()
      toast.success('Post archived')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useDeletePost() {
  const invalidate = usePostInvalidation()
  return useMutation({
    mutationFn: (id: number) => postsApi.deletePost(id),
    onSuccess: () => {
      invalidate()
      toast.success('Post deleted')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useRollbackPost(id: number) {
  const invalidate = usePostInvalidation()
  return useMutation({
    mutationFn: (versionId: number) => postsApi.rollbackPost(id, versionId),
    onSuccess: () => {
      invalidate()
      toast.success('Post rolled back')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
