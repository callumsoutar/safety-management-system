import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Add App Router configuration
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const severity = url.searchParams.get('severity');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Build query for counting with filters
    let countQuery = supabase.from('occurrences').select('*', { count: 'exact', head: true });
    
    // Apply filters to count query
    if (status) countQuery = countQuery.eq('status', status);
    if (severity) countQuery = countQuery.eq('severity', severity);
    if (startDate) countQuery = countQuery.gte('occurrence_date', startDate);
    if (endDate) countQuery = countQuery.lte('occurrence_date', endDate);

    // Execute count query
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Build data query with same filters
    let dataQuery = supabase.from('occurrences').select(`
      *,
      aircraft:aircraft_id(id, registration, type, model),
      reporter:reporter_id(id, full_name, email),
      assigned_user:assigned_to(id, full_name, email),
      investigations(id, stage, lead_investigator_id, lead_investigator:lead_investigator_id(id, full_name, email))
    `);
    
    // Apply same filters to data query
    if (status) dataQuery = dataQuery.eq('status', status);
    if (severity) dataQuery = dataQuery.eq('severity', severity);
    if (startDate) dataQuery = dataQuery.gte('occurrence_date', startDate);
    if (endDate) dataQuery = dataQuery.lte('occurrence_date', endDate);
    
    // Add pagination and ordering
    dataQuery = dataQuery.order('created_at', { ascending: false })
                        .range(offset, offset + limit - 1);

    // Execute data query
    const { data: occurrences, error } = await dataQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_occurrence_statistics');
    
    if (statsError) {
      console.error('Error fetching statistics:', statsError);
      // Continue without stats if there's an error
    }

    return NextResponse.json({
      occurrences,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
      stats: stats || {
        total: count || 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        this_week: 0,
        this_month: 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching occurrences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 