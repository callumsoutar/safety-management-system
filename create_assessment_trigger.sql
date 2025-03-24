-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_assessment_after_occurrence ON occurrences;
DROP FUNCTION IF EXISTS create_assessment_for_occurrence();

-- Function to automatically create an assessment when an occurrence is created
CREATE OR REPLACE FUNCTION create_assessment_for_occurrence()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO occurrence_assessments (
        occurrence_id,
        status,
        created_by,
        updated_by
    )
    VALUES (
        NEW.id,
        'pending_assessment',
        auth.uid(),
        auth.uid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create assessment automatically
CREATE TRIGGER create_assessment_after_occurrence
AFTER INSERT ON occurrences
FOR EACH ROW
EXECUTE FUNCTION create_assessment_for_occurrence();

-- Create assessments for existing occurrences that don't have one
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