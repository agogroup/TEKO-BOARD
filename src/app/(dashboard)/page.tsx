import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 本日の配置数を取得
  const today = new Date().toISOString().split("T")[0];
  const { count: todayAssignments } = await supabase
    .from("teko_assignments")
    .select("*", { count: "exact", head: true })
    .eq("date", today);

  // アクティブな職人数を取得
  const { count: activeWorkers } = await supabase
    .from("teko_workers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // アクティブな現場数を取得
  const { count: activeSites } = await supabase
    .from("teko_sites")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-gray-500">TEKO-BOARD 人員配置管理</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>本日の配置</CardDescription>
            <CardTitle className="text-4xl">{todayAssignments ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              {today} の配置数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>登録職人</CardDescription>
            <CardTitle className="text-4xl">{activeWorkers ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              アクティブな職人数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>登録現場</CardDescription>
            <CardTitle className="text-4xl">{activeSites ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              アクティブな現場数
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>今後の予定</CardTitle>
          <CardDescription>TimeChartコンポーネントをここに配置予定</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            旧バージョンのTimeChartロジックを移植予定
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
