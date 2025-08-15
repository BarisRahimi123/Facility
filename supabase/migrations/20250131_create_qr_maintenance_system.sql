-- Create QR codes table for maintenance reporting
CREATE TABLE IF NOT EXISTS maintenance_qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Unique QR code identifier
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('facility', 'building', 'room', 'field')),
    location_name VARCHAR(255) NOT NULL, -- Human-readable location name
    location_details TEXT, -- Additional location details
    qr_url TEXT NOT NULL, -- Full URL for QR code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one location reference is set
    CONSTRAINT qr_single_location CHECK (
        (CASE WHEN building_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN room_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN field_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
    )
);

-- Create issue reports table
CREATE TABLE IF NOT EXISTS maintenance_issue_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    qr_code_id UUID REFERENCES maintenance_qr_codes(id) ON DELETE SET NULL,
    
    -- Issue details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'electrical', 'plumbing', 'hvac', 'structural', 'safety', 
        'cleaning', 'pest_control', 'landscaping', 'equipment', 
        'security', 'other'
    )),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Reporter information
    reported_by UUID REFERENCES users(id),
    reporter_name VARCHAR(255),
    reporter_email VARCHAR(255),
    reporter_phone VARCHAR(50),
    
    -- Location details
    location_type VARCHAR(50) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_details TEXT,
    
    -- Images and attachments
    images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment URLs
    
    -- Status and workflow
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'acknowledged', 'assigned', 'in_progress', 
        'on_hold', 'resolved', 'closed', 'cancelled'
    )),
    task_id UUID REFERENCES maintenance_tasks(id) ON DELETE SET NULL, -- Link to created task
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    resolution_notes TEXT
);

-- Create issue report activity log
CREATE TABLE IF NOT EXISTS maintenance_issue_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_id UUID NOT NULL REFERENCES maintenance_issue_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_qr_codes_facility ON maintenance_qr_codes(facility_id);
CREATE INDEX idx_qr_codes_code ON maintenance_qr_codes(code);
CREATE INDEX idx_qr_codes_location ON maintenance_qr_codes(building_id, room_id, field_id);
CREATE INDEX idx_issue_reports_facility ON maintenance_issue_reports(facility_id);
CREATE INDEX idx_issue_reports_status ON maintenance_issue_reports(status);
CREATE INDEX idx_issue_reports_priority ON maintenance_issue_reports(priority);
CREATE INDEX idx_issue_reports_created ON maintenance_issue_reports(created_at DESC);
CREATE INDEX idx_issue_reports_task ON maintenance_issue_reports(task_id);
CREATE INDEX idx_issue_activities_issue ON maintenance_issue_activities(issue_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_maintenance_qr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_maintenance_qr_codes_updated_at
    BEFORE UPDATE ON maintenance_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_qr_updated_at();

-- Create function to generate unique QR code
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS VARCHAR AS $$
DECLARE
    new_code VARCHAR(50);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random code (e.g., QR-XXXX-XXXX-XXXX)
        new_code := 'QR-' || 
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' ||
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 5, 4)) || '-' ||
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 9, 4));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM maintenance_qr_codes WHERE code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to log issue activities
CREATE OR REPLACE FUNCTION log_issue_activity(
    p_issue_id UUID,
    p_user_id UUID,
    p_action VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO maintenance_issue_activities (
        issue_id, user_id, action, description, old_value, new_value
    ) VALUES (
        p_issue_id, p_user_id, p_action, p_description, p_old_value, p_new_value
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to convert issue to task
CREATE OR REPLACE FUNCTION convert_issue_to_task(
    p_issue_id UUID,
    p_assigned_to UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_issue maintenance_issue_reports;
    v_task_id UUID;
BEGIN
    -- Get issue details
    SELECT * INTO v_issue FROM maintenance_issue_reports WHERE id = p_issue_id;
    
    IF v_issue IS NULL THEN
        RAISE EXCEPTION 'Issue not found';
    END IF;
    
    -- Create maintenance task
    INSERT INTO maintenance_tasks (
        facility_id,
        building_id,
        room_id,
        title,
        description,
        priority,
        status,
        assigned_to,
        created_by,
        due_date,
        metadata
    ) VALUES (
        v_issue.facility_id,
        v_issue.building_id,
        v_issue.room_id,
        v_issue.title,
        v_issue.description || E'\n\n--- Original Issue Report ---\n' || 
        'Category: ' || v_issue.category || E'\n' ||
        'Reported by: ' || COALESCE(v_issue.reporter_name, 'Anonymous') || E'\n' ||
        'Location: ' || v_issue.location_name || 
        COALESCE(E'\n' || v_issue.location_details, ''),
        v_issue.priority,
        'pending',
        p_assigned_to,
        p_user_id,
        CASE 
            WHEN v_issue.priority = 'urgent' THEN NOW() + INTERVAL '1 day'
            WHEN v_issue.priority = 'high' THEN NOW() + INTERVAL '3 days'
            WHEN v_issue.priority = 'medium' THEN NOW() + INTERVAL '7 days'
            ELSE NOW() + INTERVAL '14 days'
        END,
        jsonb_build_object(
            'source', 'issue_report',
            'issue_id', v_issue.id,
            'images', v_issue.images,
            'attachments', v_issue.attachments
        )
    ) RETURNING id INTO v_task_id;
    
    -- Update issue with task reference
    UPDATE maintenance_issue_reports 
    SET task_id = v_task_id, 
        status = 'assigned',
        assigned_at = NOW()
    WHERE id = p_issue_id;
    
    -- Log activity
    PERFORM log_issue_activity(
        p_issue_id,
        p_user_id,
        'task_created',
        'Issue converted to maintenance task',
        NULL,
        jsonb_build_object('task_id', v_task_id)
    );
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE maintenance_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_issue_activities ENABLE ROW LEVEL SECURITY;

-- QR codes: Anyone can read active codes, only staff can manage
CREATE POLICY "Anyone can read active QR codes" ON maintenance_qr_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage QR codes" ON maintenance_qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.user_role IN ('master_admin', 'sub_admin', 'staff')
        )
    );

-- Issue reports: Anyone can create, staff can manage
CREATE POLICY "Anyone can create issue reports" ON maintenance_issue_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view their own reports" ON maintenance_issue_reports
    FOR SELECT USING (
        reported_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.user_role IN ('master_admin', 'sub_admin', 'staff')
        )
    );

CREATE POLICY "Staff can manage issue reports" ON maintenance_issue_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.user_role IN ('master_admin', 'sub_admin', 'staff')
        )
    );

-- Issue activities: Read-only for relevant users
CREATE POLICY "View issue activities" ON maintenance_issue_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM maintenance_issue_reports r
            WHERE r.id = issue_id
            AND (
                r.reported_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.user_role IN ('master_admin', 'sub_admin', 'staff')
                )
            )
        )
    );

-- Grant permissions
GRANT ALL ON maintenance_qr_codes TO authenticated;
GRANT ALL ON maintenance_issue_reports TO authenticated;
GRANT ALL ON maintenance_issue_activities TO authenticated;
GRANT SELECT, INSERT ON maintenance_issue_reports TO anon; -- Allow anonymous issue reporting
GRANT EXECUTE ON FUNCTION generate_qr_code() TO authenticated;
GRANT EXECUTE ON FUNCTION log_issue_activity(UUID, UUID, VARCHAR, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_issue_to_task(UUID, UUID, UUID) TO authenticated;





