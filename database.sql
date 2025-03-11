-- Aviation Safety Management System Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for status tracking
CREATE TYPE occurrence_status AS ENUM ('reported', 'in_review', 'under_investigation', 'closed');
CREATE TYPE occurrence_type AS ENUM ('incident', 'accident', 'hazard', 'observation');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE investigation_stage AS ENUM ('not_started', 'data_collection', 'analysis', 'recommendations', 'review', 'completed');
CREATE TYPE action_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE user_role AS ENUM ('admin', 'safety_officer', 'investigator', 'reporter', 'readonly');
CREATE TYPE flight_rules_type AS ENUM ('VFR', 'IFR');
CREATE TYPE flight_type_type AS ENUM ('local', 'cross_country');
CREATE TYPE flight_purpose_type AS ENUM ('solo', 'solo_with_passengers', 'dual_instruction', 'maintenance');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'reporter',
    position TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aircraft table
CREATE TABLE aircraft (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sequence for occurrence numbers
CREATE SEQUENCE IF NOT EXISTS occurrence_number_seq;

-- Occurrence reports table
CREATE TABLE occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occurrence_number TEXT UNIQUE NOT NULL DEFAULT 'OCC-' || LPAD(NEXTVAL('occurrence_number_seq')::TEXT, 6, '0'),
    title TEXT NOT NULL,
    description TEXT,
    occurrence_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    aircraft_id UUID REFERENCES aircraft(id),
    reporter_id UUID REFERENCES profiles(id),
    status occurrence_status NOT NULL DEFAULT 'reported',
    severity severity_level NOT NULL DEFAULT 'low',
    occurrence_type occurrence_type NOT NULL,
    flight_phase TEXT,
    weather_conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Occurrence details table
CREATE TABLE occurrences_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
    flight_rules flight_rules_type,
    flight_type flight_type_type,
    flight_purpose flight_purpose_type,
    suggested_causes TEXT,
    suggested_outcomes TEXT,
    caa_report_submitted BOOLEAN DEFAULT FALSE,
    airport_operator_advised BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Investigations table
CREATE TABLE investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
    lead_investigator_id UUID REFERENCES profiles(id),
    stage investigation_stage NOT NULL DEFAULT 'not_started',
    findings TEXT,
    root_causes TEXT,
    contributing_factors TEXT,
    recommendations TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Investigation updates table
CREATE TABLE investigation_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Corrective actions table
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    assigned_to UUID REFERENCES profiles(id),
    status action_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    occurrence_id UUID REFERENCES occurrences(id),
    investigation_id UUID REFERENCES investigations(id),
    action_id UUID REFERENCES corrective_actions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT attachment_must_have_parent CHECK (
        (occurrence_id IS NOT NULL)::integer +
        (investigation_id IS NOT NULL)::integer +
        (action_id IS NOT NULL)::integer = 1
    )
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard statistics view
CREATE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM occurrences) AS total_occurrences,
    (SELECT COUNT(*) FROM occurrences WHERE status = 'reported') AS reported_occurrences,
    (SELECT COUNT(*) FROM occurrences WHERE status = 'under_investigation') AS active_investigations,
    (SELECT COUNT(*) FROM corrective_actions WHERE status = 'pending') AS pending_actions;

-- Create indexes for performance
CREATE INDEX occurrences_status_idx ON occurrences(status);
CREATE INDEX occurrences_date_idx ON occurrences(occurrence_date);
CREATE INDEX occurrences_type_idx ON occurrences(occurrence_type);
CREATE INDEX investigations_stage_idx ON investigations(stage);
CREATE INDEX actions_status_idx ON corrective_actions(status);
CREATE INDEX actions_due_date_idx ON corrective_actions(due_date);
CREATE INDEX occurrences_details_occurrence_id_idx ON occurrences_details(occurrence_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Only admins can create/update aircraft
CREATE POLICY "Anyone can view aircraft"
  ON aircraft FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert aircraft"
  ON aircraft FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update aircraft"
  ON aircraft FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Occurrences policies
CREATE POLICY "Users can view all occurrences"
  ON occurrences FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can report occurrences"
  ON occurrences FOR INSERT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update occurrences they reported or are assigned to"
  ON occurrences FOR UPDATE
  USING (
    reporter_id = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'safety_officer')
    )
  );

-- Investigation policies
CREATE POLICY "Users can view all investigations"
  ON investigations FOR SELECT
  USING (true);

CREATE POLICY "Only safety officers and admins can create investigations"
  ON investigations FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'safety_officer')
    )
  );

CREATE POLICY "Only assigned investigators, safety officers and admins can update investigations"
  ON investigations FOR UPDATE
  USING (
    lead_investigator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'safety_officer')
    )
  );

-- Function to automatically create an investigation when an occurrence is created
CREATE OR REPLACE FUNCTION create_investigation_for_occurrence()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO investigations (occurrence_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create investigation automatically
CREATE TRIGGER create_investigation_after_occurrence
AFTER INSERT ON occurrences
FOR EACH ROW
EXECUTE FUNCTION create_investigation_for_occurrence();

-- Function to update occurrence status when investigation stage changes
CREATE OR REPLACE FUNCTION update_occurrence_status_on_investigation_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stage = 'not_started' THEN
        UPDATE occurrences SET status = 'in_review' WHERE id = NEW.occurrence_id;
    ELSIF NEW.stage IN ('data_collection', 'analysis', 'recommendations') THEN
        UPDATE occurrences SET status = 'under_investigation' WHERE id = NEW.occurrence_id;
    ELSIF NEW.stage = 'completed' THEN
        UPDATE occurrences SET status = 'closed' WHERE id = NEW.occurrence_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update occurrence status
CREATE TRIGGER update_occurrence_status
AFTER UPDATE ON investigations
FOR EACH ROW
WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
EXECUTE FUNCTION update_occurrence_status_on_investigation_update();

-- Function to automatically create notification when an action is assigned
CREATE OR REPLACE FUNCTION create_notification_for_action_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (
            NEW.assigned_to,
            'New Action Assigned',
            'You have been assigned a new corrective action: ' || NEW.description,
            '/actions/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification on action assignment
CREATE TRIGGER create_notification_after_action_assignment
AFTER INSERT OR UPDATE OF assigned_to ON corrective_actions
FOR EACH ROW
WHEN (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR OLD.assigned_to IS NULL)
EXECUTE FUNCTION create_notification_for_action_assignment();

-- Function to automatically update action status to overdue
CREATE OR REPLACE FUNCTION update_overdue_actions()
RETURNS void AS $$
BEGIN
    UPDATE corrective_actions
    SET status = 'overdue'
    WHERE due_date < CURRENT_DATE
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run daily (requires pg_cron extension enabled by Supabase)
-- SELECT cron.schedule('0 0 * * *', 'SELECT update_overdue_actions()');
-- Alternatively, you can run this function manually or via a serverless function

-- Create initial admin user (you'll need to update this with your user ID after signing up)
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES ('your-auth-user-id', 'admin@example.com', 'Admin User', 'admin');