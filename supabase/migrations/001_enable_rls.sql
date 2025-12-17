-- TEKO-BOARD RLS (Row Level Security) ポリシー設定
-- 実行方法: Supabase Dashboard > SQL Editor でこのスクリプトを実行

-- ============================================
-- 1. RLSを有効化
-- ============================================

ALTER TABLE teko_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teko_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE teko_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teko_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. teko_workers ポリシー
-- ============================================

-- SELECT: 認証済みユーザーのみ閲覧可能
CREATE POLICY "teko_workers_select_authenticated"
  ON teko_workers
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 認証済みユーザーのみ追加可能
CREATE POLICY "teko_workers_insert_authenticated"
  ON teko_workers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: 認証済みユーザーのみ更新可能
CREATE POLICY "teko_workers_update_authenticated"
  ON teko_workers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: 認証済みユーザーのみ削除可能
CREATE POLICY "teko_workers_delete_authenticated"
  ON teko_workers
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 3. teko_sites ポリシー
-- ============================================

CREATE POLICY "teko_sites_select_authenticated"
  ON teko_sites
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teko_sites_insert_authenticated"
  ON teko_sites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "teko_sites_update_authenticated"
  ON teko_sites
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "teko_sites_delete_authenticated"
  ON teko_sites
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 4. teko_assignments ポリシー
-- ============================================

CREATE POLICY "teko_assignments_select_authenticated"
  ON teko_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teko_assignments_insert_authenticated"
  ON teko_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "teko_assignments_update_authenticated"
  ON teko_assignments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "teko_assignments_delete_authenticated"
  ON teko_assignments
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 5. teko_contacts ポリシー
-- ============================================

CREATE POLICY "teko_contacts_select_authenticated"
  ON teko_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teko_contacts_insert_authenticated"
  ON teko_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "teko_contacts_update_authenticated"
  ON teko_contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "teko_contacts_delete_authenticated"
  ON teko_contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 確認用クエリ
-- ============================================

-- RLSが有効か確認
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'teko_%';

-- ポリシー一覧を確認
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename LIKE 'teko_%';
