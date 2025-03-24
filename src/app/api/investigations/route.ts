import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Add App Router configuration
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const stage = searchParams.get('stage');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Base query for investigations
    let query = supabase
      .from('investigations')
      .select(`
        *,
        lead_investigator:profiles!lead_investigator_id (*),
        occurrence:occurrences!occurrence_id (
          id,
          occurrence_number,
          title,
          occurrence_date,
          location,
          severity,
          occurrence_type
        )
      `);
    
    // Apply filters
    if (stage) {
      query = query.eq('stage', stage);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      // Add one day to end date to include the end date in the range
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('created_at', nextDay.toISOString());
    }
    
    // Get total count for pagination
    const { count: total } = await supabase
      .from('investigations')
      .select('*', { count: 'exact', head: true })
      .eq(stage ? 'stage' : 'id', stage || 'id');

    // Execute query with pagination
    const { data: investigations, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching investigations:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get statistics
    // Note: We're using a simplified approach here without a stored procedure
    // In a real app, you might want to create a proper stored procedure for this
    const { data: statsData, error: statsError } = await supabase
      .from('investigations')
      .select('stage')
      .is('deleted_at', null);
    
    if (statsError) {
      console.error('Error fetching stats:', statsError);
      // Continue with the response but log the error
    }

    // Calculate statistics from the data
    const stats = statsData ? {
      total: statsData.length,
      not_started: statsData.filter(i => i.stage === 'not_started').length,
      data_collection: statsData.filter(i => i.stage === 'data_collection').length,
      analysis: statsData.filter(i => i.stage === 'analysis').length,
      recommendations: statsData.filter(i => i.stage === 'recommendations').length,
      review: statsData.filter(i => i.stage === 'review').length,
      completed: statsData.filter(i => i.stage === 'completed').length,
      // For these, you would normally need additional queries with date filters
      this_week: 0,
      this_month: 0
    } : {
      total: 0,
      not_started: 0,
      data_collection: 0,
      analysis: 0,
      recommendations: 0,
      review: 0,
      completed: 0,
      this_week: 0,
      this_month: 0
    };

    // Format response
    return NextResponse.json({
      investigations: investigations || [],
      pagination: {
        total: total || 0,
        limit,
        offset,
      },
      stats
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 