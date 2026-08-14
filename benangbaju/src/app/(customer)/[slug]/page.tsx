import React from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { cmsService } from '@/modules/cms/cms.service'
import { PageHero, PageContainer } from '@/shared/components'
import { sanitizeHtml } from '@/lib/utils/sanitize'

import { cacheLife, cacheTag } from 'next/cache'

interface DynamicPageProps {
  params: Promise<{ slug: string }>
}

async function getCachedLandingPage(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('cms-pages', `cms-page-${slug}`)

  return cmsService.getLandingPageBySlug(slug)
}

export async function generateMetadata({ params }: DynamicPageProps): Promise<Metadata> {
  const { slug } = await params
  const res = await getCachedLandingPage(slug)
  const page = res.data

  if (!page) {
    return { title: 'Halaman Tidak Ditemukan — Benangbaju' }
  }

  return {
    title: page.meta_title || `${page.title} — Benangbaju`,
    description: page.meta_description || page.title,
  }
}

export default async function DynamicLandingPage({ params }: DynamicPageProps) {
  const { slug } = await params
  const res = await getCachedLandingPage(slug)
  const page = res.data

  if (!page) {
    notFound()
  }

  // Parse content JSONB if string or object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content =
    typeof page.content === 'string' ? JSON.parse(page.content) : (page.content as any)

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero title={page.title} subtitle={content?.subtitle || ''} />
      <PageContainer size="md" className="py-12 page-content space-y-8">
        {content?.sections && Array.isArray(content.sections) ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content.sections.map((sec: any, idx: number) => (
            <section key={idx} className="space-y-4">
              {sec.heading && (
                <h2 className="text-xl font-heading font-semibold text-brand-plum">
                  {sec.heading}
                </h2>
              )}
              {sec.body && (
                <div
                  className="prose max-w-none text-neutral-600 leading-relaxed text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(sec.body) }}
                />
              )}
            </section>
          ))
        ) : content?.body ? (
          <div
            className="prose max-w-none text-neutral-600 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.body) }}
          />
        ) : (
          <div className="text-neutral-500 text-sm">
            <p>{page.title}</p>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
