import { ReactNode } from 'react'
import { AuthLayout } from '@/components/layout/AuthLayout'

export default function AuthGroupLayout({ children }: { children: ReactNode }) : React.JSX.Element {
  return <AuthLayout>{children}</AuthLayout>
}
