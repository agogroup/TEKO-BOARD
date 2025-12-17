# TEKO-BOARD - Claude Code 開発ルール

## プロジェクト概要

TEKO-BOARD は AGOグループの人員配置管理システムです。
AGORA（現場管理システム）と同じSupabaseプロジェクトを共有し、データ連携を実現します。

## 技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|------------|
| フレームワーク | Next.js (App Router) | 16.x |
| 言語 | TypeScript | 5.x |
| UI ライブラリ | React | 19.x |
| スタイリング | Tailwind CSS | v4 |
| UI コンポーネント | shadcn/ui (New York style) | - |
| データベース | Supabase (PostgreSQL) | - |
| 認証 | Supabase Auth（AGORAと共有） | - |
| 状態管理 | Zustand | 5.x |
| データフェッチ | TanStack React Query | 5.x |
| フォーム | react-hook-form + zod | 7.x / 4.x |

## ディレクトリ構造

```
src/
├── app/                    # App Router ページ
│   ├── (auth)/            # 認証関連ページ（ログイン等）
│   ├── (dashboard)/       # メインダッシュボード（認証必須）
│   └── api/               # API Routes（必要な場合のみ）
├── components/
│   ├── ui/                # shadcn/ui コンポーネント（自動生成）
│   ├── features/          # 機能別コンポーネント（TODO: 作成予定）
│   └── layouts/           # レイアウトコンポーネント
├── lib/
│   ├── supabase/          # Supabase クライアント設定
│   │   ├── server.ts      # Server Component 用
│   │   ├── client.ts      # Client Component 用
│   │   └── middleware.ts  # セッション更新ロジック
│   └── utils.ts           # cn() などのユーティリティ
├── hooks/                 # カスタムフック
├── types/                 # 型定義
│   └── database.ts        # Supabase 型定義
└── proxy.ts               # 認証プロキシ (Next.js 16)
```

## 環境変数

### 必須環境変数 (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aotzgiaefbvbqhrguqdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 環境変数の追加時

1. `.env.local` に追加
2. `.env.local.example` にプレースホルダーを追加
3. 必要に応じて `src/lib/` に型定義を追加

## npm scripts

```bash
npm run dev      # 開発サーバー起動 (localhost:3001)
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint 実行
```

※ AGORAは3000番ポートを使用するため、TEKO-BOARDは3001番を使用

## データベーステーブル（TEKO専用）

| テーブル | 用途 | 主なカラム |
|----------|------|------------|
| teko_workers | 職人・作業者マスタ | name, phone, skills[], hourly_rate |
| teko_sites | 現場マスタ | name, address, client_id, project_id |
| teko_assignments | 配置情報 | worker_id, site_id, date, status |
| teko_contacts | 連絡先マスタ | company_name, contact_name, phone |
| teko_daily_schedule | 日別スケジュールビュー | (VIEW) 配置情報の集計 |

### ステータス値 (teko_assignment_status)

```typescript
type AssignmentStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
```

## 開発ルール

### 1. コンポーネント設計

```typescript
// Server Component（デフォルト）- データ取得を行う
export default async function WorkersPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("teko_workers").select("*");
  return <WorkerList workers={data} />;
}

// Client Component - インタラクションが必要な場合のみ
"use client";
export function WorkerForm() {
  const [state, setState] = useState();
  // ...
}
```

**判断基準**:
- データ取得のみ → Server Component
- useState, useEffect, イベントハンドラ → Client Component
- フォーム → Client Component

### 2. データフェッチ

#### Server Component での取得（推奨）

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teko_workers")
    .select("*")
    .eq("is_active", true);

  if (error) throw error;
  return <WorkerList workers={data} />;
}
```

#### Client Component での取得（React Query使用時）

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teko_workers")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
}
```

### 3. フォーム実装パターン

```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. スキーマ定義
const workerSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  phone: z.string().regex(/^[0-9-]+$/, "電話番号の形式が不正です").optional(),
  email: z.string().email("メールアドレスの形式が不正です").optional(),
  skills: z.array(z.string()).default([]),
});

type WorkerFormData = z.infer<typeof workerSchema>;

// 2. フォームコンポーネント
export function WorkerForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
  });

  const onSubmit = async (data: WorkerFormData) => {
    const supabase = createClient();
    const { error } = await supabase.from("teko_workers").insert(data);
    if (error) {
      // エラー処理
      return;
    }
    // 成功処理
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("name")} />
      {errors.name && <p className="text-destructive">{errors.name.message}</p>}
      <Button type="submit" disabled={isSubmitting}>保存</Button>
    </form>
  );
}
```

### 4. 認証

- AGORAと同じSupabase Authを使用
- 未認証ユーザーは `/login` にリダイレクト
- RLSポリシーで行レベルセキュリティを確保

```typescript
// Layout での認証チェック
export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <div>{children}</div>;
}
```

### 5. スタイリング (Tailwind CSS v4)

#### 基本ルール

- Tailwind CSS のユーティリティクラスを優先
- 複雑なUIは shadcn/ui コンポーネントを使用
- カスタムスタイルは最小限に

#### Tailwind CSS v4 の構文

```css
/* globals.css */
@import "tailwindcss";

/* カスタムバリアント */
@custom-variant dark (&:is(.dark *));

/* テーマ変数 */
@theme inline {
  --color-primary: var(--primary);
  --radius-lg: var(--radius);
}
```

#### shadcn/ui コンポーネント追加

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### 6. エラーハンドリング

```typescript
// Supabase エラーの処理
const { data, error } = await supabase.from("teko_workers").select("*");

if (error) {
  console.error("Database error:", error.message);
  // ユーザーへの表示
  throw new Error("データの取得に失敗しました");
}

// Client Component でのエラー表示
{error && (
  <div className="bg-destructive/10 text-destructive p-4 rounded-md">
    {error.message}
  </div>
)}
```

### 7. Server Actions vs API Routes

| 用途 | 推奨 |
|------|------|
| フォーム送信 | Server Actions |
| CRUD操作 | Server Actions |
| Webhook受信 | API Routes |
| 外部サービス連携 | API Routes |

```typescript
// Server Action の例
"use server";
export async function createWorker(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("teko_workers").insert({
    name: formData.get("name"),
  });
  if (error) throw error;
  revalidatePath("/workers");
}
```

## セキュリティガイドライン

### RLSポリシー

現在のポリシーは基本的な認証チェックのみ。本番環境では以下を検討:

```sql
-- 組織ベースのアクセス制御（将来実装）
CREATE POLICY "Users can only access their organization's data"
ON teko_workers
FOR ALL
USING (
  organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
```

### セキュリティチェックリスト

- [ ] ユーザー入力は必ず zod でバリデーション
- [ ] SQLインジェクション対策（Supabase クライアント使用で自動対策）
- [ ] XSS対策（React の自動エスケープ）
- [ ] 認証が必要なページは Layout で `getUser()` チェック
- [ ] 機密情報は環境変数で管理

## AGORA連携

### 共有リソース

- **Supabase プロジェクト**: `aotzgiaefbvbqhrguqdg`
- **認証**: 同じユーザーテーブルを使用

### データ連携

```typescript
// AGORA の project_id で現場を関連付け
const { data } = await supabase
  .from("teko_sites")
  .select("*, projects(*)")  // AGORAのprojectsテーブルをJOIN
  .eq("project_id", projectId);
```

### テーブル命名規則

- TEKO専用テーブル: `teko_` プレフィックス
- AGORA共有テーブル: プレフィックスなし（projects, clients等）

## Git ワークフロー

### ブランチ命名規則

```
feature/機能名     # 新機能
fix/バグ内容       # バグ修正
refactor/対象     # リファクタリング
```

### コミットメッセージ

```
feat: 職人一覧画面を追加
fix: ログイン時のリダイレクトエラーを修正
refactor: Supabaseクライアントの共通化
docs: READMEを更新
```

## トラブルシューティング

### よくある問題

| 問題 | 解決策 |
|------|--------|
| `Module not found` | `npm install` を実行 |
| Supabase接続エラー | `.env.local` の設定を確認 |
| 型エラー | `npm run build` でエラー箇所を特定 |
| ポート競合 | AGORAが3000を使用中か確認 |

### デバッグ

```typescript
// Supabase クエリのデバッグ
const { data, error, status } = await supabase
  .from("teko_workers")
  .select("*");

console.log({ data, error, status });
```

## 関連システム

- **AGORA**: `/Users/ago/AGORA/` - 現場管理システム
- **Supabase Dashboard**: https://supabase.com/dashboard/project/aotzgiaefbvbqhrguqdg
