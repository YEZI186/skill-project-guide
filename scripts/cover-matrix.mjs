#!/usr/bin/env node
/**
 * cover-matrix.mjs —— 素材覆盖矩阵生成（project-guide G1 / 第五步第 1 条）
 *
 * 用法：
 *   node cover-matrix.mjs --book <说明书.md> --matrix <素材.md> [--matrix <素材2.md>]
 *                         [--out <矩阵输出.md>] [--dry-run] [--config '<json>']
 * 列映射配置（--config 可覆盖默认）：{ "表1": { from, to, col }, ... }（from/to 为素材文件内数据行行号，1 基）。
 * 断言：逐字命中 + 待人工分流 = 总条数（计数三向）。
 * 退出码：0 = 生成成功；1 = 断言失败；2 = 输入/参数错误。
 * 工程约定：遵循 SKILL.md 第七章；默认 dry-run 打印解析样本。
 */
import fs from 'node:fs'

const args = process.argv.slice(2)
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
const books = []
const mats = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--book') books.push(args[i + 1])
  if (args[i] === '--matrix') mats.push(args[i + 1])
}
const outPath = get('--out')
const dryRun = args.includes('--dry-run')
const cfgArg = get('--config')
if (!books.length || !mats.length) {
  console.error('用法：node cover-matrix.mjs --book <说明书.md> --matrix <素材.md> [--out <输出.md>] [--dry-run] [--config json]')
  process.exit(2)
}
for (const f of [...books, ...mats]) if (!fs.existsSync(f)) { console.error('文件不存在：' + f); process.exit(2) }

// 默认列映射（前端素材实测值；换素材用 --config 覆盖）
let config = {
  表1: { from: 14, to: 88, col: 2, name: '按钮与控件' },
  表2: { from: 93, to: 110, col: 0, name: '弹窗与确认框' },
  表3: { from: 116, to: 217, col: 1, name: '提示文案' },
  表4: { from: 223, to: 256, col: 2, name: '校验规则' },
  表5: { from: 262, to: 307, col: 1, name: '功能点' }
}
if (cfgArg) { try { config = JSON.parse(cfgArg) } catch (e) { console.error('--config 不是合法 JSON：' + e.message); process.exit(2) } }

const bookLines = []
for (const b of books) bookLines.push(...fs.readFileSync(b, 'utf8').split(/\r?\n/))
const sectionOf = []
let cur = '(前言)'
for (const l of bookLines) { const m = l.match(/^#{2,5} (.+)$/); if (m) cur = m[1].trim(); sectionOf.push(cur) }
const locate = (needle) => {
  for (let i = 0; i < bookLines.length; i++) if (bookLines[i].includes(needle)) return sectionOf[i]
  return null
}
const clean = (s) => (s || '').replace(/`/g, '').trim()

let total = 0, hit = 0, pending = 0
const rows = []
const samples = []
for (const mf of mats) {
  const lines = fs.readFileSync(mf, 'utf8').split(/\r?\n/)
  for (const [tid, cfg] of Object.entries(config)) {
    for (let i = cfg.from; i <= cfg.to && i <= lines.length; i++) {
      const line = lines[i - 1]
      if (!/^\|/.test(line) || /^\|\s*:?-{3,}/.test(line)) continue
      const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      if (cells.length <= cfg.col) continue
      const item = clean(cells[cfg.col])
      if (!item || item.length < 2) continue
      total++
      if (samples.length < 3) samples.push(`[${tid}] ${item}`)
      const loc = locate(item)
      if (loc) { hit++; rows.push(`| ${tid}-${String(rows.length + 1).padStart(3, '0')} | ${item} | ${loc} |`) }
      else { pending++; rows.push(`| ${tid}-${String(rows.length + 1).padStart(3, '0')} | ${item} | 待人工分流 |`) }
    }
  }
}

// 计数三向断言：命中 + 待分流 = 总数
if (hit + pending !== total) { console.error(`[断言失败] 命中${hit}+待分流${pending}≠总数${total}`); process.exit(1) }

console.log(`解析样本（前 3 条）：\n  ${samples.join('\n  ')}`)
console.log(`总条数=${total} 逐字命中=${hit} 待人工分流=${pending}`)
if (dryRun || !outPath) { console.log('[dry-run] 未写盘'); process.exit(0) }

const md = [
  '# 说明书素材覆盖矩阵', '',
  '> 由 cover-matrix.mjs 生成；逐字命中者给正文落点，未逐字命中者标"待人工分流"（语义等价或豁免由人工标注后回填本文件）。',
  '> 来源素材：' + mats.join('；'), '',
  '| 编号 | 条目 | 正文落点 |', '| :--- | :--- | :--- |',
  ...rows, '',
  `覆盖统计：总条数 ${total}；逐字命中 ${hit}；待人工分流 ${pending}。`
].join('\n')
fs.writeFileSync(outPath, md, 'utf8')
console.log('[已写盘] ' + outPath)
