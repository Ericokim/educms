import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { categoryFormSchema } from '@educms/shared'
import { TaxonomyManager } from './TaxonomyManager'
import { useCategoryList, useCategoryMutations, type TaxonomyFormSubmit } from './hooks'

const resolver = zodResolver(categoryFormSchema) as Resolver<TaxonomyFormSubmit>

export function CategoriesPage() {
  const query = useCategoryList()
  const { create, update, remove } = useCategoryMutations()

  return (
    <TaxonomyManager
      title="Categories"
      subtitle="Group posts into broad sections"
      entityLabel="category"
      hasDescription
      resolver={resolver}
      query={query}
      create={create}
      update={update}
      remove={remove}
    />
  )
}
