/**
 * Allowed file types for attachments
 */
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  
  // Text
  'text/plain',
  'text/csv',
  'text/html',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
];

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Check if a file type is allowed
 * @param fileType The MIME type of the file
 * @returns True if the file type is allowed, false otherwise
 */
export function isAllowedFileType(fileType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(fileType);
}

/**
 * Check if a file size is within the allowed limit
 * @param fileSize The size of the file in bytes
 * @returns True if the file size is within the limit, false otherwise
 */
export function isAllowedFileSize(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @returns A formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get a file extension from a file name
 * @param fileName The name of the file
 * @returns The file extension (e.g., "pdf")
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get a file icon based on its MIME type
 * @param fileType The MIME type of the file
 * @returns A string representing the icon class or name
 */
export function getFileIconType(fileType: string): string {
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType === 'application/pdf') {
    return 'pdf';
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return 'spreadsheet';
  } else if (fileType.includes('document') || fileType.includes('word')) {
    return 'document';
  } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return 'presentation';
  } else if (fileType.includes('zip') || fileType.includes('compressed')) {
    return 'archive';
  } else if (fileType.startsWith('text/')) {
    return 'text';
  } else {
    return 'file';
  }
} 