-- Insert a test investigation
INSERT INTO investigations (
  id,
  occurrence_id,
  lead_investigator_id,
  team_members,
  stage,
  findings,
  root_causes,
  contributing_factors,
  recommendations,
  started_at
) VALUES (
  '5c6ac923-e441-4881-ad62-dfb927c2bb2f',  -- This matches the ID you're trying to access
  (SELECT id FROM occurrences ORDER BY created_at DESC LIMIT 1),  -- Get the latest occurrence
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),   -- Get a user to be lead investigator
  ARRAY[(SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)]::UUID[],
  'in_progress',
  'Initial findings show that proper procedures were not followed during the pre-flight check.',
  'Primary root cause identified as inadequate training on the new checklist system.',
  'Contributing factors include time pressure and recent changes to the checklist format.',
  'Implement refresher training on the new checklist system and review the checklist format for clarity.',
  NOW()
); 