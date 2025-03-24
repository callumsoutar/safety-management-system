import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Add App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch users with investigator or safety_officer roles
    const { data: investigators, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['investigator', 'safety_officer'])
      .order('full_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ investigators });
  } catch (error) {
    console.error('Error fetching investigators:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 