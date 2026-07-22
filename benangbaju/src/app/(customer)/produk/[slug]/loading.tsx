import { PageContainer } from '@/shared/components/PageContainer'
import { ProductGridSkeleton } from '@/shared/components/ProductGridSkeleton'

export default function ProductDetailLoading(): React.JSX.Element {
  return (
    <div className="bg-white min-h-screen">
      <PageContainer className="py-10 md:py-12 page-content">
        <div className="h-3 w-48 skeleton-shimmer rounded-md mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 mb-16">
          <div className="md:col-span-7 aspect-[3/4] skeleton-shimmer rounded-2xl" />
          <div className="md:col-span-5 space-y-5">
            <div className="h-3 w-1/4 skeleton-shimmer rounded-md" />
            <div className="h-8 w-3/4 skeleton-shimmer rounded-lg" />
            <div className="h-6 w-1/3 skeleton-shimmer rounded-md" />
            <div className="h-20 w-full skeleton-shimmer rounded-xl" />
            <div className="h-32 w-full skeleton-shimmer rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 skeleton-shimmer rounded-xl" />
              <div className="h-12 skeleton-shimmer rounded-xl" />
            </div>
          </div>
        </div>
        <ProductGridSkeleton count={4} />
      </PageContainer>
    </div>
  )
}
