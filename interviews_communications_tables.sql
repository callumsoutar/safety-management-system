-- Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  interviewee TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  summary TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Communications Table
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  participants TEXT[] DEFAULT ARRAY[]::TEXT[],
  summary TEXT DEFAULT '',
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Interviews Policies
CREATE POLICY "Users can view interviews they have access to" ON interviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM investigations i
      WHERE i.id = interviews.investigation_id
      AND (
        i.lead_investigator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'investigator', 'safety_officer')
        )
      )
    )
  );

CREATE POLICY "Safety team can manage interviews" ON interviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'investigator', 'safety_officer')
    )
  );

-- Communications Policies
CREATE POLICY "Users can view communications they have access to" ON communications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM investigations i
      WHERE i.id = communications.investigation_id
      AND (
        i.lead_investigator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'investigator', 'safety_officer')
        )
      )
    )
  );

CREATE POLICY "Safety team can manage communications" ON communications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'investigator', 'safety_officer')
    )
  );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for the test investigation
INSERT INTO interviews (
  investigation_id,
  interviewee,
  date,
  summary,
  notes,
  status
) VALUES (
  '5c6ac923-e441-4881-ad62-dfb927c2bb2f',
  'John Smith - Pilot of ZK-KAZ',
  NOW() - INTERVAL '2 days',
  'Pilot stated he was focused on maintaining altitude and did not see the other aircraft on final approach.',
  'Pilot seemed nervous during the interview. Mentioned being distracted by a passenger question.',
  'completed'
);

INSERT INTO interviews (
  investigation_id,
  interviewee,
  date,
  summary,
  notes,
  status
) VALUES (
  '5c6ac923-e441-4881-ad62-dfb927c2bb2f',
  'Jane Doe - Pilot of ZK-MWM',
  NOW() - INTERVAL '1 day',
  'Pilot reported having to execute a go-around when the Cessna turned in front of her aircraft.',
  'Pilot was calm and professional. Provided detailed account of the incident.',
  'completed'
);

INSERT INTO communications (
  investigation_id,
  type,
  date,
  participants,
  summary,
  follow_up_required,
  follow_up_notes
) VALUES (
  '5c6ac923-e441-4881-ad62-dfb927c2bb2f',
  'Email',
  NOW() - INTERVAL '3 days',
  ARRAY['Tower Controller', 'Safety Officer'],
  'Initial notification of the incident to the safety team.',
  false,
  NULL
);

INSERT INTO communications (
  investigation_id,
  type,
  date,
  participants,
  summary,
  follow_up_required,
  follow_up_notes
) VALUES (
  '5c6ac923-e441-4881-ad62-dfb927c2bb2f',
  'Phone Call',
  NOW() - INTERVAL '2 days',
  ARRAY['Chief Flying Instructor', 'Safety Officer'],
  'Discussion about the incident and scheduling interviews with the pilots involved.',
  true,
  'Need to follow up with the CFI about scheduling a refresher training session on circuit procedures.'
); 