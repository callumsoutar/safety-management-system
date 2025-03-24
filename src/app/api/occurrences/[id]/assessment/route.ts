import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Add App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET assessment for an occurrence
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Fetching assessment for occurrence:', params.id);
    
    // Fetch assessment with related data
    let { data: assessment, error } = await supabase
      .from('occurrence_assessments')
      .select(`
        *,
        assigned_investigator:profiles!occurrence_assessments_assigned_investigator_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('occurrence_id', params.id)
      .single();

    if (error) {
      console.error('Error fetching assessment:', error);
      // Only create new assessment if the error is "no rows returned"
      if (error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // If no assessment exists or we got a "no rows" error, create one
    if (!assessment) {
      console.log('No assessment found, creating new one');
      const { data: newAssessment, error: insertError } = await supabase
        .from('occurrence_assessments')
        .insert({
          occurrence_id: params.id,
          status: 'pending_assessment',
          created_by: session.user.id,
          updated_by: session.user.id
        })
        .select(`
          *,
          assigned_investigator:profiles!occurrence_assessments_assigned_investigator_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .single();

      if (insertError) {
        console.error('Error creating new assessment:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      console.log('Successfully created new assessment');
      assessment = newAssessment;
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Unexpected error in assessment route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update assessment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Update assessment
    const { data: assessment, error } = await supabase
      .from('occurrence_assessments')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('occurrence_id', params.id)
      .select(`
        *,
        assigned_investigator:profiles!occurrence_assessments_assigned_investigator_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 