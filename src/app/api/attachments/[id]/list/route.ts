import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Attachment } from '@/types';

// Add App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const occurrenceId = params.id;

  if (!occurrenceId) {
    return NextResponse.json(
      { error: 'Occurrence ID is required' },
      { status: 400 }
    );
  }

  // Create a Supabase client
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the occurrence exists and the user has access to it
    const { data: occurrence, error: occurrenceError } = await supabase
      .from('occurrences')
      .select('id')
      .eq('id', occurrenceId)
      .single();

    if (occurrenceError || !occurrence) {
      return NextResponse.json(
        { error: 'Occurrence not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch all attachments for the occurrence
    const { data: attachments, error: attachmentsError } = await supabase
      .from('attachments')
      .select('*')
      .eq('occurrence_id', occurrenceId)
      .order('created_at', { ascending: false });

    if (attachmentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch attachments' },
        { status: 500 }
      );
    }

    // Get unique user IDs from attachments
    const userIds = Array.from(new Set(attachments.map(attachment => attachment.uploaded_by)));

    // Fetch user information for each uploader
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 500 }
      );
    }

    // Map users to attachments
    const attachmentsWithUsers = attachments.map((attachment: Attachment) => {
      const uploader = users.find(user => user.id === attachment.uploaded_by);
      return {
        ...attachment,
        uploader: uploader || null
      };
    });

    return NextResponse.json({ attachments: attachmentsWithUsers });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 