import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ATTACHMENTS_BUCKET, getPublicUrl } from '@/lib/supabase/storage';
import { isAllowedFileType, isAllowedFileSize, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/utils/fileUtils';

// This is the new way to configure API routes in App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const occurrenceId = formData.get('occurrenceId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!occurrenceId) {
      return NextResponse.json(
        { error: 'Occurrence ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFileType(file.type)) {
      return NextResponse.json(
        { 
          error: 'File type not allowed',
          allowedTypes: ALLOWED_FILE_TYPES 
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isAllowedFileSize(file.size)) {
      return NextResponse.json(
        { 
          error: 'File size exceeds the maximum allowed size',
          maxSize: MAX_FILE_SIZE 
        },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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

    // Generate a unique file name to avoid collisions
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name.replace(/\.[^/.]+$/, '')}.${fileExtension}`;
    const filePath = `${occurrenceId}/${fileName}`;

    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded file
    const publicUrl = getPublicUrl(uploadData.path);

    // Store the attachment metadata in the database
    const { data: attachment, error: insertError } = await supabase
      .from('attachments')
      .insert({
        occurrence_id: occurrenceId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        public_url: publicUrl,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing attachment metadata:', insertError);
      
      // Delete the uploaded file if we couldn't store the metadata
      await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .remove([uploadData.path]);
      
      return NextResponse.json(
        { error: 'Failed to store attachment metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      attachment,
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 