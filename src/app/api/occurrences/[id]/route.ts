import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    // Fetch occurrence details
    const { data: occurrence, error: occurrenceError } = await supabase
      .from('occurrences')
      .select(`
        *,
        aircraft:aircraft_id(id, registration, type, model),
        reporter:reporter_id(id, full_name, email)
      `)
      .eq('id', params.id)
      .single();

    if (occurrenceError) {
      return NextResponse.json({ error: occurrenceError.message }, { status: 500 });
    }

    if (!occurrence) {
      return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 });
    }

    // Fetch occurrence details
    const { data: occurrenceDetails, error: detailsError } = await supabase
      .from('occurrences_details')
      .select('*')
      .eq('occurrence_id', params.id)
      .single();

    if (detailsError && detailsError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }

    // Fetch investigation details
    const { data: investigation, error: investigationError } = await supabase
      .from('investigations')
      .select(`
        *,
        lead_investigator:lead_investigator_id(id, full_name, email)
      `)
      .eq('occurrence_id', params.id)
      .single();

    if (investigationError && investigationError.code !== 'PGRST116') {
      return NextResponse.json({ error: investigationError.message }, { status: 500 });
    }

    return NextResponse.json({
      occurrence,
      details: occurrenceDetails || null,
      investigation: investigation || null
    });
  } catch (error) {
    console.error('Error fetching occurrence details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 