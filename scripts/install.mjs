// 把本 skill 投放到各 agent 的 skill 目录
// 用法：
//   node scripts/install.mjs --auto            自动探测（存在哪个 agent 目录就装到哪）
//   node scripts/install.mjs --target all      装到探测到的全部 agent
//   node scripts/install.mjs --target dsh      指定单个（dsh / claude / opencode）
//   node scripts/install.mjs --project         装到当前项目的 .<agent>/skills/ 而非用户目录
//   node scripts/install.mjs --uninstall       卸载（只删白名单文件，保留台账等本地状态）
//   node scripts/install.mjs --quiet           postinstall 静默模式，出错不中断安装
import { existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_NAME = 'project-guide';
const FILES = ['SKILL.md', 'reference.md', 'examples.md', 'README.md'];

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const QUIET = has('--quiet');
const UNINSTALL = has('--uninstall');
const PROJECT = has('--project');
const target = valueOf('--target') ?? (has('--auto') ? 'auto' : undefined);

const home = homedir();
// 各 agent 的 skill 目录（用户级 / 项目级）
const AGENTS = {
  dsh:      { label: 'DSH',             global: [join(home, '.dsh', 'skills')],                                    project: null },
  claude:   { label: 'Claude Code',     global: [join(home, '.claude', 'skills')],                                 project: ['.claude', 'skills'] },
  opencode: { label: 'OpenCode',        global: [join(home, '.config', 'opencode', 'skills'), join(home, '.opencode', 'skills')], project: ['.opencode', 'skills'] },
  agents:   { label: '通用 .agents',     global: [join(home, '.agents', 'skills')],                                 project: ['.agents', 'skills'] },
};

const log = (...a) => { if (!QUIET) console.log(...a); };

// 探测：agent 的（首个存在的）用户级根目录或其父目录存在即视为已安装该 agent
function detect() {
  const found = [];
  for (const [key, cfg] of Object.entries(AGENTS)) {
    const hit = cfg.global.find((p) => existsSync(dirname(p)) || existsSync(p));
    if (hit) found.push(key);
  }
  return found;
}

function skillDirFor(agent, baseDir) {
  return join(baseDir, SKILL_NAME);
}

function installInto(agent, baseDir) {
  const dir = skillDirFor(agent, baseDir);
  mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const f of FILES) {
    const src = join(pkgRoot, f);
    if (!existsSync(src)) continue;
    // 幂等：只覆盖白名单文件，绝不触碰 user-guide-rotation.md 等本地状态
    copyFileSync(src, join(dir, f));
    n++;
  }
  log(`  ✔ ${AGENTS[agent].label} → ${dir}（写入 ${n} 个文件）`);
}

function uninstallFrom(agent, baseDir) {
  const dir = skillDirFor(agent, baseDir);
  if (!existsSync(dir)) return;
  for (const f of FILES) {
    const p = join(dir, f);
    if (existsSync(p)) rmSync(p, { force: true });
  }
  log(`  ✔ ${AGENTS[agent].label} → 已移除白名单文件：${dir}`);
  log('     （history/ 等本地状态文件保留未删）');
}

function main() {
  const selected = target === 'all' || target === 'auto'
    ? detect()
    : (target ? [target] : detect());

  if (!target && selected.length === 0) {
    log('未探测到任何 agent 目录；用 --target dsh|claude|opencode|agents 显式指定，或加 --project。');
    return;
  }
  if (target && target !== 'all' && target !== 'auto' && !AGENTS[target]) {
    throw new Error(`未知 target：${target}（可选 dsh / claude / opencode / agents / all）`);
  }

  log(UNINSTALL ? `卸载 ${SKILL_NAME}：` : `安装 ${SKILL_NAME}（${PROJECT ? '项目级' : '用户级'}）：`);
  for (const agent of selected) {
    const cfg = AGENTS[agent];
    const bases = PROJECT
      ? (cfg.project ? [join(process.cwd(), ...cfg.project)] : [])
      : cfg.global;
    if (bases.length === 0) {
      log(`  – ${cfg.label} 不支持项目级安装，已跳过`);
      continue;
    }
    for (const base of bases) {
      UNINSTALL ? uninstallFrom(agent, base) : installInto(agent, base);
    }
  }
  if (!UNINSTALL) {
    log('\n完成。重启 agent 或新开会话后生效；本 skill 的轮换台账将写入其自身的 history/ 目录。');
  }
}

try {
  main();
} catch (err) {
  if (QUIET) {
    console.warn(`project-guide 安装脚本提示：${err.message}`);
  } else {
    console.error(`安装失败：${err.message}`);
    process.exit(1);
  }
}
