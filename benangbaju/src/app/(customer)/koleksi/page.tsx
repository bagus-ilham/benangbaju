import React from 'react'
import { getActiveCollectionsAction } from '@/modules/collections/actions'
import { CollectionsClient } from './CollectionsClient'
import { cacheLife, cacheTag } from 'next/cache'

async function getCachedCollections() {
  'use cache'
  cacheLife('weeks')
  cacheTag('collections')
  return getActiveCollectionsAction()
}

export default async function CollectionsIndexPage(): Promise<React.JSX.Element> {
  const collectionsRes = await getCachedCollections()
  const collections = collectionsRes.data || []

  return <CollectionsClient collections={collections} />
}
