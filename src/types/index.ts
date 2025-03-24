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

export type AssessmentStatus = 'pending_assessment' | 'invalid' | 'valid';

export type IncidentClassification = 
  | 'operational'
  | 'technical'
  | 'environmental'
  | 'human_factors'
  | 'organizational'
  | 'other';

export interface OccurrenceAssessment {
  id: string;
  occurrence_id: string;
  status: AssessmentStatus;
  assessment_date: string | null;
  incident_classification: IncidentClassification | null;
  reasoning: string | null;
  assigned_investigator_id: string | null;
  assigned_investigator?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  date_assigned: string | null;
  completion_due_date: string | null;
  cfi_approved: boolean;
  cfi_approval_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
} 