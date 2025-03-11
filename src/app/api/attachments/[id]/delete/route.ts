import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ATTACHMENTS_BUCKET } from '@/lib/supabase/storage';

// Add App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const attachmentId = params.id;

  if (!attachmentId) {
    return NextResponse.json(
      { error: 'Attachment ID is required' },
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

    // Get the attachment details to retrieve the file path
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if the user has access to the occurrence
    const { data: occurrence, error: occurrenceError } = await supabase
      .from('occurrences')
      .select('id')
      .eq('id', attachment.occurrence_id)
      .single();

    if (occurrenceError || !occurrence) {
      return NextResponse.json(
        { error: 'Access denied to the associated occurrence' },
        { status: 403 }
      );
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([attachment.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // We'll continue with deleting the database record even if storage deletion fails
    }

    // Delete the attachment record from the database
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      console.error('Error deleting attachment record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete attachment record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 