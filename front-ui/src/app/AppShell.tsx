import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ScanLine,
  FileSearch,
  FlaskConical,
  BrainCircuit,
  BookText,
  Settings as SettingsIcon,
  SquarePlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import SettingsPage from "../pages/Settings";

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

type NavKey =
  | "dashboard"
  | "create"
  | "blockscan"
  | "results"
  | "poc"
  | "ai"
  | "rules"
  | "settings";

type NavItem = {
  key: NavKey;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "仪表盘", icon: LayoutDashboard },
  { key: "create", label: "创建扫描", icon: SquarePlus },
  { key: "blockscan", label: "区块扫描", icon: ScanLine },
  { key: "results", label: "扫描结果", icon: FileSearch },
  { key: "poc", label: "POC & 模拟", icon: FlaskConical },
  { key: "ai", label: "AI 复查", icon: BrainCircuit },
  { key: "rules", label: "规则库", icon: BookText },
  { key: "settings", label: "设置", icon: SettingsIcon },
];

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<NavKey>("settings"); // 方便你调试设置页

  useEffect(() => {
    document.title = "Oz-ByteSeek智能合约漏洞检测平台";
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("ozb-nav-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("ozb-nav-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="h-screen w-screen bg-zinc-50 text-zinc-900 flex flex-col overflow-hidden">
      {/* 主区：侧栏 + 内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧栏 */}
        <aside
          className={cx(
            "relative h-full bg-zinc-950 text-zinc-100 transition-all duration-300 border-r border-zinc-800"
          )}
          style={{ width: collapsed ? 72 : "14.2857%" }} // 1/7
        >
          <button
            aria-label={collapsed ? "展开导航" : "收起导航"}
            className={cx(
              "absolute right-[-12px] top-1/2 -translate-y-1/2 z-20",
              "h-8 w-8 rounded-full shadow-md border border-zinc-300",
              "bg-white text-zinc-900 flex items-center justify-center"
            )}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {!collapsed ? (
            <div className="h-full flex flex-col">
              <div className="h-16 border-b border-zinc-800 flex items-center justify-center">
                <div className="flex items-center justify-center gap-3">
                  <img src="/logo.svg" alt="Oz-ByteSeek" className="h-8 w-8" />
                  <div className="font-semibold tracking-wide">Oz-ByteSeek</div>
                </div>
              </div>
              <nav className="flex-1 overflow-auto py-4">
                <ul className="px-2 space-y-1">
                  {NAV_ITEMS.map((it) => (
                    <li key={it.key}>
                      <button
                        className={cx(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl",
                          "transition-colors",
                          active === it.key
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        )}
                        onClick={() => setActive(it.key)}
                      >
                        <it.icon size={18} />
                        <span className="text-sm">{it.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="h-4" />
            </div>
          ) : (
            <div className="h-full w-full flex flex-col">
              <div className="h-16 border-b border-zinc-800 flex items-center justify-center">
                <img src="/logo.svg" alt="Oz-ByteSeek" className="h-8 w-8" />
              </div>
              <nav className="flex-1 overflow-auto py-4">
                <ul className="flex flex-col items-center gap-2">
                  {NAV_ITEMS.map((it) => (
                    <li key={it.key}>
                      <button
                        className={cx(
                          "h-10 w-10 flex items-center justify-center rounded-xl",
                          "transition-colors",
                          active === it.key
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        )}
                        onClick={() => setActive(it.key)}
                        aria-label={it.label}
                        title={it.label}
                      >
                        <it.icon size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </aside>

        {/* 右侧内容区：注意这里的高度/滚动处理 */}
        <main className="flex-1 h-full overflow-hidden">
          {/* 关键修改1：让列容器本身有高度并允许子项撑满 */}
          <div className="h-full min-h-0 flex flex-col">
            {/* 顶部条：固定 56px (h-14) */}
            <div className="h-14 bg-white border-b border-zinc-200 flex items-center px-6">
              <div className="font-medium">{labelOf(active)}</div>
            </div>

            {/* 关键修改2：设置页去掉 padding/滚动，给子项可用的满高 */}
            <div
              className={cx(
                "flex-1 min-h-0", // 允许子级占满剩余高度
                active === "settings"
                  ? "overflow-hidden p-0"
                  : "overflow-auto p-6"
              )}
            >
              {active === "settings" ? (
                <SettingsPage />
              ) : (
                <div className="h-full overflow-auto p-6">
                  <Placeholder label={labelOf(active)} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function labelOf(key: NavKey): string {
  const m = new Map(NAV_ITEMS.map((i) => [i.key, i.label] as const));
  return m.get(key) || "";
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="grid place-items-center h-full">
      <div className="max-w-2xl text-center">
        <div className="text-2xl font-semibold mb-2">{label}</div>
        <p className="text-zinc-500 text-sm">
          这里将呈现“{label}”页面的具体内容。当前为布局占位，页面外层固定且不滚动，
          内容区域可滚动。左侧导航可收起，折叠时仅显示各栏目的图标。
        </p>
      </div>
    </div>
  );
}
