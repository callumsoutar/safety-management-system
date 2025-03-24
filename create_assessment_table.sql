-- Create enum for assessment status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status') THEN
        CREATE TYPE assessment_status AS ENUM ('pending_assessment', 'invalid', 'valid');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_classification') THEN
        CREATE TYPE incident_classification AS ENUM ('operational', 'technical', 'environmental', 'human_factors', 'organizational', 'other');
    END IF;
END $$;

-- Drop the table if it exists (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS occurrence_assessments CASCADE;

-- Create the occurrence_assessments table
CREATE TABLE occurrence_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
    status assessment_status NOT NULL DEFAULT 'pending_assessment',
    assessment_date TIMESTAMPTZ,
    incident_classification incident_classification,
    reasoning TEXT,
    assigned_investigator_id UUID REFERENCES profiles(id),
    date_assigned TIMESTAMPTZ,
    completion_due_date TIMESTAMPTZ,
    cfi_approved BOOLEAN NOT NULL DEFAULT false,
    cfi_approval_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id),
    updated_by UUID NOT NULL REFERENCES profiles(id)
);

-- Recreate the foreign key constraint from investigations table
ALTER TABLE investigations 
    ADD CONSTRAINT investigations_assessment_id_fkey 
    FOREIGN KEY (assessment_id) 
    REFERENCES occurrence_assessments(id) 
    ON DELETE SET NULL;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_occurrence_assessments_updated_at ON occurrence_assessments;

-- Add trigger for updated_at
CREATE TRIGGER update_occurrence_assessments_updated_at
    BEFORE UPDATE ON occurrence_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create assessments for existing occurrences
INSERT INTO occurrence_assessments (
    occurrence_id,
    status,
    created_by,
    updated_by
)
SELECT 
    o.id,
    'pending_assessment',
    o.reporter_id,
    o.reporter_id
FROM occurrences o
WHERE NOT EXISTS (
    SELECT 1 
    FROM occurrence_assessments oa 
    WHERE oa.occurrence_id = o.id
); 