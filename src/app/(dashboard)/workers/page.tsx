import { Building2, User, ExternalLink } from "lucide-react";
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
import type { WorkerWithRelations, WorkerType } from "@/types/database";

const AGORA_URL = process.env.NEXT_PUBLIC_AGORA_URL || "http://localhost:3000";

const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  internal: "自社",
  partner: "協力業者",
};

const WORKER_TYPE_VARIANTS: Record<WorkerType, "default" | "secondary"> = {
  internal: "default",
  partner: "secondary",
};

export default async function WorkersPage() {
  const supabase = await createClient();

  // workersテーブルからusersとpartnersをJOINして取得
  const { data: workers, error } = await supabase
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database error:", error.message);
    throw new Error("職人・業者データの取得に失敗しました");
  }

  const typedWorkers = workers as WorkerWithRelations[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">職人・業者一覧</h1>
          <p className="text-gray-500">AGORAで登録された職人・業者を表示</p>
        </div>
        <Button asChild variant="outline">
          <a
            href={`${AGORA_URL}/admin/workers`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            AGORAで管理
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>職人・業者リスト</CardTitle>
          <CardDescription>
            {typedWorkers?.length ?? 0} 名が登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typedWorkers && typedWorkers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>所属</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead>スキル</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {worker.display_name || worker.users?.name || "-"}
                          </div>
                          {worker.users?.email && (
                            <div className="text-xs text-gray-500">
                              {worker.users.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={WORKER_TYPE_VARIANTS[worker.worker_type]}>
                        {WORKER_TYPE_LABELS[worker.worker_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {worker.partners ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div>{worker.partners.name}</div>
                            {worker.partners.category && (
                              <div className="text-xs text-gray-500">
                                {worker.partners.category}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{worker.users?.phone ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {worker.skills && worker.skills.length > 0 ? (
                          worker.skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={worker.is_active ? "default" : "outline"}>
                        {worker.is_active ? "アクティブ" : "非アクティブ"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">職人・業者が登録されていません</p>
              <p className="text-sm text-gray-400 mt-2">
                AGORAで職人・業者を登録してください
              </p>
              <Button className="mt-4" asChild variant="outline">
                <a
                  href={`${AGORA_URL}/admin/workers`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  AGORAで登録
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
