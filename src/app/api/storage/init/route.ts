import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ATTACHMENTS_BUCKET } from '@/lib/supabase/storage';

export async function POST(request: NextRequest) {
  // Create a Supabase client
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Check if the user is authenticated and is an admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the user is an admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: 'Only administrators can initialize storage' },
        { status: 403 }
      );
    }

    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json(
        { error: 'Failed to list storage buckets' },
        { status: 500 }
      );
    }

    const bucketExists = buckets.some(bucket => bucket.name === ATTACHMENTS_BUCKET);

    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(ATTACHMENTS_BUCKET, {
        public: false,
        fileSizeLimit: 10485760, // 10MB limit
      });

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create storage bucket' },
          { status: 500 }
        );
      }

      // Set up bucket policies
      const { error: policyError } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUploadUrl('test');
      
      if (policyError) {
        return NextResponse.json(
          { error: 'Failed to set up bucket policies' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Storage bucket created successfully'
      });
    }

    return NextResponse.json({
      message: 'Storage bucket already exists'
    });
  } catch (error) {
    console.error('Error initializing storage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 