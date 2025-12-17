import Link from "next/link";
import { Plus } from "lucide-react";
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
import type { TekoWorker } from "@/types/database";

export default async function WorkersPage() {
  const supabase = await createClient();

  const { data: workers, error } = await supabase
    .from("teko_workers")
    .select("*")
    .order("name");

  if (error) {
    console.error("Database error:", error.message);
    throw new Error("職人データの取得に失敗しました");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">職人一覧</h1>
          <p className="text-gray-500">登録されている職人の管理</p>
        </div>
        <Button asChild>
          <Link href="/workers/new">
            <Plus />
            新規登録
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>職人リスト</CardTitle>
          <CardDescription>
            {workers?.length ?? 0} 名の職人が登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workers && workers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>スキル</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker: TekoWorker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>{worker.company_name ?? "-"}</TableCell>
                    <TableCell>{worker.phone ?? "-"}</TableCell>
                    <TableCell>{worker.email ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {worker.skills && worker.skills.length > 0 ? (
                          worker.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
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
            <p className="text-center text-gray-500 py-8">
              職人が登録されていません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
