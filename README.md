# 一、建议的最终目录框架（在你版本上小幅增强）

```text
oz-byteseek/
├─ front-ui/                         # 前端（React/Vite），外层固定视窗布局
│  ├─ public/
│  ├─ src/
│  │  ├─ app/                        # 应用壳 + 路由入口（固定外层，内部滚动）
│  │  ├─ pages/                      # Dashboard / CreateScan / Results / BlockScan / Settings / Rules / AI
│  │  ├─ components/                 # 卡片、徽章、表格、图表、抽屉等复用组件
│  │  ├─ styles/                     # 全局样式 & 布局 CSS（固定外层、不拉伸）
│  │  ├─ lib/                        # API 客户端、SSE/WS 工具、格式化、缓存
│  │  ├─ hooks/                      # 自定义 hooks（进度、筛选、表单）
│  │  └─ assets/                     # 图标与图片
│  ├─ .env.example                   # 仅非敏感变量（例如 VITE_API_BASE）
│  ├─ .env.development.example       # 本地开发示例（不提交真实值）
│  ├─ .env.production.example        # 生产示例（不提交真实值）
│  ├─ Dockerfile                     # 前端镜像（dev/prod 可分阶段）
│  ├─ .dockerignore
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ README.md
│
├─ server/                           # 后端（Go）
│  ├─ cmd/
│  │  └─ api/
│  │     └─ main.go                  # 程序入口（先放 /health）
│  ├─ internal/
│  │  ├─ api/
│  │  │  ├─ handlers/                # 具体 HTTP 处理器
│  │  │  ├─ middlewares/             # CORS / 限流 / 日志 / 统一异常
│  │  │  └─ router.go                # 路由装配
│  │  ├─ core/
│  │  │  ├─ scanner/                 # 源码基线+NLP、字节码分析、污点、规则匹配
│  │  │  ├─ poc/                     # POC 模板生成与（可选）沙箱执行
│  │  │  ├─ ai/                      # Ollama 客户端（后续）
│  │  │  └─ jobs/                    # 任务队列 / 区块扫描 / 进度
│  │  ├─ storage/
│  │  │  ├─ filedb/                  # JSON/JSONL 存储实现（原子写/文件锁/索引）
│  │  │  └─ storage.go               # Storage 接口定义
│  │  ├─ integrations/
│  │  │  ├─ rpc/                     # 以太坊 RPC 适配
│  │  │  ├─ explorer/                # Etherscan/BscScan 适配
│  │  │  └─ sourcify/                # Sourcify 拉源码
│  │  ├─ config/                     # 配置装载（env + storage/settings/*）
│  │  └─ openapi/                    # OpenAPI 规范（生成/校验）
│  ├─ pkg/
│  │  ├─ models/                     # Scan/Finding/POC/Job/Rule/Settings 等模型
│  │  ├─ logger/                     # 结构化日志封装
│  │  └─ util/                       # 加密、atomic write、flock、校验、工具
│  ├─ testdata/                      # 后端测试样例（字节码/源码/报告）
│  ├─ .env.example                   # 后端环境变量示例（DATA_DIR、RPC、APP_SECRET…）
│  ├─ Dockerfile
│  ├─ go.mod
│  ├─ go.sum
│  └─ README.md
│
├─ storage/                          # 本地数据卷（容器挂载到 /data）
│  ├─ settings/
│  │  ├─ rpc.json                    # 节点 RPC 列表
│  │  ├─ apikeys.enc.json            # 浏览器 API Key（ENC: 加密存储）
│  │  ├─ ai.json                     # AI endpoint/model（占位）
│  │  └─ keys/                       # 公私钥（加密 keystore，不存明文）
│  ├─ rules/
│  │  ├─ index.json                  # 规则索引（元数据清单）
│  │  └─ evm/
│  │     ├─ builtins/                # 内置规则（只读）
│  │     └─ custom/                  # 自定义（可热加载）
│  ├─ scans/
│  │  ├─ onchain/                    # 链上合约扫描
│  │  │  └─ {scan_id}/(scan.json, findings.jsonl, poc.json, artifacts/)
│  │  └─ uploaded/                   # 上传合约扫描（源码/字节码）
│  │     └─ {scan_id}/(...)
│  ├─ bytecode/                      # 上传字节码原件（按 sha256/前缀分桶）
│  ├─ block_jobs/
│  │  └─ {job_id}/job.json
│  ├─ artifacts/
│  │  ├─ poc/                        # POC 代码 + 执行日志
│  │  └─ compiled/                   # 编译缓存（solc/forge）
│  ├─ cache/
│  │  ├─ explorer/                   # Etherscan/BscScan 缓存
│  │  ├─ sourcify/                   # 源码拉取缓存
│  │  └─ compiler/                   # 编译缓存
│  ├─ uploads/                       # 用户上传源码/压缩包原件（只读备份）
│  ├─ logs/                          # 运行日志（按日期滚动）
│  ├─ indexes/
│  │  ├─ scans.index.json            # 仪表盘/列表用索引
│  │  └─ jobs.index.json             # 区块任务索引
│  ├─ tmp/                           # 原子写临时
│  └─ backups/                       # 备份/快照
│
├─ docker/
│  ├─ docker-compose.dev.yml         # 开发编排（api + ui）
│  ├─ docker-compose.prod.yml        # 生产编排（前端静态 + Nginx）
│  └─ nginx/
│     └─ default.conf                # 前端静态站点 & 反代（可选）
│
├─ scripts/
│  ├─ dev.sh                         # 一键本地/容器开发启动
│  ├─ build.sh                       # 一键构建
│  ├─ lint.sh                        # 统一 lint/format
│  └─ healthcheck.sh                 # 端口/接口健康检查
│
├─ docs/
│  ├─ README.md
│  ├─ architecture.md
│  ├─ api.md
│  ├─ storage.md
│  └─ rules.md
│
├─ .github/workflows/ci.yml          # CI（可选：lint+build+简单测试）
├─ .gitignore
├─ .editorconfig
├─ Makefile                          # 统一常用命令（可选）
├─ LICENSE
└─ README.md
```

> 变动点：新增 `openapi/`、`testdata/`、`.github/workflows/ci.yml`、`Makefile`、前端 `.env.*.example`。这些是工程化增强，不影响你的总体设计。

---

# 二、Ubuntu 目录与占位文件初始化（每条指令含用途说明）

> 在你希望的父目录执行（例如 `~/projects`）。以下仅创建结构与空文件，不写业务代码。

```bash
# 0) 创建项目根并进入
mkdir -p oz-byteseek && cd oz-byteseek
# 作用：初始化仓库根目录

# 1) 前端目录与占位
mkdir -p front-ui/public \
         front-ui/src/{app,pages,components,styles,lib,hooks,assets}
touch front-ui/{Dockerfile,.dockerignore,package.json,vite.config.ts,README.md,.env.example,.env.development.example,.env.production.example}
# 作用：创建前端基础结构与构建必需文件（env 示例仅放“示例”，不包含敏感值）

# 2) 后端目录与占位
mkdir -p server/cmd/api \
         server/internal/api/{handlers,middlewares} \
         server/internal/core/{scanner,poc,ai,jobs} \
         server/internal/storage/filedb \
         server/internal/integrations/{rpc,explorer,sourcify} \
         server/internal/{config,openapi} \
         server/pkg/{models,logger,util} \
         server/testdata
touch server/{Dockerfile,.env.example,README.md,go.mod,go.sum}
touch server/cmd/api/main.go \
      server/internal/api/router.go \
      server/internal/storage/storage.go
# 作用：后端模块化结构、入口与接口文件（暂空）

# 3) 本地 JSON 存储目录（容器挂载的数据盘）
mkdir -p storage/settings/keys \
         storage/rules/evm/{builtins,custom} \
         storage/scans/{onchain,uploaded} \
         storage/{bytecode,block_jobs} \
         storage/artifacts/{poc,compiled} \
         storage/cache/{explorer,sourcify,compiler} \
         storage/{uploads,logs,indexes,tmp,backups}
# 作用：准备运行期数据目录（按你的分类：节点 API、公私钥、规则、扫描结果…）

# 4) 关键配置占位 JSON（便于后续加载，不必真实值）
printf '%s\n' '{"ethereum":"","sepolia":"","bnb":""}' > storage/settings/rpc.json
printf '%s\n' '{"etherscan_mainnet":"ENC:","etherscan_sepolia":"ENC:","bscscan":"ENC:"}' > storage/settings/apikeys.enc.json
printf '%s\n' '{"endpoint":"http://localhost:11434","model":""}' > storage/settings/ai.json
printf '%s\n' '{"items":[]}' > storage/rules/index.json
# 作用：占位文件格式正确，后端读文件不会报错；敏感值用 ENC: 占位

# 5) Docker/Nginx 编排与配置占位
mkdir -p docker/nginx
touch docker/{docker-compose.dev.yml,docker-compose.prod.yml} docker/nginx/default.conf
# 作用：开发/生产编排占位；Nginx 反代前端（生产）

# 6) 脚本 & 文档 & 根配置
mkdir -p scripts docs .github/workflows
touch scripts/{dev.sh,build.sh,lint.sh,healthcheck.sh}
touch docs/{README.md,architecture.md,api.md,storage.md,rules.md}
touch .github/workflows/ci.yml .gitignore .editorconfig Makefile LICENSE README.md
# 作用：工程化与协作文件占位（后续逐步完善）
```

---

# 三、每个目录/文件“放什么 & 做什么”（要点版）

## 前端 `front-ui/`

* `src/app/`：**应用壳**（固定外层容器、顶部/侧边导航、内容区内部滚动）；挂载 Router。
* `src/pages/`：各页面骨架（先放空组件）：

  * `Dashboard`：指标卡 / 折线 / 饼图 / 问题扫描筛选
  * `CreateScan`：三类输入 + 网络 + 提交任务
  * `Results`：扫描详情（漏洞列表折叠/展开、POC 信息）
  * `BlockScan`：区块范围/持续任务 + 进度条/速率/ETA/控制
  * `Settings`：网络与 API Key、区块浏览器 Key、API 可用性测试
  * `Rules`：规则库列表
  * `AI`：AI 复查面板
* `src/components/`：通用卡片、徽章、表格、图表组件、抽屉/弹窗、上传控件等。
* `src/styles/`：全局样式；**实现“外层固定，不拉伸；内部区域滚动”**的 CSS（后续写）。
* `src/lib/`：`api.ts`（基于 `VITE_API_BASE`）、SSE/WS 工具、格式化/断言。
* `.env*.example`：仅示例字段（例如 `VITE_API_BASE=http://localhost:8080`），不含敏感信息。
* `Dockerfile`：dev 阶段跑 Vite；prod 阶段构建静态后由 Nginx 托管（后续写）。
* `vite.config.ts`、`package.json`：先空，后续加依赖（React、图表库等）。

## 后端 `server/`

* `cmd/api/main.go`：程序入口；加载 `DATA_DIR`；注册 `/health`；后续注册 `/api/*`。
* `internal/api/handlers/`：REST 处理器（扫描创建/查询、区块扫描、规则、测试连通性等）。
* `internal/api/middlewares/`：CORS、统一错误、限流、日志 Trace。
* `internal/core/scanner/`：源码基线+NLP / 字节码 CFG/DFG/污点 / 规则匹配；输出 findings。
* `internal/core/poc/`：按规则生成 POC 模板；（可选）容器沙箱内执行，收集日志。
* `internal/core/ai/`：Ollama 客户端（后续接）。
* `internal/core/jobs/`：异步队列与进度；区块扫描拆分与统计。
* `internal/storage/storage.go`：`Storage` 接口（CreateScan/LoadScan/AppendFinding/ListIndex…）。
* `internal/storage/filedb/`：**JSON/JSONL 实现**（原子写/文件锁/索引重建/缓存）。
* `internal/integrations/`：RPC/Explorer/Sourcify 客户端。
* `internal/config/`：加载 env + `storage/settings/*`；`apikeys.enc.json` 解密（`APP_SECRET`）。
* `internal/openapi/`：OpenAPI 规范文件（yml/json），便于联调/SDK 生成。
* `pkg/models/`：统一数据结构（Scan/Finding/POC/Job/Rule/Settings 等）。
* `pkg/logger/`：结构化日志封装，方便接入可观测性。
* `pkg/util/`：`atomicWrite`、`flock`、加解密、校验工具。
* `testdata/`：用于单测/集成测试的样例（合约片段、字节码、报告基线）。
* `.env.example`：`DATA_DIR=/data`、`APP_SECRET=...`、`ETH_RPC=...` 等示例。

## 存储 `storage/`（你关心的 4 大类 + 必要补充）

1. **节点 API 的存储**

   * `settings/rpc.json`：各网络 RPC；
   * `settings/apikeys.enc.json`：Etherscan/BscScan Key（**加密**存储，格式 `ENC:...`）；
   * `cache/`：Explorer、Sourcify、Compiler 缓存，减负外部请求。
2. **公私钥的存储**

   * `settings/keys/`：**keystore JSON**（加密，不存明文私钥）；
   * 后端提供导入/导出（需口令）；生产可替换 KMS。
3. **漏洞规则的存储**

   * `rules/index.json`：规则元数据清单（id、name、severity、version、文件路径）；
   * `rules/evm/builtins/`：官方内置规则（随版本发布，只读）；
   * `rules/evm/custom/`：自定义规则（支持热加载）。
4. **检测结果（链上 vs 上传）**

   * `scans/onchain/{scan_id}/...` 与 `scans/uploaded/{scan_id}/...` 分设；
   * 目录内：`scan.json`（元与汇总）、`findings.jsonl`（一行一个）、`poc.json`、`artifacts/`（POC 代码/日志）。
     **补充**
   * `bytecode/`：按 sha256/前缀分桶归档上传字节码；
   * `block_jobs/{job_id}/job.json`：区块扫描任务；
   * `indexes/*.json`：仪表盘与列表的聚合索引；
   * `backups/`：快照备份；
   * `logs/`：运行日志；
   * `tmp/`：原子写临时。

## Docker / 脚本 / 文档

* `docker/docker-compose.dev.yml`：开发编排（api + ui；前端 5173、后端 8080）。
* `docker/docker-compose.prod.yml`：生产编排（Nginx 托前端静态，api 独立容器）。
* `scripts/*.sh`：启动/构建/lint/健康检查脚本（后续填充）。
* `docs/`：架构/API/存储/规则规范（后续完善 OpenAPI 与规则 DSL）。

---

# 四、补充 & 风险提示

* **密钥与 API Key**：请务必只把示例文件入库，真实值用运行环境注入或在容器挂载卷里写入；`apikeys.enc.json` 采用 `APP_SECRET` 加密解密。
* **固定布局**（不拉伸）：前端会用“固定视窗容器 + 内部滚动区域”实现（CSS：外层 `height: 100vh; overflow: hidden;`，内容区 `overflow: auto;`），后续我在写页面壳时会落实。
* **后续迁移 DB**：已有 `Storage` 接口，若未来想切换数据库，仅替换实现层即可。
* **CI/格式**：建议后续加 `prettier/eslint`（前端）与 `golangci-lint`（后端），CI 里跑基本构建与 lint。

