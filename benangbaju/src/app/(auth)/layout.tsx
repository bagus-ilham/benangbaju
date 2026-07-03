import { ReactNode, Suspense } from 'react'
import { AuthLayout } from '@/shared/components/AuthLayout'

export default function AuthGroupLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AuthLayout>{children}</AuthLayout>
    </Suspense>
  )
}
