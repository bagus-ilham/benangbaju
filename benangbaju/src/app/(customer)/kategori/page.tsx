import React from 'react'
import { Metadata } from 'next'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { CategoriesClient } from './CategoriesClient'
import { cacheLife, cacheTag } from 'next/cache'

export const metadata: Metadata = {
  title: 'Kategori Produk | Benangbaju',
  description: 'Jelajahi berbagai kategori produk terbaik dari Benangbaju',
}

async function getCategories() {
  'use cache'
  cacheLife('weeks')
  cacheTag('categories')
  return await getActiveCategoriesAction()
}

export default async function CategoriesIndexPage(): Promise<React.JSX.Element> {
  const categoriesRes = await getCategories()
  const categories = categoriesRes.data || []
  const parentCategories = categories.filter((cat) => !cat.parent_id)

  return <CategoriesClient parentCategories={parentCategories} />
}
