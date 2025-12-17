"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, WorkerWithRelations } from "@/types/database";

const assignmentSchema = z.object({
  worker_id: z.string().min(1, "職人を選択してください"),
  project_id: z.string().min(1, "現場を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  notes: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export default function NewAssignmentPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<WorkerWithRelations[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const defaultDate =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      date: defaultDate,
    },
  });

  // 職人と現場のデータを取得
  useEffect(() => {
    const fetchData = async () => {
      const [workersRes, projectsRes] = await Promise.all([
        supabase
          .from("workers")
          .select(
            `
            *,
            users:user_id (id, name, phone),
            partners:partner_id (id, name)
          `,
          )
          .eq("is_active", true)
          .order("display_name"),
        supabase
          .from("projects")
          .select("*")
          .in("status", ["contracted", "in_progress"])
          .order("name"),
      ]);

      if (workersRes.error) {
        console.error("Failed to fetch workers:", workersRes.error);
      } else {
        setWorkers((workersRes.data as WorkerWithRelations[]) ?? []);
      }

      if (projectsRes.error) {
        console.error("Failed to fetch projects:", projectsRes.error);
      } else {
        setProjects((projectsRes.data as Project[]) ?? []);
      }

      setLoadingData(false);
    };

    fetchData();
  }, [supabase]);

  const onSubmit = async (data: AssignmentFormData) => {
    setLoading(true);
    setError(null);

    const insertData = {
      worker_id: data.worker_id,
      project_id: data.project_id,
      date: data.date,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      notes: data.notes || null,
      status: "scheduled" as const,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("teko_assignments") as any).insert(
      insertData,
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/assignments?date=${data.date}`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">配置登録</h1>
        <p className="text-gray-500">職人を現場に配置します</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>配置情報</CardTitle>
          <CardDescription>
            職人と現場を選択して配置を登録してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8 text-gray-500">
              データを読み込み中...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  日付 <span className="text-red-500">*</span>
                </Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="worker_id">
                  職人 <span className="text-red-500">*</span>
                </Label>
                {workers.length > 0 ? (
                  <Select
                    onValueChange={(value) => setValue("worker_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="職人を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => {
                        const name =
                          worker.display_name ||
                          worker.users?.name ||
                          "名前未設定";
                        const company = worker.partners?.name;
                        return (
                          <SelectItem key={worker.id} value={worker.id}>
                            {name}
                            {company && ` (${company})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-500">
                    職人が登録されていません。
                    <Link
                      href="/workers/new"
                      className="text-blue-500 underline ml-1"
                    >
                      職人を登録
                    </Link>
                  </p>
                )}
                {errors.worker_id && (
                  <p className="text-sm text-red-500">
                    {errors.worker_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_id">
                  現場 <span className="text-red-500">*</span>
                </Label>
                {projects.length > 0 ? (
                  <Select
                    onValueChange={(value) => setValue("project_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="現場を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                          {project.address && (
                            <span className="text-gray-500 ml-2">
                              ({project.address})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-500">
                    進行中の現場がありません。AGORAで案件を作成してください。
                  </p>
                )}
                {errors.project_id && (
                  <p className="text-sm text-red-500">
                    {errors.project_id.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_time">開始時間</Label>
                  <Input
                    id="start_time"
                    type="time"
                    {...register("start_time")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">終了時間</Label>
                  <Input id="end_time" type="time" {...register("end_time")} />
                </div>
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
                <Button
                  type="submit"
                  disabled={
                    loading || workers.length === 0 || projects.length === 0
                  }
                >
                  {loading ? "登録中..." : "登録する"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/assignments?date=${defaultDate}`}>
                    キャンセル
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
