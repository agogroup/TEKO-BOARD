"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AGORA_URL = process.env.NEXT_PUBLIC_AGORA_URL || "http://localhost:3000";

const navigation = [
  { name: "ダッシュボード", href: "/", icon: "📊" },
  { name: "配置管理", href: "/assignments", icon: "📅" },
  { name: "職人・業者", href: "/workers", icon: "👷" },
  { name: "現場一覧", href: "/sites", icon: "🏗️" },
  {
    name: "業者一覧",
    href: `${AGORA_URL}/partners`,
    icon: "📞",
    external: true,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold">TEKO-BOARD</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) =>
          "external" in item && item.external ? (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <span>{item.icon}</span>
              {item.name}
              <span className="text-xs text-gray-400">↗</span>
            </a>
          ) : (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ),
        )}
      </nav>

      <div className="border-t p-4">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          ログアウト
        </Button>
      </div>
    </div>
  );
}
