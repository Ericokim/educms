import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { tagFormSchema } from '@educms/shared'
import { TaxonomyManager } from './TaxonomyManager'
import { useTagList, useTagMutations, type TaxonomyFormSubmit } from './hooks'

const resolver = zodResolver(tagFormSchema) as Resolver<TaxonomyFormSubmit>

export function TagsPage() {
  const query = useTagList()
  const { create, update, remove } = useTagMutations()

  return (
    <TaxonomyManager
      title="Tags"
      subtitle="Label posts with specific topics"
      entityLabel="tag"
      hasDescription={false}
      resolver={resolver}
      query={query}
      create={create}
      update={update}
      remove={remove}
    />
  )
}
