import { useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/auth-context'
import { formatDateTime } from '@/lib/format'
import { usePublicComments, useSubmitPublicComment } from '../hooks'

export function CommentSection({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth()
  const comments = usePublicComments(slug)
  const submit = useSubmitPublicComment(slug)
  const [content, setContent] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (content.trim().length < 2) return
    await submit.mutateAsync(content.trim()).then(() => setContent(''), () => {})
  }

  return (
    <section aria-label="Comments" className="mt-12">
      <Separator className="mb-8" />
      <h2 className="mb-6 text-xl font-semibold tracking-tight">
        Comments
        {comments.data && comments.data.length > 0 && (
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({comments.data.length})
          </span>
        )}
      </h2>

      {comments.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : comments.isError ? (
        <p className="text-sm text-muted-foreground">Comments couldn’t be loaded.</p>
      ) : comments.data.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <MessagesSquare className="size-4 shrink-0" aria-hidden="true" />
          No comments yet — be the first to share your thoughts.
        </div>
      ) : (
        <ul className="space-y-6">
          {comments.data.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {comment.author.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{comment.author}</span>{' '}
                  <span className="text-xs text-muted-foreground">
                    · {formatDateTime(comment.createdAt)}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="comment" className="text-sm font-medium">
              Leave a comment
            </label>
            <Textarea
              id="comment"
              rows={3}
              value={content}
              maxLength={2000}
              placeholder="Share your thoughts… (reviewed before publishing)"
              onChange={(e) => setContent(e.target.value)}
            />
            <Button type="submit" disabled={submit.isPending || content.trim().length < 2}>
              {submit.isPending ? 'Submitting…' : 'Submit comment'}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="font-medium underline">
              Sign in
            </Link>{' '}
            to join the conversation.
          </p>
        )}
      </div>
    </section>
  )
}
