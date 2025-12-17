---
paths: ["src/**/*.ts", "src/**/*.tsx"]
description: TypeScript コーディング規約
---

# TypeScript ルール

## 型定義

### any 禁止

```typescript
// ❌ 禁止
const data: any = response;
function process(input: any) {}

// ✅ 正しい
const data: unknown = response;
function process(input: Record<string, unknown>) {}

// 型が明確な場合
interface Worker {
  id: string;
  name: string;
}
const data: Worker = response;
```

### 型アサーション制限

```typescript
// ❌ 禁止
const value = data as any;

// ⚠️ 避ける（必要な場合のみ）
const value = data as Worker;

// ✅ 推奨（型ガード）
function isWorker(obj: unknown): obj is Worker {
  return typeof obj === "object" && obj !== null && "id" in obj;
}

if (isWorker(data)) {
  console.log(data.name);
}
```

### Supabase 型

```typescript
// types/database.ts からインポート
import type { Database } from "@/types/database";

type Worker = Database["public"]["Tables"]["teko_workers"]["Row"];
type WorkerInsert = Database["public"]["Tables"]["teko_workers"]["Insert"];
type WorkerUpdate = Database["public"]["Tables"]["teko_workers"]["Update"];
```

## コンポーネント Props

```typescript
// interface で定義
interface WorkerCardProps {
  worker: Worker;
  onEdit?: (id: string) => void;
  className?: string;
}

export function WorkerCard({ worker, onEdit, className }: WorkerCardProps) {
  // ...
}

// children を含む場合
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}
```

## インポート順序

```typescript
// 1. React/Next.js
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

// 2. 外部ライブラリ
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 3. 内部モジュール（@/ エイリアス）
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { WorkerCard } from "@/components/features/workers/WorkerCard";

// 4. 型定義（type import）
import type { Worker } from "@/types/database";

// 5. 相対パス（同一ディレクトリ）
import { formatDate } from "./utils";
```

## 関数定義

### 戻り値の型を明示

```typescript
// ✅ 明示的な戻り値型
async function getWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase.from("teko_workers").select("*");
  if (error) throw error;
  return data ?? [];
}

// ✅ Server Actions
export async function createWorker(formData: FormData): Promise<{ success: boolean; error?: string }> {
  // ...
}
```

## 禁止パターン

```typescript
// ❌ @ts-ignore 禁止
// @ts-ignore
const value = problematicFunction();

// ❌ @ts-expect-error は理由必須
// @ts-expect-error - TODO: 型定義を修正する (#123)
const temp = legacyFunction();

// ❌ ! 非nullアサーション（可能な限り避ける）
const name = user!.name;

// ✅ 代わりにガード
if (!user) throw new Error("User not found");
const name = user.name;
```

## Enum vs Union Type

```typescript
// ✅ 推奨: Union Type
type AssignmentStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";

// ⚠️ Enum は避ける（必要な場合のみ）
enum Status {
  Scheduled = "scheduled",
  Confirmed = "confirmed",
}
```

## ユーティリティ型の活用

```typescript
// 部分的に必須
type WorkerWithName = Partial<Worker> & Pick<Worker, "name">;

// 読み取り専用
type ReadonlyWorker = Readonly<Worker>;

// 一部除外
type WorkerWithoutId = Omit<Worker, "id" | "created_at">;
```
