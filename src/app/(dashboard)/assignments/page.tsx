import Link from "next/link";
import { Plus, Calendar, User, Building2, Clock, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TekoAssignmentStatus } from "@/types/database";

const STATUS_LABELS: Record<TekoAssignmentStatus, string> = {
  scheduled: "予定",
  confirmed: "確定",
  in_progress: "作業中",
  completed: "完了",
  cancelled: "キャンセル",
};

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

type AssignmentWithRelations = {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: TekoAssignmentStatus;
  notes: string | null;
  workers: {
    id: string;
    display_name: string | null;
    users: {
      id: string;
      name: string;
      phone: string | null;
    } | null;
  } | null;
  projects: {
    id: string;
    name: string;
    address: string | null;
  } | null;
};

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // デフォルトは今日の日付
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = params.date || today;

  // 配置データを取得（職人・業者と現場をJOIN）
  const { data: assignments, error } = await supabase
    .from("teko_assignments")
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      notes,
      workers:worker_id (
        id,
        display_name,
        users:user_id (
          id,
          name,
          phone
        )
      ),
      projects:project_id (
        id,
        name,
        address
      )
    `,
    )
    .eq("date", selectedDate)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Database error:", error.message);
    throw new Error("配置データの取得に失敗しました");
  }

  const typedAssignments = assignments as AssignmentWithRelations[];

  // 前後の日付を計算
  const currentDate = new Date(selectedDate);
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${days[date.getDay()]}）`;
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.slice(0, 5); // HH:MM形式
  };

  // 職人・業者名を取得
  const getWorkerName = (worker: AssignmentWithRelations["workers"]) => {
    if (!worker) return "-";
    return worker.display_name || worker.users?.name || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">配置管理</h1>
          <p className="text-gray-500">職人・業者の現場配置を管理</p>
        </div>
        <Button asChild>
          <Link href={`/assignments/new?date=${selectedDate}`}>
            <Plus />
            新規配置
          </Link>
        </Button>
      </div>

      {/* 日付ナビゲーション */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link
                href={`/assignments?date=${prevDate.toISOString().split("T")[0]}`}
              >
                前日
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-semibold">
                {formatDate(selectedDate)}
              </span>
              {selectedDate === today && <Badge variant="default">今日</Badge>}
            </div>
            <Button variant="outline" asChild>
              <Link
                href={`/assignments?date=${nextDate.toISOString().split("T")[0]}`}
              >
                翌日
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 配置一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>配置一覧</CardTitle>
          <CardDescription>
            {typedAssignments?.length ?? 0} 件の配置があります
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typedAssignments && typedAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>時間</TableHead>
                  <TableHead>職人・業者</TableHead>
                  <TableHead>現場</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>備考</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      {assignment.start_time || assignment.end_time ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {formatTime(assignment.start_time) ?? "--:--"}
                            {" 〜 "}
                            {formatTime(assignment.end_time) ?? "--:--"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">時間未定</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.workers ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {getWorkerName(assignment.workers)}
                            </div>
                            {assignment.workers.users?.phone && (
                              <div className="text-xs text-gray-500">
                                {assignment.workers.users.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.projects ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {assignment.projects.name}
                            </div>
                            {assignment.projects.address && (
                              <div className="text-xs text-gray-500">
                                {assignment.projects.address}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[assignment.status]}>
                        {STATUS_LABELS[assignment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {assignment.notes || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/assignments/${assignment.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">この日の配置はありません</p>
              <Button className="mt-4" asChild>
                <Link href={`/assignments/new?date=${selectedDate}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  配置を追加
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
