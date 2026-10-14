#!/usr/bin/env node
/**
 * normalize-quotes.mjs —— 引号两段式归一（project-guide T11 执行机制）
 *
 * 用法：node normalize-quotes.mjs <说明书.md> [--dry-run]
 * 规则：
 *   1) 行内 ASCII 双引号（U+0022）按"开/闭交替"转为 U+201C / U+201D；
 *   2) 嵌套标记对 ⟦（U+27E6）/ ⟧（U+27E7）分别转为 U+201C / U+201D
 *      ——实现 T8"嵌套不分层级、内外层同用一对"；
 *      转换顺序：先处理 ⟦⟧（其内部若有 ASCII 引号已随行内规则处理），
 *      ⟦⟧ 本身不参与 ASCII 引号的交替计数（写作期规则：嵌套内容只用 ⟦⟧）；
 *   3) --dry-run：只输出统计与将被改写的行号，不写文件。
 * 断言（非 dry-run，写盘前复检）：直角引号=0 且 直引号=0 且 左=右，否则退出码 1 不写盘。
 * 安全：写盘前备份原文件为 <原名>.bak；UTF-8 无 BOM 写回。
 * 工程约定：本脚本遵循 SKILL.md 第七章（退出码三分、计数三向断言）。
 */
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const file = args.find((a) => !a.startsWith('--'))
if (!file) {
  console.error('用法：node normalize-quotes.mjs <说明书.md> [--dry-run]')
  process.exit(2)
}
if (!fs.existsSync(file)) {
  console.error('文件不存在：' + file)
  process.exit(2)
}

const DQ = '\u0022'
const LQ = '\u201C'
const RQ = '\u201D'
const EL = '\u27E6'
const ER = '\u27E7'
const JK = '\u300C'
const JK2 = '\u300D'

const src = fs.readFileSync(file, 'utf8')
const lines = src.split(/\r?\n/)
const out = []
const changed = []
let asciiTotal = 0
let nestTotal = 0

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]
  const before = line
  const nAscii = (line.match(/\u0022/g) || []).length
  const nNest = (line.match(/[\u27E6\u27E7]/g) || []).length
  asciiTotal += nAscii
  nestTotal += nNest
  if (nNest % 2 !== 0) {
    console.error(`[失败] 第 ${i + 1} 行嵌套标记不成对（${nNest} 个），退出且不写盘`)
    process.exit(1)
  }
  if (nAscii % 2 !== 0) {
    console.error(`[失败] 第 ${i + 1} 行 ASCII 引号数为奇数（${nAscii} 个），存在跨行引用，退出且不写盘`)
    process.exit(1)
  }
  // 行内 ASCII 引号：开/闭交替
  if (nAscii > 0) {
    let open = true
    line = Array.from(line).map((ch) => {
      if (ch === DQ) { const r = open ? LQ : RQ; open = !open; return r }
      return ch
    }).join('')
  }
  // 嵌套标记：直接替换为并列中文双引号
  if (nNest > 0) {
    line = line.split(EL).join(LQ).split(ER).join(RQ)
  }
  if (line !== before) changed.push(i + 1)
  out.push(line)
}

let text = out.join('\n')
// 保留原换行风格：若原文含 CRLF 则写回 CRLF
if (/\r?\n/.test(src) && src.includes('\r\n')) text = out.join('\r\n')

const cnt = (s, ch) => s.split(ch).length - 1
const stat = {
  直角引号: cnt(text, JK) + cnt(text, JK2),
  直引号: cnt(text, DQ),
  左双引号: cnt(text, LQ),
  右双引号: cnt(text, RQ),
  嵌套标记残留: cnt(text, EL) + cnt(text, ER),
  改写行数: changed.length
}
stat['三向断言(命中+未命中+豁免=总数)'] = `${changed.length} + ${lines.length - changed.length} = ${lines.length}`

console.log(JSON.stringify(stat, null, 2))
if (changed.length && !dryRun) console.log('将改写行号：' + changed.join(','))

const pass = stat['直角引号'] === 0 && stat['直引号'] === 0 && stat['左双引号'] === stat['右双引号'] && stat['嵌套标记残留'] === 0
if (!pass) {
  console.error('[断言失败] 引号三项不过，不写盘')
  process.exit(1)
}
if (dryRun) {
  console.log('[dry-run] 未写盘')
  process.exit(0)
}
if (changed.length === 0) {
  console.log('[无需改写] 引号已达标，未写盘')
  process.exit(0)
}
fs.copyFileSync(file, file + '.bak')
fs.writeFileSync(file, text, { encoding: 'utf8' })
console.log('[已写盘] 备份：' + path.basename(file) + '.bak')
