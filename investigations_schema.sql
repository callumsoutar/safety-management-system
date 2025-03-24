-- Investigations Table
CREATE TABLE IF NOT EXISTS investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  lead_investigator_id UUID NOT NULL REFERENCES auth.users(id),
  team_members UUID[] DEFAULT ARRAY[]::UUID[],
  stage TEXT NOT NULL CHECK (stage IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  findings TEXT DEFAULT '',
  root_causes TEXT DEFAULT '',
  contributing_factors TEXT DEFAULT '',
  recommendations TEXT DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Investigations Policies
CREATE POLICY "Users can view investigations they have access to" ON investigations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'investigator', 'safety_officer') OR
        auth.uid() = lead_investigator_id OR
        auth.uid() = ANY(team_members)
      )
    )
  );

CREATE POLICY "Safety team can create investigations" ON investigations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'investigator', 'safety_officer')
    )
  );

CREATE POLICY "Safety team can update investigations" ON investigations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'investigator', 'safety_officer')
    )
  );

-- Interviews Policies
CREATE POLICY "Users can view interviews they have access to" ON interviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM investigations i
      WHERE i.id = interviews.investigation_id
      AND (
        i.lead_investigator_id = auth.uid() OR
        auth.uid() = ANY(i.team_members) OR
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
        auth.uid() = ANY(i.team_members) OR
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
CREATE TRIGGER update_investigations_updated_at
  BEFORE UPDATE ON investigations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 