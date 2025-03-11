import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ATTACHMENTS_BUCKET } from '@/lib/supabase/storage';

// Add App Router configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Check if the user is authenticated and is an admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === ATTACHMENTS_BUCKET);
    
    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(ATTACHMENTS_BUCKET, {
        public: false, // Files are not public by default
        fileSizeLimit: 10485760, // 10MB limit
      });
      
      if (error) {
        return NextResponse.json(
          { error: `Failed to create bucket: ${error.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Attachments bucket created successfully'
      });
    }
    
    return NextResponse.json({
      message: 'Attachments bucket already exists'
    });
  } catch (error) {
    console.error('Error initializing storage bucket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 