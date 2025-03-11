-- Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy for selecting attachments (users can only see attachments for occurrences they have access to)
CREATE POLICY attachments_select_policy ON attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM occurrences o
      WHERE o.id = attachments.occurrence_id
      AND (
        o.reporter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'investigator', 'safety_officer')
        )
      )
    )
  );

-- Policy for inserting attachments (users can only add attachments to occurrences they have access to)
CREATE POLICY attachments_insert_policy ON attachments
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM occurrences o
      WHERE o.id = attachments.occurrence_id
      AND (
        o.reporter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'investigator', 'safety_officer')
        )
      )
    )
  );

-- Policy for deleting attachments (only the uploader or admins can delete)
CREATE POLICY attachments_delete_policy ON attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for attachments updated_at
CREATE TRIGGER update_attachments_updated_at
BEFORE UPDATE ON attachments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 