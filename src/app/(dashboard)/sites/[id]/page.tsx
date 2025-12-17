import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
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
  Project,
  Client,
  TekoAssignmentStatus,
  WorkerWithRelations,
} from "@/types/database";
import { notFound } from "next/navigation";

const AGORA_URL = process.env.NEXT_PUBLIC_AGORA_URL || "http://localhost:3000";

const PROJECT_STATUS_LABELS: Record<string, string> = {
  inquiry: "問合せ",
  estimating: "見積中",
  contracted: "契約済",
  in_progress: "進行中",
  completed: "完了",
  on_hold: "保留",
  cancelled: "キャンセル",
};

const PROJECT_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  inquiry: "outline",
  estimating: "outline",
  contracted: "secondary",
  in_progress: "default",
  completed: "secondary",
  on_hold: "outline",
  cancelled: "destructive",
};

const ASSIGNMENT_STATUS_LABELS: Record<TekoAssignmentStatus, string> = {
  scheduled: "予定",
  confirmed: "確定",
  in_progress: "作業中",
  completed: "完了",
  cancelled: "キャンセル",
};

const ASSIGNMENT_STATUS_VARIANTS: Record<
  TekoAssignmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  scheduled: "outline",
  confirmed: "secondary",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

type ProjectWithClient = Project & {
  clients: Client | null;
};

type AssignmentWithWorker = {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: TekoAssignmentStatus;
  notes: string | null;
  workers: WorkerWithRelations | null;
};

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 現場（プロジェクト）情報を取得
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      *,
      clients:client_id (
        id,
        name,
        contact_name,
        phone,
        email
      )
    `,
    )
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const typedProject = project as ProjectWithClient;

  // この現場の配置情報を取得
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
      workers:worker_id (
        id,
        display_name,
        worker_type,
        is_active,
        users:user_id (
          id,
          name,
          phone
        ),
        partners:partner_id (
          id,
          name
        )
      )
    `,
    )
    .eq("project_id", id)
    .order("date", { ascending: false })
    .limit(100);

  const typedAssignments = (assignments ?? []) as AssignmentWithWorker[];

  // 今日の日付
  const today = new Date().toISOString().split("T")[0];

  // 今後の配置と過去の配置を分離
  const upcomingAssignments = typedAssignments.filter((a) => a.date >= today);
  const pastAssignments = typedAssignments.filter((a) => a.date < today);

  // 今日配置されている職人を抽出
  const todayAssignments = typedAssignments.filter((a) => a.date === today);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sites">
              <ArrowLeft className="h-4 w-4 mr-2" />
              一覧に戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{typedProject.name}</h1>
            <p className="text-gray-500">{typedProject.project_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/assignments/new?project_id=${id}`}>配置を追加</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`${AGORA_URL}/projects/${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              AGORAで表示
            </a>
          </Button>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              現場情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="space-y-1">
                <dt className="text-sm text-gray-500">ステータス</dt>
                <dd>
                  <Badge
                    variant={
                      PROJECT_STATUS_VARIANTS[typedProject.status] ?? "outline"
                    }
                  >
                    {PROJECT_STATUS_LABELS[typedProject.status] ??
                      typedProject.status}
                  </Badge>
                </dd>
              </div>

              {typedProject.address && (
                <div className="space-y-1">
                  <dt className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    住所
                  </dt>
                  <dd className="font-medium">{typedProject.address}</dd>
                </div>
              )}

              <div className="space-y-1">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  期間
                </dt>
                <dd className="font-medium">
                  {typedProject.start_date || typedProject.end_date ? (
                    <span>
                      {typedProject.start_date ?? "未定"} 〜{" "}
                      {typedProject.end_date ?? "未定"}
                    </span>
                  ) : (
                    <span className="text-gray-400">未設定</span>
                  )}
                </dd>
              </div>

              {typedProject.description && (
                <div className="space-y-1">
                  <dt className="text-sm text-gray-500">説明</dt>
                  <dd className="text-sm">{typedProject.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              顧客情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typedProject.clients ? (
              <dl className="space-y-4">
                <div className="space-y-1">
                  <dt className="text-sm text-gray-500">顧客名</dt>
                  <dd className="font-medium">{typedProject.clients.name}</dd>
                </div>

                {typedProject.clients.contact_name && (
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">担当者</dt>
                    <dd className="font-medium">
                      {typedProject.clients.contact_name}
                    </dd>
                  </div>
                )}

                {typedProject.clients.phone && (
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      電話番号
                    </dt>
                    <dd className="font-medium">
                      {typedProject.clients.phone}
                    </dd>
                  </div>
                )}

                {typedProject.clients.email && (
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">メール</dt>
                    <dd className="font-medium">
                      {typedProject.clients.email}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="text-gray-400">顧客情報が登録されていません</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 本日の配置 */}
      {todayAssignments.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary">本日の配置</CardTitle>
            <CardDescription>
              {todayAssignments.length} 名が配置されています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {todayAssignments.map((assignment) => {
                const worker = assignment.workers;
                const workerName =
                  worker?.display_name || worker?.users?.name || "名前未設定";
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-2 bg-muted p-3 rounded-lg"
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{workerName}</div>
                      <div className="text-xs text-gray-500">
                        {assignment.start_time && assignment.end_time
                          ? `${assignment.start_time} - ${assignment.end_time}`
                          : assignment.start_time || "時間未定"}
                      </div>
                    </div>
                    <Badge
                      variant={ASSIGNMENT_STATUS_VARIANTS[assignment.status]}
                    >
                      {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 今後の配置予定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            配置予定
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
                  <TableHead>職人</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAssignments.map((assignment) => {
                  const worker = assignment.workers;
                  const workerName =
                    worker?.display_name || worker?.users?.name || "名前未設定";
                  const companyName = worker?.partners?.name;

                  return (
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
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{workerName}</div>
                            {companyName && (
                              <div className="text-xs text-gray-500">
                                {companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ASSIGNMENT_STATUS_VARIANTS[assignment.status]
                          }
                        >
                          {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/assignments/${assignment.id}`}>
                            詳細
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  <TableHead>職人</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastAssignments.slice(0, 20).map((assignment) => {
                  const worker = assignment.workers;
                  const workerName =
                    worker?.display_name || worker?.users?.name || "名前未設定";

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.date}
                      </TableCell>
                      <TableCell>
                        {assignment.start_time && assignment.end_time
                          ? `${assignment.start_time} - ${assignment.end_time}`
                          : assignment.start_time || "-"}
                      </TableCell>
                      <TableCell>{workerName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ASSIGNMENT_STATUS_VARIANTS[assignment.status]
                          }
                        >
                          {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
