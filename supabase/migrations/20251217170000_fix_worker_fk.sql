-- teko_assignments.worker_id の外部キー制約を teko_workers から workers(AGORA) に変更
-- これにより、配置管理でAGORAの職人（workers）を直接参照できるようになる

-- 既存の外部キー制約を削除
ALTER TABLE teko_assignments
DROP CONSTRAINT IF EXISTS teko_assignments_worker_id_fkey;

-- 新しい外部キー制約を追加（workersテーブルを参照）
ALTER TABLE teko_assignments
ADD CONSTRAINT teko_assignments_worker_id_fkey
FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE;
