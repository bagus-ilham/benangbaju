import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from('categories').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', timestamp: new Date().toISOString(), checks },
    { status: allOk ? 200 : 503 }
  );
}
