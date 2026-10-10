# project-guide · 软著操作说明书撰写技能

给 AI 编程 agent 用的 **Skill**：按「五步法」撰写软件著作权申报用的操作说明书（文档鉴别材料），要求功能、按钮、弹窗零遗漏覆盖，并在写作期规避模板化与 AI 生成痕迹。

遵循 [Agent Skills 开放标准](https://agentskills.io)：只用 `name` + `description` + 纯 Markdown 的**可移植核心**，因此可被 Claude Code、OpenCode、Codex、Copilot、Gemini CLI、Cursor 等支持该标准的 agent 直接使用。

---

## 安装

### 方式一：npm（推荐，含自动投放）

```bash
npm i -g @yezi186/project-guide
```

安装后 `postinstall` 会自动探测本机已装的 agent 目录并投放；也可手动指定：

```bash
project-guide-install --target all          # 装到探测到的全部 agent
project-guide-install --target claude       # 只装 Claude Code
project-guide-install --project             # 装到当前项目（.claude/skills/ 等）
project-guide-install --uninstall           # 卸载（保留本地台账文件）
```

### 方式二：生态安装 CLI

```bash
npx skills add yezi186/dsh-skill-project-guide
```

该 CLI 会自动探测本机 agent 并把 skill 放到正确目录。

### 方式三：手动放置

把 `SKILL.md`、`reference.md`、`examples.md` 复制到目标 agent 的 skill 目录下、新建 `project-guide/` 子目录即可：

| Agent | 用户级目录 | 项目级目录 |
| :--- | :--- | :--- |
| DSH | `~/.dsh/skills/project-guide/` | — |
| Claude Code | `~/.claude/skills/project-guide/` | `.claude/skills/project-guide/` |
| OpenCode | `~/.config/opencode/skills/project-guide/`、`~/.opencode/skills/project-guide/` | `.opencode/skills/project-guide/` |
| 其他标准 agent | 各自的 skills 目录 | 同左 |

> **Trae 用户注意**：Trae 当前**不支持 SKILL.md 格式**（只认其自有的 `npx skills` 生态与 `.trae/skills/` 自有格式），本 skill 在 Trae 中暂不可用。参见官方 feature request：[Trae-AI/TRAE#2253](https://github.com/Trae-AI/TRAE/issues/2253)。

---

## 这个 skill 能做什么

触发场景：要求**编写或修订软著操作说明书**、撰写软件操作说明、生成软著文档鉴别材料、优化说明书避免模板化雷同、做说明书与源代码一致性自查。

**五步法**：素材采集 → 形态诊断与定型 → 清单兜底 → 表达错落 → 一致性自查。

| 能力 | 说明 |
| :--- | :--- |
| **零遗漏覆盖** | 素材穷举登记 + 三张覆盖矩阵（功能点 / 按钮 / 弹窗）反向勾对，缺一即返工 |
| **五型形态定型** | 动笔前先把软件归入五型之一（Web 管理后台 / 移动 APP·小程序 / 桌面客户端 / 数据可视化大屏 / 工具与自动化），套用对应形态适配卡（采集词表、章节排序、图示策略、运行环境取值口径） |
| **11 种模块内叙述手法** | 流程泳道法、角色标注法、数据信号法、任务目标法、模块遍历法、频率分层法、区域导览法、配置项法、清单核对法、提醒源流法、查阅溯源法；按**内容本相优先**选择，附误用信号 |
| **结构硬约束** | 概述精简 2–3 段、运行环境用版权中心固定 7 字段表（且不写启动方式）、技术特点逐条独立成段、主要功能独立成节按功能域分段 |
| **防空转闸口** | G1 素材闸 / G2-a 结构确认 / G2-b 三段实样 / G3 结构硬约束 / G4 覆盖闸（含形态、冷却与标题范围核对）/ G5 防密度闸 |
| **写作期去指纹** | 对齐 AIGC 五维标准 C1–C5（陈述型段落为最高优先防密度区）、起手句式跨项目冷却期与黑名单 |
| **界面文案零占位符** | T10：引用基准是界面运行态显示结果，禁止 `{变量}`、源码字段名、格式串进正文；配套「动态文案转写四法」 |
| **成文自查 21 条** | 含占位符正则清零、表述冗余收敛、引号口径统一（中文双引号）等量化核对方法 |

**铁律 T1–T10 + 围栏 G0–G5** 见 `SKILL.md`；写法细则、范例与反例见 `reference.md`；完整案例见 `examples.md`。

---

## 文件说明

| 文件 | 作用 |
| :--- | :--- |
| `SKILL.md` | 技能主体：定位、铁律、围栏、五步法流程、产物规范（agent 加载入口） |
| `reference.md` | 写作细则与范例：功能描述写法、11 手法实例与误用信号、动态文案转写四法、五型形态适配卡、弹窗三变体等 |
| `examples.md` | 完整案例与正反范式（形态定型参照、首分组标题错配的正反例） |
| `scripts/install.mjs` | 多 agent 投放脚本（`--auto` / `--target` / `--project` / `--uninstall`） |
| `scripts/verify-pack.mjs` | 发布前校验：白名单文件存在性、敏感词扫描、frontmatter 跨平台约束 |
| `history/user-guide-rotation.md` | **运行时生成**：跨会话的写法轮换台账（首次使用后在本 skill 目录下自动出现，用于避免不同软件写出雷同风格） |

---

## 兼容性声明

- **可移植核心**：本 skill 的 `SKILL.md` 只用 `name` + `description` + 纯 Markdown，跨 agent 通用；
- **DSH 扩展字段**：`whenToUse`、`user-invocable` 为 DeepSeek Harness 专属扩展，其他 agent 会忽略，不影响加载；
- **台账文件**：`history/` 目录为运行期状态（每个用户独立生成），**不随包分发**，也不会被更新覆盖。

## 许可

MIT
