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
  let content: any = null
  if (typeof page.content === 'string') {
    try {
      content = JSON.parse(page.content)
    } catch {
      content = { body: page.content }
    }
  } else {
    content = page.content
  }

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero title={page.title} subtitle={content?.subtitle || content?.subheading || ''} />
      <PageContainer size="md" className="pt-12 pb-20 md:pb-24 page-content space-y-8">
        {content?.sections && Array.isArray(content.sections) ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content.sections.map((sec: any, idx: number) => (
            <section key={idx} className="space-y-4">
              {sec.heading && (
                <h2 className="text-xl md:text-2xl font-serif font-medium tracking-tight text-brand-plum">
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
        ) : content?.heading || content?.subheading ? (
          <section className="space-y-4">
            {content.heading && (
              <h2 className="text-xl md:text-2xl font-serif font-medium tracking-tight text-brand-plum">
                {content.heading}
              </h2>
            )}
            {content.subheading && (
              <p className="text-neutral-600 leading-relaxed text-sm">{content.subheading}</p>
            )}
          </section>
        ) : (
          <div className="text-neutral-500 text-sm">
            <p>{page.title}</p>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
