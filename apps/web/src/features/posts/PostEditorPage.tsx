import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ROLES, postFormSchema, type PostDetail, type PostFormValues } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuth } from '@/features/auth/auth-context'
import { FeaturedImagePicker } from '@/features/media/FeaturedImagePicker'
import { cn } from '@/lib/utils'
import { RichTextEditor } from './RichTextEditor'
import { VersionHistoryDialog } from './VersionHistoryDialog'
import {
  useArchivePost,
  useCategories,
  useCreatePost,
  useDeletePost,
  usePost,
  usePublishPost,
  useTags,
  useUpdatePost,
} from './hooks'

const EMPTY_FORM: PostFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  categoryId: null,
  featuredImageId: null,
  tagIds: [],
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
}

function formValuesFromPost(post: PostDetail): PostFormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    content: post.content,
    categoryId: post.categoryId,
    featuredImageId: post.featuredImageId,
    tagIds: post.tags.map((tag) => tag.id),
    metaTitle: post.metaTitle ?? '',
    metaDescription: post.metaDescription ?? '',
    metaKeywords: post.metaKeywords ?? '',
  }
}

export function PostEditorPage() {
  const { id } = useParams()
  const postId = id !== undefined ? Number(id) : undefined
  const isEdit = postId !== undefined
  const navigate = useNavigate()
  const { user } = useAuth()

  const post = usePost(postId)
  const categories = useCategories()
  const tags = useTags()

  const createMutation = useCreatePost()
  const updateMutation = useUpdatePost(postId ?? 0)
  const publishMutation = usePublishPost()
  const archiveMutation = useArchivePost()
  const deleteMutation = useDeletePost()
  const [showDelete, setShowDelete] = useState(false)

  const canModerate = user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR
  const isAdmin = user?.role === ROLES.ADMIN

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema) as Resolver<PostFormValues>,
    defaultValues: EMPTY_FORM,
  })

  // Load the post into the form once it arrives (and after rollbacks).
  useEffect(() => {
    if (post.data) reset(formValuesFromPost(post.data))
  }, [post.data, reset])

  async function onSubmit(values: PostFormValues) {
    if (isEdit && postId !== undefined) {
      await updateMutation.mutateAsync(values)
    } else {
      const created = await createMutation.mutateAsync(values)
      navigate(`/posts/${created.id}/edit`, { replace: true })
    }
  }

  if (isEdit && post.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (isEdit && post.isError) {
    return <ErrorState message="This post couldn’t be loaded." onRetry={() => post.refetch()} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild type="button" variant="ghost" size="icon" aria-label="Back to posts">
            <Link to="/posts">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? 'Edit post' : 'New post'}
            </h1>
            {isEdit && post.data && (
              <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                <StatusBadge status={post.data.status} />
                <span>by {post.data.author}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEdit && postId !== undefined && <VersionHistoryDialog postId={postId} />}
          {isEdit && postId !== undefined && canModerate && post.data?.status !== 'published' && (
            <Button
              type="button"
              variant="outline"
              disabled={publishMutation.isPending || isDirty}
              title={isDirty ? 'Save your changes first' : undefined}
              onClick={() => publishMutation.mutate(postId)}
            >
              Publish
            </Button>
          )}
          {isEdit && postId !== undefined && canModerate && post.data?.status === 'published' && (
            <Button
              type="button"
              variant="outline"
              disabled={archiveMutation.isPending || isDirty}
              title={isDirty ? 'Save your changes first' : undefined}
              onClick={() => archiveMutation.mutate(postId)}
            >
              Archive
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create draft'}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="A clear, descriptive title"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.content}>
            <FieldLabel>Content</FieldLabel>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.content && <FieldError>{errors.content.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.excerpt}>
            <FieldLabel htmlFor="excerpt">Excerpt</FieldLabel>
            <Textarea
              id="excerpt"
              rows={3}
              placeholder="A short summary shown in lists and search results"
              {...register('excerpt')}
            />
            {errors.excerpt && <FieldError>{errors.excerpt.message}</FieldError>}
          </Field>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field data-invalid={!!errors.metaTitle}>
                <FieldLabel htmlFor="metaTitle">Meta title</FieldLabel>
                <Input id="metaTitle" {...register('metaTitle')} />
                {errors.metaTitle && <FieldError>{errors.metaTitle.message}</FieldError>}
              </Field>
              <Field data-invalid={!!errors.metaDescription}>
                <FieldLabel htmlFor="metaDescription">Meta description</FieldLabel>
                <Textarea id="metaDescription" rows={2} {...register('metaDescription')} />
                {errors.metaDescription && (
                  <FieldError>{errors.metaDescription.message}</FieldError>
                )}
              </Field>
              <Field data-invalid={!!errors.metaKeywords}>
                <FieldLabel htmlFor="metaKeywords">Meta keywords</FieldLabel>
                <Input
                  id="metaKeywords"
                  placeholder="comma, separated, keywords"
                  {...register('metaKeywords')}
                />
                {errors.metaKeywords && <FieldError>{errors.metaKeywords.message}</FieldError>}
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value === null || field.value === undefined ? 'none' : String(field.value)}
                      onValueChange={(value) =>
                        field.onChange(value === 'none' ? null : Number(value))
                      }
                    >
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="No category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.data?.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel>Tags</FieldLabel>
                <Controller
                  control={control}
                  name="tagIds"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.data?.length === 0 && (
                        <p className="text-sm text-muted-foreground">No tags yet.</p>
                      )}
                      {tags.data?.map((tag) => {
                        const selected = field.value.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              field.onChange(
                                selected
                                  ? field.value.filter((id) => id !== tag.id)
                                  : [...field.value, tag.id]
                              )
                            }
                            className="rounded-full"
                          >
                            <Badge
                              variant={selected ? 'default' : 'outline'}
                              className={cn(!selected && 'text-muted-foreground')}
                            >
                              {tag.name}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel>Featured image</FieldLabel>
                <Controller
                  control={control}
                  name="featuredImageId"
                  render={({ field }) => (
                    <FeaturedImagePicker value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>

              <Field data-invalid={!!errors.slug}>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <Input id="slug" placeholder="auto-generated from title" {...register('slug')} />
                <FieldDescription>
                  Leave empty to generate from the title.
                </FieldDescription>
                {errors.slug && <FieldError>{errors.slug.message}</FieldError>}
              </Field>
            </CardContent>
          </Card>

          {isEdit && postId !== undefined && isAdmin && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-base">Danger zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => setShowDelete(true)}
                >
                  Delete post
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete this post?"
        description="The post and its version history will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (postId !== undefined) {
            deleteMutation.mutate(postId, { onSuccess: () => navigate('/posts') })
          }
          setShowDelete(false)
        }}
      />
    </form>
  )
}
