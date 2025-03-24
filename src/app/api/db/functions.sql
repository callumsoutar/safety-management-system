-- Function to get occurrence statistics
CREATE OR REPLACE FUNCTION get_occurrence_statistics()
RETURNS json AS $$
DECLARE
    total_count integer;
    pending_count integer;
    in_progress_count integer;
    completed_count integer;
    this_week_count integer;
    this_month_count integer;
    high_severity_count integer;
    result json;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM occurrences;
    
    -- Get pending (new) occurrences
    SELECT COUNT(*) INTO pending_count FROM occurrences WHERE status = 'new';
    
    -- Get in-progress occurrences
    SELECT COUNT(*) INTO in_progress_count FROM occurrences 
    WHERE status = 'in_progress' OR status = 'under_investigation';
    
    -- Get completed occurrences
    SELECT COUNT(*) INTO completed_count FROM occurrences WHERE status = 'closed';
    
    -- Get occurrences reported this week
    SELECT COUNT(*) INTO this_week_count FROM occurrences 
    WHERE created_at >= date_trunc('week', now());
    
    -- Get occurrences reported this month
    SELECT COUNT(*) INTO this_month_count FROM occurrences 
    WHERE created_at >= date_trunc('month', now());
    
    -- Get high severity occurrences
    SELECT COUNT(*) INTO high_severity_count FROM occurrences 
    WHERE severity = 'high' OR severity = 'critical';
    
    -- Create JSON result
    result := json_build_object(
        'total', total_count,
        'pending', pending_count,
        'in_progress', in_progress_count,
        'completed', completed_count,
        'this_week', this_week_count,
        'this_month', this_month_count,
        'high_severity', high_severity_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql; 