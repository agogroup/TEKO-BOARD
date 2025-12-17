import Link from "next/link";
import { MapPin, Building2, Calendar } from "lucide-react";
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
import type { Project, Client } from "@/types/database";

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

type ProjectWithClient = Project & {
  clients: Client | null;
};

export default async function SitesPage() {
  const supabase = await createClient();

  // AGORAのprojectsテーブルを直接取得（進行中・契約済のみ）
  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      clients:client_id (
        id,
        name,
        contact_name,
        phone
      )
    `,
    )
    .in("status", ["contracted", "in_progress"])
    .order("name");

  if (error) {
    console.error("Database error:", error.message);
    throw new Error("現場データの取得に失敗しました");
  }

  const typedProjects = projects as ProjectWithClient[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">現場一覧</h1>
          <p className="text-gray-500">
            AGORAの案件（契約済・進行中）を現場として表示
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>現場リスト</CardTitle>
          <CardDescription>
            {typedProjects?.length ?? 0} 件の現場があります
          </CardDescription>
        </CardHeader>
        <CardContent>
          {typedProjects && typedProjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>現場名</TableHead>
                  <TableHead>顧客</TableHead>
                  <TableHead>住所</TableHead>
                  <TableHead>期間</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/sites/${project.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-gray-500">
                            {project.project_code}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {project.clients ? (
                        <div>
                          <div className="font-medium">
                            {project.clients.name}
                          </div>
                          {project.clients.contact_name && (
                            <div className="text-xs text-gray-500">
                              {project.clients.contact_name}
                              {project.clients.phone &&
                                ` / ${project.clients.phone}`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {project.address}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.start_date || project.end_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {project.start_date ?? "未定"} 〜{" "}
                            {project.end_date ?? "未定"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          PROJECT_STATUS_VARIANTS[project.status] ?? "outline"
                        }
                      >
                        {PROJECT_STATUS_LABELS[project.status] ??
                          project.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">契約済・進行中の案件がありません</p>
              <p className="text-sm text-gray-400 mt-2">
                AGORAで案件を作成してください
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
