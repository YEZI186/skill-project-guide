# skill-project-guide

软著申报流水线技能：**操作说明书撰写**（project-guide）。

## 功能与特点

**产出**：一本可直接申报的《操作说明书》——四章结构（概述简介 / 运行环境 / 系统架构 / 操作说明），配套三张素材覆盖矩阵（功能点 / 按钮 / 弹窗）。

**功能**：① 素材穷举登记与三张覆盖矩阵；② 五型形态定型与规则裁剪；③ 五步法撰写成稿（素材采集 → 形态诊断与定型 → 清单兜底 → 表达错落 → 一致性自查）；④ 21 条成文自查；⑤ 三项产物（正文 / 矩阵 / 跨会话轮换台账）。

**特点**：① **零遗漏靠矩阵勾对**——正文与矩阵反向核对，缺一即返工；② **反模板化**——11 种模块内叙述手法按内容本相优先，配跨项目起手句式冷却期与黑名单；③ **写作期去指纹**——对齐 AIGC 五维标准 C1–C5（陈述型段落为最高优先靶点）、界面文案零占位符（T10）；④ **闸口可控**——G1–G5 五个围栏在关键节点停下等你确认；⑤ **规则单一来源**——全部规则以 `SKILL.md` 为准，细则与示例在 `reference.md`。

## 安装

本仓库是标准 Agent Skills 包（根目录含 `SKILL.md`），用 [`skills` CLI](https://github.com/vercel-labs/skills) 一键安装。

### 推荐：一条命令覆盖 opencode / pi / DeepSeek Harness

```
npx skills add YEZI186/skill-project-guide -a opencode -a pi -g -y
```

这三个 agent 都读取**通用 skills 目录** `~/.agents/skills/`，因此一次安装三方同时生效：

| Agent | 生效路径 | 说明 |
|---|---|---|
| OpenCode | `~/.agents/skills/project-guide/` | opencode 官方支持的通用 skills 目录（项目级为 `<项目>/.agents/skills/`） |
| Trae CN | `~/.agents/skills/project-guide/` | 已装 `skills` CLI 生态的 Trae 版本可直接识别（自有目录为 `~/.trae-cn/skills/`） |
| Cline / GitHub Copilot / Zed | `~/.agents/skills/project-guide/` | 同读通用 skills 目录 |
| DeepSeek Harness | `~/.agents/skills/project-guide/` | DSH 的 `agents` skill 来源，默认启用（见 `<DSH_HOME>/skills-manager/state.json`）；DSH 另支持自有目录 `<DSH_HOME>/skills/` |

> 2026-10-12 本机实测：执行上面这条命令后，`npx skills ls -g` 显示该 skill 对 **Cline、GitHub Copilot、OpenCode、Trae CN、Zed** 五个 agent 生效（同一路径 `~/.agents/skills/project-guide/`，共 10 个文件，无 `history/`）。

> 安装目录名取自 `SKILL.md` 的 `name` 字段（`project-guide`），与仓库名 `skill-project-guide` 不同属正常。

### 其他 agent

```
npx skills add YEZI186/skill-project-guide -a claude-code -g -y    # 指定单个 agent
npx skills add YEZI186/skill-project-guide -a cursor -g -y
npx skills add YEZI186/skill-project-guide --all                   # 安装到全部已探测到的 agent
npx skills ls -g                                                   # 查看已安装
npx skills remove project-guide -g                                 # 卸载
```

`skills` CLI 支持 85 个 agent（claude-code、cursor、codex、gemini-cli、windsurf、trae、qwen-code、kimi-code-cli、roo、cline、amp、zed…）。

### 装到 DeepSeek Harness 自有目录（可选）

只使用 DSH，或希望把 skill 放在 DSH 自有目录（便于本地改动规则与台账）时：

```
git clone https://github.com/YEZI186/skill-project-guide.git "<DSH_HOME>/skills/project-guide"
```

`<DSH_HOME>` 默认 `~/.dsh`（Windows 为 `C:\Users\<用户名>\.dsh`），即最终路径 `~/.dsh/skills/project-guide/`。

### 项目级安装（随仓库提交、团队共享）

在项目根目录执行（安装到该项目的 `.agents/skills/`）：

```
npx skills add YEZI186/skill-project-guide -a opencode -a pi
```

### 手动安装

把本仓库（至少 `SKILL.md`、`reference.md`、`examples.md`）复制到目标 agent 的 skills 目录，**目录名保持 `project-guide`**：

```
<agent skills 目录>/project-guide/
├─ SKILL.md
├─ reference.md
└─ examples.md
```

## 使用

在会话中直接提出需求即可，例如：

```
按软著申报要求，为这个项目写一本操作说明书
优化现有说明书，避免模板化雷同
做一次说明书与源代码的一致性自查
```

skill 被触发后会按五步法推进，并在关键节点（G1 素材闸 / G2-a 结构确认 / G2-b 三段实样 / G3 结构硬约束 / G4 覆盖闸 / G5 防密度闸）停下等你确认。

## 文件说明

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 技能主体：定位、铁律 T1–T10、围栏 G0–G5、五步法流程、产物规范（agent 加载入口） |
| `reference.md` | 写作细则与范例：功能描述写法、11 手法实例与误用信号、动态文案转写四法、五型形态适配卡、弹窗三变体等 |
| `examples.md` | 完整案例与正反范式（形态定型参照、首分组标题错配的正反例） |
| `LICENSE` | MIT 许可 |
| `scripts/install.mjs` | 可选：多 agent 投放脚本（`--auto` / `--target` / `--project` / `--uninstall`） |
| `scripts/verify-pack.mjs` | 发布前校验：白名单文件存在性、敏感词扫描、frontmatter 跨平台约束 |
| `history/user-guide-rotation.md` | **运行时生成**：跨会话的写法轮换台账（首次使用后自动创建于本 skill 目录下的 `history/`，用于避免不同软件写出雷同风格；该目录已在 `.gitignore` 排除） |

## 兼容性说明

- **可移植核心**：`SKILL.md` 只用 `name` + `description` + 纯 Markdown，跨 agent 通用；
- **DSH 扩展字段**：`whenToUse`、`user-invocable` 为 DeepSeek Harness 专属扩展，其他 agent 会忽略，不影响加载；
- **Trae**：已装 `skills` CLI 生态的 Trae（如 Trae CN）可直接识别本 skill——实测装入 `~/.agents/skills/` 后 Trae CN 即生效（Trae 自有目录为 `~/.trae-cn/skills/`）；
- **台账文件**：`history/` 为运行期本地状态，不随仓库分发，也不会被更新覆盖。

## 其他分发方式

仓库同时保留了 npm 包元数据（`package.json`，包名 `@yezi186/project-guide`）。如需要 npm 分发，可在包根执行：

```
npm publish --access public
```

安装后由 `postinstall` 自动探测本机 agent 目录并投放（等价于 `scripts/install.mjs --auto`）。

## 许可

MIT（见 `LICENSE`）。
