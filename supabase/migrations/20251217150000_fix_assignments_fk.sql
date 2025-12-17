-- teko_assignments.site_id の外部キー制約を teko_sites から projects に変更
-- これにより、配置管理でAGORAの案件（projects）を直接参照できるようになる

-- 既存の外部キー制約を削除
ALTER TABLE teko_assignments
DROP CONSTRAINT IF EXISTS teko_assignments_site_id_fkey;

-- 新しい外部キー制約を追加（projectsテーブルを参照）
ALTER TABLE teko_assignments
ADD CONSTRAINT teko_assignments_site_id_fkey
FOREIGN KEY (site_id) REFERENCES projects(id) ON DELETE CASCADE;

-- カラム名をproject_idに変更（より明確にするため）
ALTER TABLE teko_assignments
RENAME COLUMN site_id TO project_id;
