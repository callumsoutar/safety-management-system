export interface Attachment {
  id: string;
  occurrence_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  public_url: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: string;
    full_name: string;
    email: string;
  };
} 