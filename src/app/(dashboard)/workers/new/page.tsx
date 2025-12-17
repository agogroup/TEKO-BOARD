"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const workerSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  company_name: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9-]*$/, "電話番号は数字とハイフンのみ使用できます")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("正しいメールアドレス形式で入力してください")
    .optional()
    .or(z.literal("")),
  skills: z.string().optional(),
  notes: z.string().optional(),
});

type WorkerFormData = z.infer<typeof workerSchema>;

export default function NewWorkerPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
  });

  const onSubmit = async (data: WorkerFormData) => {
    setLoading(true);
    setError(null);

    const skills = data.skills
      ? data.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

    const insertData = {
      name: data.name,
      company_name: data.company_name || null,
      phone: data.phone || null,
      email: data.email || null,
      skills: skills.length > 0 ? skills : null,
      notes: data.notes || null,
      is_active: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("teko_workers") as any).insert(
      insertData,
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/workers");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">職人登録</h1>
        <p className="text-gray-500">新しい職人を登録します</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>職人情報</CardTitle>
          <CardDescription>必須項目は名前のみです</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                名前 <span className="text-red-500">*</span>
              </Label>
              <Input id="name" placeholder="山田 太郎" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">会社名</Label>
              <Input
                id="company_name"
                placeholder="株式会社○○"
                {...register("company_name")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="090-1234-5678"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">スキル</Label>
              <Input
                id="skills"
                placeholder="大工, 左官, 電気工事（カンマ区切り）"
                {...register("skills")}
              />
              <p className="text-xs text-gray-500">
                複数のスキルはカンマ（,）で区切って入力してください
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Input
                id="notes"
                placeholder="特記事項があれば入力"
                {...register("notes")}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "登録中..." : "登録する"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/workers">キャンセル</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
