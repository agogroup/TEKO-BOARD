import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
  console.log("=== DB状態確認 ===\n");

  // 0. workers + users + partners JOIN テスト（問題箇所）
  console.log("0. workers JOIN テスト（タイムアウト原因調査）:");
  const startTime = Date.now();
  const { data: workersJoin, error: workersJoinError } = await supabase
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
    .limit(5);
  const elapsed = Date.now() - startTime;
  console.log(`   経過時間: ${elapsed}ms`);
  if (workersJoinError) {
    console.log("   エラー:", workersJoinError.message);
    console.log("   コード:", workersJoinError.code);
    console.log("   詳細:", workersJoinError.details);
  } else {
    console.log("   取得件数:", workersJoin?.length ?? 0);
    if (workersJoin && workersJoin.length > 0) {
      console.log("   サンプル:", JSON.stringify(workersJoin[0], null, 2));
    }
  }

  // 1. teko_assignments のカラム確認
  console.log("\n1. teko_assignments テーブル確認:");
  const { data: assignmentsSample, error: assignmentsError } = await supabase
    .from("teko_assignments")
    .select("*")
    .limit(1);

  if (assignmentsError) {
    console.log("   エラー:", assignmentsError.message);
  } else {
    const columns = assignmentsSample?.[0]
      ? Object.keys(assignmentsSample[0])
      : [];
    console.log("   カラム:", columns.length > 0 ? columns.join(", ") : "(空)");
    console.log("   site_id存在:", columns.includes("site_id") ? "YES" : "NO");
    console.log(
      "   project_id存在:",
      columns.includes("project_id") ? "YES" : "NO",
    );
  }

  // 2. workers テーブル確認
  console.log("\n2. workers テーブル確認:");
  const { error: workersError } = await supabase
    .from("workers")
    .select("id")
    .limit(1);

  if (workersError) {
    console.log("   エラー:", workersError.message);
  } else {
    console.log("   存在: YES");
  }

  // 3. partners テーブル確認
  console.log("\n3. partners テーブル確認:");
  const { error: partnersError } = await supabase
    .from("partners")
    .select("id")
    .limit(1);

  if (partnersError) {
    console.log("   エラー:", partnersError.message);
  } else {
    console.log("   存在: YES");
  }

  // 4. 旧テーブル確認
  console.log("\n4. 旧テーブル確認:");
  const { error: tekoWorkersError } = await supabase
    .from("teko_workers")
    .select("id")
    .limit(1);
  console.log(
    "   teko_workers:",
    tekoWorkersError ? `エラー: ${tekoWorkersError.message}` : "YES",
  );

  const { error: tekoSitesError } = await supabase
    .from("teko_sites")
    .select("id")
    .limit(1);
  console.log(
    "   teko_sites:",
    tekoSitesError ? `エラー: ${tekoSitesError.message}` : "YES",
  );

  const { error: tekoContactsError } = await supabase
    .from("teko_contacts")
    .select("id")
    .limit(1);
  console.log(
    "   teko_contacts:",
    tekoContactsError ? `エラー: ${tekoContactsError.message}` : "YES",
  );

  // 5. projects テーブル確認
  console.log("\n5. projects テーブル確認:");
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .limit(3);

  if (projectsError) {
    console.log("   エラー:", projectsError.message);
  } else {
    console.log("   レコード数:", projects?.length ?? 0);
  }

  // 6. teko_assignments のカラム構造を直接確認
  console.log("\n6. teko_assignments カラム構造（SQLで確認）:");
  const { data: columns, error: columnsError } = await supabase.rpc(
    "get_table_columns",
    { table_name: "teko_assignments" },
  );
  if (columnsError) {
    // RPCがない場合は別の方法で確認
    console.log("   RPC未定義のため、INSERTテストで確認:");
    const { error: insertError } = await supabase
      .from("teko_assignments")
      .insert({
        worker_id: "00000000-0000-0000-0000-000000000000",
        project_id: "00000000-0000-0000-0000-000000000000",
        date: "2025-01-01",
      })
      .select();

    if (insertError) {
      const msg = insertError.message;
      if (msg.includes("project_id")) {
        console.log("   project_id カラム: 存在");
      } else if (msg.includes("site_id")) {
        console.log("   site_id カラム: 存在（未移行）");
      }
      console.log("   エラー詳細:", msg);
    }
  } else {
    console.log("   カラム:", columns);
  }
}

checkDB().catch(console.error);
