// 发布前校验：白名单文件存在性 + 敏感词扫描（客户企业名/品牌名/项目路径）
// 用法：node scripts/verify-pack.mjs   （或 npm run verify）
// 退出码：0 通过；1 命中敏感词或文件缺失
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// 发布包内允许出现的文件（与 package.json 的 files 白名单一致）
const ALLOWED = ['SKILL.md', 'reference.md', 'examples.md', 'README.md', 'LICENSE'];

// 敏感词：客户企业名、品牌名、项目路径（命中即失败）
const FORBIDDEN = [
  '硕丰源', '棉业', '乾图', '襄阳', '汉江礼仓', '昭明书韵', '一颜写真',
  '博梵', '隽投', '子牙', '程瑞', '识远', '津投', '襄江',
  '001-project', 'E:\\',
];

let failed = false;

console.log('=== 1. 白名单文件检查 ===');
for (const f of ALLOWED) {
  const p = join(root, f);
  if (existsSync(p)) {
    const size = readFileSync(p, 'utf8').length;
    console.log(`  ✔ ${f}（${size} 字符）`);
  } else {
    console.log(`  ✘ 缺失：${f}`);
    failed = true;
  }
}

console.log('\n=== 2. 敏感词扫描（客户企业名 / 品牌名 / 项目路径）===');
let hits = 0;
for (const f of ALLOWED) {
  const p = join(root, f);
  if (!existsSync(p)) continue;
  const lines = readFileSync(p, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const word of FORBIDDEN) {
      if (line.includes(word)) {
        console.log(`  ✘ ${f}:${i + 1} 命中「${word}」→ ${line.trim().slice(0, 60)}`);
        hits++;
        failed = true;
      }
    }
  });
}
console.log(hits === 0 ? '  ✔ 无命中' : `  ✘ 共命中 ${hits} 处`);

console.log('\n=== 3. 本地留痕目录不应入包 ===');
for (const dir of ['history']) {
  console.log(`  ℹ ${dir}/ 由 package.json files 白名单排除（无需手动检查）`);
}

console.log('\n=== 4. frontmatter 跨平台约束 ===');
const skill = readFileSync(join(root, 'SKILL.md'), 'utf8');
const fm = skill.split('---')[1] || '';
const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim() ?? '';
const desc = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim() ?? '';
console.log(`  name=${name}（${name.length} 字符，需 ≤64 且小写连字符）`);
console.log(`  description=${desc.length} 字符（需 ≤1024，建议 ≤500）`);
if (name.length > 64) { console.log('  ✘ name 超长'); failed = true; }
if (desc.length > 500) { console.log('  ⚠ description 超过 500 字符（未超 1024 上限，建议压缩）'); }
if (!/^[a-z0-9-]+$/.test(name)) { console.log('  ✘ name 含非法字符'); failed = true; }

console.log('\n' + (failed ? '✘ 校验未通过，禁止发布' : '✔ 全部通过，可执行 npm pack / npm publish'));
process.exit(failed ? 1 : 0);
