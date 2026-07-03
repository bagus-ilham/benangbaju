import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse<unknown>> {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let redirect = requestUrl.searchParams.get('redirect') || '/'

  // Safe redirect validation: must start with / and not //
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    redirect = '/'
  }

  if (code) {
    try {
      const supabase = await createServerClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging OAuth code for session:', error)
        return NextResponse.redirect(`${requestUrl.origin}/masuk?error=oauth_failed`)
      }
    } catch (err) {
      console.error('Catch block OAuth code exchange error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/masuk?error=oauth_failed`)
    }
  }

  // Redirect to requested page on success
  return NextResponse.redirect(`${requestUrl.origin}${redirect}`)
}
