import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'
import * as commentsApi from './api'

export function useComments(filters: commentsApi.CommentListFilters) {
  return useQuery({
    queryKey: ['comments', 'list', filters],
    queryFn: () => commentsApi.fetchComments(filters),
    staleTime: 15 * 1000,
  })
}

function useModerationMutation(
  mutationFn: (id: number) => Promise<unknown>,
  successMessage: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments'] })
      // The dashboard shows pending-comment counts.
      void queryClient.invalidateQueries({ queryKey: ['analytics'] })
      toast.success(successMessage)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export function useCommentModeration() {
  return {
    approve: useModerationMutation(commentsApi.approveComment, 'Comment approved'),
    spam: useModerationMutation(commentsApi.spamComment, 'Comment marked as spam'),
    trash: useModerationMutation(commentsApi.trashComment, 'Comment moved to trash'),
  }
}
