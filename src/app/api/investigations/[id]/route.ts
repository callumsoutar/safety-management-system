import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Add App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Fetching investigation with ID:', params.id);
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('User not authenticated');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('User authenticated:', session.user.id);

  try {
    // First, check if the investigation exists with a simple query
    const { data: simpleCheck, error: checkError } = await supabase
      .from('investigations')
      .select('id')
      .eq('id', params.id)
      .single();
    
    console.log('Simple check result:', { simpleCheck, checkError });
    
    if (checkError) {
      console.log('Error in simple check:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!simpleCheck) {
      console.log('Investigation not found in simple check');
      return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
    }

    // Fetch investigation details with lead investigator info
    const { data: investigation, error: investigationError } = await supabase
      .from('investigations')
      .select(`
        *,
        lead_investigator:lead_investigator_id(id, full_name, email),
        occurrence:occurrence_id(
          id,
          occurrence_number,
          title,
          description,
          occurrence_date,
          location,
          status,
          severity,
          occurrence_type,
          reporter:reporter_id(id, full_name, email),
          aircraft:aircraft_id(id, registration, type, model)
        )
      `)
      .eq('id', params.id)
      .single();

    console.log('Investigation query result:', { investigation, investigationError });

    if (investigationError) {
      console.log('Error fetching investigation:', investigationError);
      return NextResponse.json({ error: investigationError.message }, { status: 500 });
    }

    if (!investigation) {
      console.log('Investigation not found in detailed query');
      return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
    }

    // Fetch occurrence details
    const { data: occurrenceDetails, error: detailsError } = await supabase
      .from('occurrences_details')
      .select('*')
      .eq('occurrence_id', investigation.occurrence_id)
      .single();

    console.log('Occurrence details result:', { occurrenceDetails, detailsError });

    if (detailsError && detailsError.code !== 'PGRST116') {
      console.log('Error fetching occurrence details:', detailsError);
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }

    // Fetch interviews related to this investigation
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('*')
      .eq('investigation_id', params.id)
      .order('date', { ascending: false });

    if (interviewsError) {
      return NextResponse.json({ error: interviewsError.message }, { status: 500 });
    }

    // Fetch communications related to this investigation
    const { data: communications, error: communicationsError } = await supabase
      .from('communications')
      .select('*')
      .eq('investigation_id', params.id)
      .order('date', { ascending: false });

    if (communicationsError) {
      return NextResponse.json({ error: communicationsError.message }, { status: 500 });
    }

    // For now, let's return just the main data to debug
    return NextResponse.json({
      investigation,
      occurrence_details: occurrenceDetails || null,
      interviews: interviews || [],
      communications: communications || []
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Handle updates to investigation content
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

    // Update investigation
    const { data, error } = await supabase
      .from('investigations')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ investigation: data });
  } catch (error) {
    console.error('Error updating investigation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 