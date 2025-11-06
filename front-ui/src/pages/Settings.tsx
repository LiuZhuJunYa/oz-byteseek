// front-ui/src/pages/Settings.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Link2,
  Save,
  TestTube2,
  ShieldCheck,
  ShieldX,
  Loader2,
} from "lucide-react";

/* ============== 小图标（内联） ============== */
type IconProps = { size?: number; className?: string };

const EthIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    aria-hidden
  >
    {/* 简化版以太坊菱形 */}
    <path d="M12 2L4 12l8 5 8-5-8-10z" fill="#627EEA" />
    <path d="M4 13l8 9 8-9-8 4.8L4 13z" fill="#8BA2FF" />
  </svg>
);

const SepoliaIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    aria-hidden
  >
    {/* 用以太坊形状 + testnet 紫色表现 */}
    <path d="M12 2L4 12l8 5 8-5-8-10z" fill="#7C3AED" />
    <path d="M4 13l8 9 8-9-8 4.8L4 13z" fill="#A78BFA" />
  </svg>
);

const BnbIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    aria-hidden
  >
    {/* 简化版 BNB 斜菱形组合 */}
    <rect x="10.2" y="2" width="3.6" height="3.6" transform="rotate(45 10.2 2)" fill="#F0B90B"/>
    <rect x="4.2" y="8" width="3.6" height="3.6" transform="rotate(45 4.2 8)" fill="#F0B90B"/>
    <rect x="16.2" y="8" width="3.6" height="3.6" transform="rotate(45 16.2 8)" fill="#F0B90B"/>
    <rect x="10.2" y="8" width="3.6" height="3.6" transform="rotate(45 10.2 8)" fill="#F0B90B"/>
    <rect x="10.2" y="14" width="3.6" height="3.6" transform="rotate(45 10.2 14)" fill="#F0B90B"/>
  </svg>
);

/* ============== 类型 & 常量 ============== */
type NetKey = "ethereum" | "sepolia" | "bnb";
type ExplorerKey = "etherscan_mainnet" | "etherscan_sepolia" | "bscscan";
type ProxyKey = "http" | "https";
type TestStatus = "未测试" | "测试中" | "成功" | "失败";

type RpcState = Record<NetKey, string>;
type ExplState = Record<ExplorerKey, string>;
type ProxyState = Record<ProxyKey, string>;

const LS_RPC = "ozb_rpc";
const LS_EXPL = "ozb_explorer_keys";
const LS_PROXY = "ozb_proxies";

const initRpc: RpcState = { ethereum: "", sepolia: "", bnb: "" };
const initExpl: ExplState = {
  etherscan_mainnet: "",
  etherscan_sepolia: "",
  bscscan: "",
};
const initProxy: ProxyState = { http: "", https: "" };

/* ============== 小组件 ============== */
const TitleChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex items-center px-2 py-0.5 text-[12px] border rounded bg-gray-50">
    {children}
  </div>
);

const Panel: React.FC<
  { title: string; children: React.ReactNode; className?: string }
> = ({ title, children, className }) => (
  <div className={"min-h-0 rounded-lg border bg-white p-3 shadow-sm " + (className || "")}>
    <div className="mb-2">
      <TitleChip>{title}</TitleChip>
    </div>
    <div className="text-[13px]">{children}</div>
  </div>
);

/** 左侧表单（更紧凑；输入框更长；保存列更窄） */
const FieldBlock: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saved?: boolean;
  placeholder?: string;
}> = ({ icon: Icon, label, value, onChange, onSave, saved, placeholder }) => (
  <div className="py-1.5">
    {/* 行1：名称（紧凑） */}
    <div className="flex items-center gap-2 mb-1 whitespace-nowrap">
      <Icon size={16} className="text-zinc-600" />
      <span className="font-medium">{label}</span>
    </div>

    {/* 行2：输入列更长；保存列收窄到 ~110-160px；整体 gap 变小 */}
    <div className="grid grid-cols-[1fr_minmax(110px,140px)] items-center gap-1.5">
      <input
        className="min-w-0 w-full px-2 py-1.5 border rounded outline-none focus:ring text-[13px]"
        value={value}
        placeholder={placeholder || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center justify-end gap-1.5 pr-1">
        {saved ? (
          <span className="text-[11px] text-green-600 inline-flex items-center gap-1">
            <ShieldCheck size={13} />
            已保存
          </span>
        ) : (
          <span className="text-[11px] text-transparent select-none">占位</span>
        )}
        <button
          onClick={onSave}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-900 text-white hover:bg-zinc-800 text-[12px]"
          type="button"
        >
          <Save size={13} />
          保存
        </button>
      </div>
    </div>
  </div>
);

/** 右侧信息行（更紧凑：py-1 & text-xs） */
const InfoLineSplit: React.FC<{
  icon: React.ElementType;
  title: string;
  aLabel: string;
  aValue: string;
  bLabel?: string;
  bValue?: string;
}> = ({ icon: Icon, title, aLabel, aValue, bLabel, bValue }) => {
  const twoCols = bLabel !== undefined;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-2 py-2 border rounded">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Icon size={16} className="text-zinc-600" />
        <span className="text-[13px]">{title}</span>
      </div>
      <div className="min-w-0" />
      {twoCols ? (
        <div className="grid grid-cols-[56px_80px_16px_92px_80px] items-center text-[12px] text-zinc-600">
          <span className="justify-self-end">{aLabel}</span>
          <span className="justify-self-start pl-1">{aValue}</span>
          <span className="justify-self-center opacity-60">｜</span>
          <span className="justify-self-end">{bLabel}</span>
          <span className="justify-self-start pl-1">{bValue}</span>
        </div>
      ) : (
        <div className="grid grid-cols-[56px_80px] items-center text-[12px] text-zinc-600">
          <span className="justify-self-end">{aLabel}</span>
          <span className="justify-self-start pl-1">{aValue}</span>
        </div>
      )}
    </div>
  );
};

/** 右侧“测试”行（更紧凑：py-1 & text-xs） */
const TestLine: React.FC<{
  title: string;
  status: TestStatus;
  onTest: () => void;
}> = ({ title, status, onTest }) => (
  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-2 py-2 border rounded">
    <div className="min-w-0 truncate flex items-center gap-2">
      <TestTube2 size={15} className="text-zinc-600 shrink-0" />
      <span className="truncate text-[13px]">{title}</span>
    </div>
    <div className="shrink-0 text-[11px]">
      {status === "未测试" && <span className="text-zinc-500">未测试</span>}
      {status === "测试中" && (
        <span className="inline-flex items-center gap-1 text-amber-600">
          <Loader2 size={13} className="animate-spin" />
          测试中
        </span>
      )}
      {status === "成功" && (
        <span className="inline-flex items-center gap-1 text-green-600">
          <ShieldCheck size={12} /> √
        </span>
      )}
      {status === "失败" && (
        <span className="inline-flex items-center gap-1 text-red-600">
          <ShieldX size={12} /> 失败
        </span>
      )}
    </div>
    <button
      className="text-[11px] px-2 py-1 border rounded hover:bg-gray-50"
      onClick={onTest}
      type="button"
    >
      测试
    </button>
  </div>
);

/* ============== 主页面 ============== */
export default function SettingsPage() {
  const [rpc, setRpc] = useState<RpcState>(initRpc);
  const [expl, setExpl] = useState<ExplState>(initExpl);
  const [proxy, setProxy] = useState<ProxyState>(initProxy);

  const [savedRpc, setSavedRpc] = useState<Record<NetKey, boolean>>({
    ethereum: false,
    sepolia: false,
    bnb: false,
  });
  const [savedExpl, setSavedExpl] = useState<Record<ExplorerKey, boolean>>({
    etherscan_mainnet: false,
    etherscan_sepolia: false,
    bscscan: false,
  });
  const [savedProxy, setSavedProxy] = useState<Record<ProxyKey, boolean>>({
    http: false,
    https: false,
  });

  const [tests, setTests] = useState<Record<string, TestStatus>>({
    "Ethereum（RPC）": "未测试",
    "Sepolia（RPC）": "未测试",
    "BNB Chain（RPC）": "未测试",
    "Etherscan（Mainnet）（Explorer）": "未测试",
    "Etherscan（Sepolia）（Explorer）": "未测试",
    "BscScan（Explorer）": "未测试",
    "http 代理配置": "未测试",
    "https 代理配置": "未测试",
  });

  // 载入本地存储
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(LS_RPC) || "null");
      if (r) setRpc({ ...initRpc, ...r });
      const e = JSON.parse(localStorage.getItem(LS_EXPL) || "null");
      if (e) setExpl({ ...initExpl, ...e });
      const p = JSON.parse(localStorage.getItem(LS_PROXY) || "null");
      if (p) setProxy({ ...initProxy, ...p });
    } catch {}
  }, []);

  const mask = (s: string) =>
    s ? (s.length > 8 ? `${s.slice(0, 3)}…${s.slice(-2)}` : "已配置") : "未配置";

  // 右侧总览
  const overview = useMemo(
    () => [
      {
        icon: EthIcon,
        title: "Ethereum",
        aLabel: "RPC:",
        aValue: rpc.ethereum ? "已配置" : "未配置",
        bLabel: "Explorer Key:",
        bValue: mask(expl.etherscan_mainnet),
      },
      {
        icon: SepoliaIcon,
        title: "Sepolia",
        aLabel: "RPC:",
        aValue: rpc.sepolia ? "已配置" : "未配置",
        bLabel: "Explorer Key:",
        bValue: mask(expl.etherscan_sepolia),
      },
      {
        icon: BnbIcon,
        title: "BNB Chain",
        aLabel: "RPC:",
        aValue: rpc.bnb ? "已配置" : "未配置",
        bLabel: "Explorer Key:",
        bValue: mask(expl.bscscan),
      },
      {
        icon: Link2,
        title: "http 代理配置",
        aLabel: "状态:",
        aValue: proxy.http ? "已配置" : "未配置",
      },
      {
        icon: Link2,
        title: "https 代理配置",
        aLabel: "状态:",
        aValue: proxy.https ? "已配置" : "未配置",
      },
    ],
    [rpc, expl, proxy]
  );

  // 保存（演示）
  const saveRpc = (k: NetKey) => {
    localStorage.setItem(LS_RPC, JSON.stringify(rpc));
    setSavedRpc((s) => ({ ...s, [k]: true }));
    setTimeout(() => setSavedRpc((s) => ({ ...s, [k]: false })), 900);
  };
  const saveExpl = (k: ExplorerKey) => {
    localStorage.setItem(LS_EXPL, JSON.stringify(expl));
    setSavedExpl((s) => ({ ...s, [k]: true }));
    setTimeout(() => setSavedExpl((s) => ({ ...s, [k]: false })), 900);
  };
  const saveProxy = (k: ProxyKey) => {
    localStorage.setItem(LS_PROXY, JSON.stringify(proxy));
    setSavedProxy((s) => ({ ...s, [k]: true }));
    setTimeout(() => setSavedProxy((s) => ({ ...s, [k]: false })), 900);
  };

  // 测试（演示：有值=成功）
  const runTest = (name: string) => {
    setTests((t) => ({ ...t, [name]: "测试中" }));
    setTimeout(() => {
      let ok = false;
      if (name.includes("Ethereum（RPC）")) ok = !!rpc.ethereum;
      else if (name.includes("Sepolia（RPC）")) ok = !!rpc.sepolia;
      else if (name.includes("BNB Chain（RPC）")) ok = !!rpc.bnb;
      else if (name.includes("Mainnet")) ok = !!expl.etherscan_mainnet;
      else if (name.includes("Sepolia（Explorer）")) ok = !!expl.etherscan_sepolia;
      else if (name.includes("BscScan")) ok = !!expl.bscscan;
      else if (name.startsWith("http")) ok = !!proxy.http;
      else if (name.startsWith("https")) ok = !!proxy.https;

      setTests((t) => ({ ...t, [name]: ok ? "成功" : "失败" }));
    }, 500);
  };

  /* ============== 页面布局（两列） ============== */
  return (
    <div className="h-full w-full box-border p-1">
      <div className="h-full w-full bg-white">
        <div className="h-full w-full max-w-[1600px] mx-auto py-1 px-2">
          <div className="h-full w-full grid grid-cols-2 gap-3">
            {/* 左列 */}
            <div className="flex flex-col gap-3 h-full">
              <Panel title="区块链节点与 RPC 配置">
                <FieldBlock
                  icon={EthIcon}
                  label="Ethereum"
                  value={rpc.ethereum}
                  placeholder="RPC: https://…"
                  onChange={(v) => setRpc((s) => ({ ...s, ethereum: v }))}
                  onSave={() => saveRpc("ethereum")}
                  saved={savedRpc.ethereum}
                />
                <FieldBlock
                  icon={SepoliaIcon}
                  label="Sepolia"
                  value={rpc.sepolia}
                  placeholder="RPC: https://…"
                  onChange={(v) => setRpc((s) => ({ ...s, sepolia: v }))}
                  onSave={() => saveRpc("sepolia")}
                  saved={savedRpc.sepolia}
                />
                <FieldBlock
                  icon={BnbIcon}
                  label="BNB Chain"
                  value={rpc.bnb}
                  placeholder="RPC: https://…"
                  onChange={(v) => setRpc((s) => ({ ...s, bnb: v }))}
                  onSave={() => saveRpc("bnb")}
                  saved={savedRpc.bnb}
                />
              </Panel>

              <Panel title="区块链浏览器 API KEY">
                <FieldBlock
                  icon={KeyRound}
                  label="Etherscan（Mainnet）"
                  value={expl.etherscan_mainnet}
                  placeholder="Explorer API Key"
                  onChange={(v) => setExpl((s) => ({ ...s, etherscan_mainnet: v }))}
                  onSave={() => saveExpl("etherscan_mainnet")}
                  saved={savedExpl.etherscan_mainnet}
                />
                <FieldBlock
                  icon={KeyRound}
                  label="Etherscan（Sepolia）"
                  value={expl.etherscan_sepolia}
                  placeholder="Explorer API Key"
                  onChange={(v) => setExpl((s) => ({ ...s, etherscan_sepolia: v }))}
                  onSave={() => saveExpl("etherscan_sepolia")}
                  saved={savedExpl.etherscan_sepolia}
                />
                <FieldBlock
                  icon={KeyRound}
                  label="BscScan"
                  value={expl.bscscan}
                  placeholder="Explorer API Key"
                  onChange={(v) => setExpl((s) => ({ ...s, bscscan: v }))}
                  onSave={() => saveExpl("bscscan")}
                  saved={savedExpl.bscscan}
                />
              </Panel>

              <Panel title="网络代理配置" className="flex-1 flex flex-col">
                <FieldBlock
                  icon={Link2}
                  label="http 代理配置"
                  value={proxy.http}
                  placeholder="http://user:pass@host:port"
                  onChange={(v) => setProxy((s) => ({ ...s, http: v }))}
                  onSave={() => saveProxy("http")}
                  saved={savedProxy.http}
                />
                <FieldBlock
                  icon={Link2}
                  label="https 代理配置"
                  value={proxy.https}
                  placeholder="https://user:pass@host:port"
                  onChange={(v) => setProxy((s) => ({ ...s, https: v }))}
                  onSave={() => saveProxy("https")}
                  saved={savedProxy.https}
                />
              </Panel>
            </div>

            {/* 右列 */}
            <div className="flex flex-col gap-3 h-full">
              {/* 总览：更紧凑的行高；http/https 分行 */}
              <Panel title="已保存配置信息总览" className="min-h-[220px]">
                <div className="space-y-2">
                  {overview.map((o) => (
                    <InfoLineSplit
                      key={o.title}
                      icon={o.icon}
                      title={o.title}
                      aLabel={o.aLabel}
                      aValue={o.aValue}
                      bLabel={o.bLabel}
                      bValue={o.bValue}
                    />
                  ))}
                </div>
              </Panel>

              <Panel title="API 可用性测试" className="flex-1 min-h-[180px]">
                <div className="space-y-2 h-full overflow-auto">
                  {Object.keys(tests).map((name) => (
                    <TestLine
                      key={name}
                      title={name}
                      status={tests[name]}
                      onTest={() => runTest(name)}
                    />
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
