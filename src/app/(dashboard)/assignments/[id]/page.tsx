"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, ArrowLeft, Save } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type {
  Project,
  TekoAssignmentStatus,
  WorkerWithRelations,
} from "@/types/database";

const STATUS_OPTIONS: { value: TekoAssignmentStatus; label: string }[] = [
  { value: "scheduled", label: "予定" },
  { value: "confirmed", label: "確定" },
  { value: "in_progress", label: "作業中" },
  { value: "completed", label: "完了" },
  { value: "cancelled", label: "キャンセル" },
];

const STATUS_VARIANTS: Record<
  TekoAssignmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  scheduled: "outline",
  confirmed: "secondary",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const assignmentSchema = z.object({
  worker_id: z.string().min(1, "職人を選択してください"),
  project_id: z.string().min(1, "現場を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  status: z.enum([
    "scheduled",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  notes: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

type Assignment = {
  id: string;
  worker_id: string;
  project_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: TekoAssignmentStatus;
  notes: string | null;
};

export default function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [workers, setWorkers] = useState<WorkerWithRelations[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  const currentStatus = watch("status");

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      const [assignmentRes, workersRes, projectsRes] = await Promise.all([
        supabase.from("teko_assignments").select("*").eq("id", id).single(),
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

      if (assignmentRes.error) {
        setError("配置データの取得に失敗しました");
        setLoadingData(false);
        return;
      }

      const assignmentData = assignmentRes.data as Assignment;
      setAssignment(assignmentData);

      // フォームに値をセット
      setValue("worker_id", assignmentData.worker_id);
      setValue("project_id", assignmentData.project_id);
      setValue("date", assignmentData.date);
      setValue("start_time", assignmentData.start_time ?? "");
      setValue("end_time", assignmentData.end_time ?? "");
      setValue("status", assignmentData.status);
      setValue("notes", assignmentData.notes ?? "");

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
  }, [id, supabase, setValue]);

  const onSubmit = async (data: AssignmentFormData) => {
    setLoading(true);
    setError(null);

    const updateData = {
      worker_id: data.worker_id,
      project_id: data.project_id,
      date: data.date,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      status: data.status,
      notes: data.notes || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("teko_assignments") as any)
      .update(updateData)
      .eq("id", id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/assignments?date=${data.date}`);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("teko_assignments") as any)
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }

    router.push(`/assignments?date=${assignment?.date}`);
    router.refresh();
  };

  const handleStatusChange = async (newStatus: TekoAssignmentStatus) => {
    setValue("status", newStatus, { shouldDirty: true });

    // 即時更新（オプション）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("teko_assignments") as any)
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setAssignment((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/assignments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              配置データが見つかりません
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/assignments?date=${assignment.date}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">配置編集</h1>
            <p className="text-gray-500">配置情報を編集します</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "削除中..." : "削除"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>配置を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。配置データは完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* ステータス変更 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ステータス</CardTitle>
          <CardDescription>
            クリックするとすぐにステータスが更新されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={
                  currentStatus === option.value
                    ? STATUS_VARIANTS[option.value]
                    : "outline"
                }
                className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                  currentStatus === option.value
                    ? "ring-2 ring-offset-2 ring-primary"
                    : "opacity-60 hover:opacity-100"
                }`}
                onClick={() => handleStatusChange(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 編集フォーム */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>配置情報</CardTitle>
          <CardDescription>
            職人と現場を選択して配置を更新してください
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  value={watch("worker_id")}
                  onValueChange={(value) =>
                    setValue("worker_id", value, { shouldDirty: true })
                  }
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
                  value={watch("project_id")}
                  onValueChange={(value) =>
                    setValue("project_id", value, { shouldDirty: true })
                  }
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
                  進行中の現場がありません。
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
              <Button type="submit" disabled={loading || !isDirty}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "保存中..." : "保存する"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/assignments?date=${assignment.date}`}>
                  キャンセル
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
