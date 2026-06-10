import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'
import * as taxonomyApi from './api'

export function useCategoryList() {
  return useQuery({
    queryKey: ['categories', 'list'],
    queryFn: taxonomyApi.fetchCategories,
    staleTime: 60 * 1000,
  })
}

export function useTagList() {
  return useQuery({
    queryKey: ['tags', 'list'],
    queryFn: taxonomyApi.fetchTags,
    staleTime: 60 * 1000,
  })
}

/**
 * All taxonomy mutations share the same shape: run, invalidate the entity
 * list (and posts, which display category/tag names), and toast the result.
 */
function useTaxonomyMutation<TVariables>(
  entityKey: 'categories' | 'tags',
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [entityKey] })
      void queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success(successMessage)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export interface TaxonomyFormSubmit {
  name: string
  slug?: string
  description?: string
}

export function useCategoryMutations() {
  return {
    create: useTaxonomyMutation(
      'categories',
      (values: TaxonomyFormSubmit) => taxonomyApi.createCategory(values),
      'Category created'
    ),
    update: useTaxonomyMutation(
      'categories',
      ({ id, values }: { id: number; values: TaxonomyFormSubmit }) =>
        taxonomyApi.updateCategory(id, values),
      'Category updated'
    ),
    remove: useTaxonomyMutation(
      'categories',
      (id: number) => taxonomyApi.deleteCategory(id),
      'Category deleted'
    ),
  }
}

export function useTagMutations() {
  return {
    create: useTaxonomyMutation(
      'tags',
      (values: TaxonomyFormSubmit) => taxonomyApi.createTag(values),
      'Tag created'
    ),
    update: useTaxonomyMutation(
      'tags',
      ({ id, values }: { id: number; values: TaxonomyFormSubmit }) =>
        taxonomyApi.updateTag(id, values),
      'Tag updated'
    ),
    remove: useTaxonomyMutation(
      'tags',
      (id: number) => taxonomyApi.deleteTag(id),
      'Tag deleted'
    ),
  }
}
