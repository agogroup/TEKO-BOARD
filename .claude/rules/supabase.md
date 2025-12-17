---
paths: ["src/**/*.ts", "src/**/*.tsx", "supabase/**"]
description: Supabase データベース操作のルール
---

# Supabase ルール

## クライアントの使い分け

| 場所 | インポート元 | 用途 |
|------|-------------|------|
| Server Component | `@/lib/supabase/server` | データ取得、Server Actions |
| Client Component | `@/lib/supabase/client` | ブラウザでの操作 |
| Middleware | `@/lib/supabase/middleware` | セッション更新 |

```typescript
// Server Component
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("teko_workers").select("*");
}

// Client Component
"use client";
import { createClient } from "@/lib/supabase/client";

export function WorkerForm() {
  const supabase = createClient();
}
```

## テーブル命名規則

- **TEKO専用テーブル**: 必ず `teko_` プレフィックスを付ける
  - `teko_workers`, `teko_sites`, `teko_assignments`
- **AGORA共有テーブル**: プレフィックスなし
  - `projects`, `clients`, `profiles`

## クエリパターン

### 必須: エラーハンドリング

```typescript
// ✅ 正しい
const { data, error } = await supabase
  .from("teko_workers")
  .select("*")
  .eq("is_active", true);

if (error) {
  console.error("Database error:", error.message);
  throw new Error("データの取得に失敗しました");
}

// ❌ 間違い - エラーを無視
const { data } = await supabase.from("teko_workers").select("*");
return data; // error が発生していても気づかない
```

### 必須: 型付きクエリ

```typescript
import type { Database } from "@/types/database";

type Worker = Database["public"]["Tables"]["teko_workers"]["Row"];

const { data } = await supabase
  .from("teko_workers")
  .select("*")
  .returns<Worker[]>();
```

## RLS（Row Level Security）

### 全テーブルで RLS 有効化必須

```sql
ALTER TABLE teko_workers ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーのみアクセス可能
CREATE POLICY "Authenticated users can read workers"
ON teko_workers FOR SELECT
TO authenticated
USING (true);
```

### クエリでも認証チェック

RLS に加えて、アプリケーション層でも確認:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  redirect("/login");
}

// user.id を使ったフィルタリング
const { data } = await supabase
  .from("teko_assignments")
  .select("*")
  .eq("created_by", user.id);
```

## マイグレーション

### ファイル命名規則

```
supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

例: `20251217160000_add_teko_tables.sql`

### マイグレーション内容

```sql
-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS teko_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 有効化
ALTER TABLE teko_workers ENABLE ROW LEVEL SECURITY;

-- 3. ポリシー作成
CREATE POLICY "..." ON teko_workers ...;

-- 4. インデックス作成（必要に応じて）
CREATE INDEX idx_teko_workers_name ON teko_workers(name);
```

## 禁止事項

- `service_role` キーをクライアントサイドで使用しない
- 生SQL文字列の結合（SQLインジェクション対策）
- RLS を無効化したままのテーブル
- エラーハンドリングなしのクエリ
