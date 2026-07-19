'use client'

import React from 'react'
import { getImageProps } from 'next/image'
import { SmartLink as Link } from '@/shared/components'
import { Banner } from '@/modules/banners/types'

interface MidBannerSectionProps {
  banners: Banner[]
}

export function MidBannerSection({ banners }: MidBannerSectionProps): React.JSX.Element | null {
  if (!banners || banners.length === 0) return null

  // For simplicity, we just take the first mid banner to display
  const banner = banners[0]

  const commonProps = {
    alt: banner.title || 'Mid Banner',
    fill: true,
    sizes: '100vw',
    quality: 90,
    className: 'object-cover',
    style: {
      width: '100%',
      height: '100%',
      position: 'absolute' as const,
      inset: 0,
    },
  }

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...commonProps,
    src: banner.image_url,
  })

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    props: { srcSet: mobileSrcSet, alt, ...restMobile },
  } = getImageProps({
    ...commonProps,
    src: banner.image_mobile_url || banner.image_url,
  })

  const BannerContent = () => (
    <div className="relative w-full overflow-hidden bg-neutral-100 aspect-[4/3] md:aspect-[21/9]">
      <picture className="block w-full h-full">
        <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes="100vw" />
        <img
          src={restMobile.src}
          srcSet={mobileSrcSet}
          sizes="100vw"
          alt={alt || 'Banner'}
          className="block w-full h-full object-cover"
        />
      </picture>

      {/* Optional Overlay if there is text, but for mid banners often the image contains the text itself.
          If we want to show title/subtitle, we can add it here. For now, we keep it simple. */}
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-center">
          <div className="p-6 bg-white/90 backdrop-blur-sm shadow-xl max-w-lg">
            {banner.subtitle && (
              <p className="text-[10px] uppercase tracking-widest font-heading font-medium text-neutral-500 mb-2">
                {banner.subtitle}
              </p>
            )}
            {banner.title && (
              <h3 className="text-2xl md:text-3xl font-heading uppercase tracking-wider text-brand-black">
                {banner.title}
              </h3>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (banner.link_url) {
    return (
      <section className="w-full">
        <Link href={banner.link_url} className="block w-full hover:opacity-95 transition-opacity">
          <BannerContent />
        </Link>
      </section>
    )
  }

  return (
    <section className="w-full">
      <BannerContent />
    </section>
  )
}
