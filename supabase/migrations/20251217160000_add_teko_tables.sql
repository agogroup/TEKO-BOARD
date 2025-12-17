-- =============================================================================
-- TEKO-BOARD データベースマイグレーション
-- 作成日: 2025-12-17
-- =============================================================================

-- =============================================================================
-- ENUM Types
-- =============================================================================

-- 作業種別
CREATE TYPE work_type AS ENUM (
  'garbage',
  'management',
  'interior',
  'light_steel',
  'board',
  'wallpaper',
  'tile_carpet',
  'demolition',
  'electrical',
  'other'
);

-- 配置ステータス
CREATE TYPE assignment_status AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- ワーカー（職人・作業員）
CREATE TABLE teko_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  company_name VARCHAR(200),
  phone VARCHAR(20),
  email VARCHAR(255),
  skills TEXT[],
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 現場（配置先）
CREATE TABLE teko_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 配置スケジュール
CREATE TABLE teko_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES teko_workers(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES teko_sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  work_type work_type NOT NULL DEFAULT 'other',
  status assignment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 連絡先（会社・業者）
CREATE TABLE teko_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  category VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_teko_workers_company_name ON teko_workers(company_name);
CREATE INDEX idx_teko_workers_is_active ON teko_workers(is_active);

CREATE INDEX idx_teko_sites_client_id ON teko_sites(client_id);
CREATE INDEX idx_teko_sites_project_id ON teko_sites(project_id);
CREATE INDEX idx_teko_sites_is_active ON teko_sites(is_active);

CREATE INDEX idx_teko_assignments_worker_id ON teko_assignments(worker_id);
CREATE INDEX idx_teko_assignments_site_id ON teko_assignments(site_id);
CREATE INDEX idx_teko_assignments_date ON teko_assignments(date);
CREATE INDEX idx_teko_assignments_worker_date ON teko_assignments(worker_id, date);
CREATE INDEX idx_teko_assignments_site_date ON teko_assignments(site_id, date);

CREATE INDEX idx_teko_contacts_company_name ON teko_contacts(company_name);
CREATE INDEX idx_teko_contacts_category ON teko_contacts(category);

-- =============================================================================
-- Triggers
-- =============================================================================

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION teko_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teko_workers_updated_at
  BEFORE UPDATE ON teko_workers
  FOR EACH ROW EXECUTE FUNCTION teko_update_updated_at();

CREATE TRIGGER update_teko_sites_updated_at
  BEFORE UPDATE ON teko_sites
  FOR EACH ROW EXECUTE FUNCTION teko_update_updated_at();

CREATE TRIGGER update_teko_assignments_updated_at
  BEFORE UPDATE ON teko_assignments
  FOR EACH ROW EXECUTE FUNCTION teko_update_updated_at();

CREATE TRIGGER update_teko_contacts_updated_at
  BEFORE UPDATE ON teko_contacts
  FOR EACH ROW EXECUTE FUNCTION teko_update_updated_at();

-- =============================================================================
-- Views
-- =============================================================================

CREATE VIEW teko_daily_schedule AS
SELECT
  a.id AS assignment_id,
  a.date,
  a.start_time,
  a.end_time,
  a.work_type,
  a.status,
  a.notes AS assignment_notes,
  w.id AS worker_id,
  w.name AS worker_name,
  w.company_name AS worker_company,
  s.id AS site_id,
  s.name AS site_name,
  s.address AS site_address,
  s.project_id
FROM teko_assignments a
JOIN teko_workers w ON a.worker_id = w.id
JOIN teko_sites s ON a.site_id = s.id
WHERE w.is_active = true
  AND s.is_active = true
ORDER BY a.date, w.company_name, a.start_time;

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- teko_workers
ALTER TABLE teko_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_teko_workers" ON teko_workers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "insert_teko_workers" ON teko_workers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "update_teko_workers" ON teko_workers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "delete_teko_workers" ON teko_workers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- teko_sites
ALTER TABLE teko_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_teko_sites" ON teko_sites
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "insert_teko_sites" ON teko_sites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'member'))
  );

CREATE POLICY "update_teko_sites" ON teko_sites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'member'))
  );

CREATE POLICY "delete_teko_sites" ON teko_sites
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- teko_assignments
ALTER TABLE teko_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_teko_assignments" ON teko_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "insert_teko_assignments" ON teko_assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'member'))
  );

CREATE POLICY "update_teko_assignments" ON teko_assignments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'member'))
  );

CREATE POLICY "delete_teko_assignments" ON teko_assignments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- teko_contacts
ALTER TABLE teko_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_teko_contacts" ON teko_contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "insert_teko_contacts" ON teko_contacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'member'))
  );

CREATE POLICY "update_teko_contacts" ON teko_contacts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'member'))
  );

CREATE POLICY "delete_teko_contacts" ON teko_contacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
