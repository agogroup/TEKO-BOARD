import Link from "next/link";
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
import type {
  WorkerWithRelations,
  WorkerType,
  TekoAssignmentStatus,
  Project,
} from "@/types/database";
import { notFound } from "next/navigation";

const AGORA_URL = process.env.NEXT_PUBLIC_AGORA_URL || "http://localhost:3000";

const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  internal: "自社",
  partner: "協力業者",
};

const WORKER_TYPE_VARIANTS: Record<WorkerType, "default" | "secondary"> = {
  internal: "default",
  partner: "secondary",
};

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

type AssignmentWithProject = {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: TekoAssignmentStatus;
  notes: string | null;
  projects: Project | null;
};

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 職人情報を取得
  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .select(
      `
      *,
      users:user_id (
        id,
        name,
        email,
        phone,
        is_active
      ),
      partners:partner_id (
        id,
        name,
        category
      )
    `,
    )
    .eq("id", id)
    .single();

  if (workerError || !worker) {
    notFound();
  }

  const typedWorker = worker as WorkerWithRelations;

  // 配置履歴を取得（新しい順）
  const { data: assignments } = await supabase
    .from("teko_assignments")
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      notes,
      projects:project_id (
        id,
        name,
        address,
        project_code
      )
    `,
    )
    .eq("worker_id", id)
    .order("date", { ascending: false })
    .limit(50);

  const typedAssignments = (assignments ?? []) as AssignmentWithProject[];

  // 今日の日付
  const today = new Date().toISOString().split("T")[0];

  // 今後の予定と過去の配置を分離
  const upcomingAssignments = typedAssignments.filter((a) => a.date >= today);
  const pastAssignments = typedAssignments.filter((a) => a.date < today);

  const workerName =
    typedWorker.display_name || typedWorker.users?.name || "名前未設定";

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              一覧に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{workerName}</h1>
            <p className="text-gray-500">職人詳細</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <a
            href={`${AGORA_URL}/admin/workers/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            AGORAで編集
          </a>
        </Button>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <dt className="text-sm text-gray-500 flex items-center gap-1">
                <User className="h-4 w-4" />
                名前
              </dt>
              <dd className="font-medium">{workerName}</dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm text-gray-500">種別</dt>
              <dd>
                <Badge variant={WORKER_TYPE_VARIANTS[typedWorker.worker_type]}>
                  {WORKER_TYPE_LABELS[typedWorker.worker_type]}
                </Badge>
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm text-gray-500">ステータス</dt>
              <dd>
                <Badge variant={typedWorker.is_active ? "default" : "outline"}>
                  {typedWorker.is_active ? "アクティブ" : "非アクティブ"}
                </Badge>
              </dd>
            </div>

            {typedWorker.partners && (
              <div className="space-y-1">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  所属
                </dt>
                <dd>
                  <div className="font-medium">{typedWorker.partners.name}</div>
                  {typedWorker.partners.category && (
                    <div className="text-sm text-gray-500">
                      {typedWorker.partners.category}
                    </div>
                  )}
                </dd>
              </div>
            )}

            {typedWorker.users?.phone && (
              <div className="space-y-1">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  電話番号
                </dt>
                <dd className="font-medium">{typedWorker.users.phone}</dd>
              </div>
            )}

            {typedWorker.users?.email && (
              <div className="space-y-1">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  メールアドレス
                </dt>
                <dd className="font-medium">{typedWorker.users.email}</dd>
              </div>
            )}

            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <dt className="text-sm text-gray-500">スキル</dt>
              <dd>
                {typedWorker.skills && typedWorker.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {typedWorker.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">登録なし</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 今後の予定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            今後の予定
          </CardTitle>
          <CardDescription>
            {upcomingAssignments.length} 件の配置予定があります
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>現場</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.date}
                    </TableCell>
                    <TableCell>
                      {assignment.start_time && assignment.end_time
                        ? `${assignment.start_time} - ${assignment.end_time}`
                        : assignment.start_time || "-"}
                    </TableCell>
                    <TableCell>
                      {assignment.projects ? (
                        <div>
                          <div className="font-medium">
                            {assignment.projects.name}
                          </div>
                          {assignment.projects.address && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {assignment.projects.address}
                            </div>
                          )}
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/assignments/${assignment.id}`}>詳細</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              今後の配置予定はありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* 過去の配置 */}
      <Card>
        <CardHeader>
          <CardTitle>配置履歴</CardTitle>
          <CardDescription>過去 {pastAssignments.length} 件</CardDescription>
        </CardHeader>
        <CardContent>
          {pastAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>現場</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastAssignments.slice(0, 20).map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.date}
                    </TableCell>
                    <TableCell>
                      {assignment.start_time && assignment.end_time
                        ? `${assignment.start_time} - ${assignment.end_time}`
                        : assignment.start_time || "-"}
                    </TableCell>
                    <TableCell>
                      {assignment.projects ? (
                        <div>
                          <div>{assignment.projects.name}</div>
                          {assignment.projects.address && (
                            <div className="text-xs text-gray-500">
                              {assignment.projects.address}
                            </div>
                          )}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              配置履歴はありません
            </div>
          )}
          {pastAssignments.length > 20 && (
            <div className="text-center pt-4 text-sm text-gray-500">
              他 {pastAssignments.length - 20} 件の履歴があります
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
