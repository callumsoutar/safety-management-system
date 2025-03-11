import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Storage bucket name for attachments
export const ATTACHMENTS_BUCKET = 'attachments';

/**
 * Initialize the storage bucket for attachments
 * This should be called during app initialization
 */
export async function initializeStorage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === ATTACHMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log('Attachments bucket does not exist. Please create it manually in the Supabase dashboard.');
    } else {
      console.log('Attachments bucket exists and is ready for use.');
    }
  } catch (error) {
    console.error('Error checking storage bucket:', error);
  }
}

/**
 * Get a signed URL for downloading a file
 * @param filePath The path to the file in the bucket
 * @param fileName The name to use for the downloaded file
 * @param expiresIn The number of seconds until the URL expires (default: 60)
 * @returns The signed URL or null if an error occurred
 */
export async function getSignedUrl(filePath: string, fileName: string, expiresIn = 60) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(filePath, expiresIn, {
        download: fileName,
      });
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

/**
 * Get a public URL for a file
 * @param filePath The path to the file in the bucket
 * @returns The public URL
 */
export function getPublicUrl(filePath: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Upload a file to the attachments bucket
 * @param file The file to upload
 * @param path The path within the bucket to store the file
 * @returns The file path if successful, null if an error occurred
 */
export async function uploadFile(file: File, path: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    return data.path;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Delete a file from the attachments bucket
 * @param path The path to the file in the bucket
 * @returns True if successful, false if an error occurred
 */
export async function deleteFile(path: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([path]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
} 