#!/usr/bin/env node
/**
 * guide-check.mjs —— 说明书规范检查：13 项断言 + 2 项信息输出（project-guide 第五步前置闸）
 * 修订（2026-10-16 漏洞修复）：C7 兼容文本行分组；新增 C14 同型连排计数（供自查 19a）、C15 四章引用文案密度（供粒度 14）——两项均为信息输出，不影响退出码。
 *
 * 用法：node guide-check.mjs <说明书.md> [--module 4.3] [--json]
 * 退出码：0 = 全部断言通过；1 = 任一断言失败；2 = 输入/参数错误。
 * 阈值（2026-10-13 用户裁定钉死）：总中文字符 ≥12000；3.4 主要功能 ∈ [500,1000]。
 * 修订（2026-10-16 用户裁定）：C5 不达标时输出 G3 豁免提示（模块数 ≤6 的工具型/大屏型可经人工确认降为 ≥9000），断言默认行为不变。
 * 工程约定：遵循 SKILL.md 第七章（计数三向断言、退出码三分）。
 */
import fs from 'node:fs'

const args = process.argv.slice(2)
const jsonOut = args.includes('--json')
const modIdx = args.indexOf('--module')
const behIdx = args.indexOf('--behavior')
const behaviorFile = behIdx >= 0 ? args[behIdx + 1] : null
const legacy = args.includes('--legacy')
const onlyModule = modIdx >= 0 ? args[modIdx + 1] : null
const file = args.find((a) => !a.startsWith('--') && a !== (onlyModule || ''))
if (!file) { console.error('用法：node guide-check.mjs <说明书.md> [--module 4.3] [--json]'); process.exit(2) }
if (!fs.existsSync(file)) { console.error('文件不存在：' + file); process.exit(2) }

const raw = fs.readFileSync(file, 'utf8')
const lines = raw.split(/\r?\n/)
const cn = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length
const cnt = (s, re) => (s.match(re) || []).length

let text = raw
if (onlyModule) {
  const re = new RegExp('### ' + onlyModule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?(?=\\n### |\\n## |$)')
  const m = raw.match(re)
  if (!m) { console.error('未找到模块：' + onlyModule); process.exit(2) }
  text = m[0]
}

const results = []
const add = (id, name, pass, detail, assertion) => results.push({ id, name, pass, detail, 断言: !!assertion })

// C1 四章结构与模块两小节
const hasCh = ['## 一、软件概述简介', '## 二、运行环境', '## 三、系统架构', '## 四、操作说明'].every((h) => text.includes(h))
const modCount = cnt(text, /^### 4\.\d /gm)
const twoSec = cnt(text, /^#### 1\. 功能描述/gm)
const twoSec2 = cnt(text, /^#### 2\. 操作说明/gm)
add('C1', '四章结构与模块两小节', hasCh && modCount > 0 && twoSec === modCount && twoSec2 === modCount,
  `四章齐备=${hasCh} 模块数=${modCount} 功能描述节=${twoSec} 操作说明节=${twoSec2}`, true)

// C2 运行环境 7 字段单表
const envSeg = (raw.match(/## 二、运行环境[\s\S]*?(?=\n## |$)/) || [''])[0]
const envFields = ['开发的硬件环境', '运行的硬件环境', '开发该软件的操作系统', '软件开发环境 / 开发工具', '该软件的运行平台 / 操作系统', '软件运行支撑环境 / 支持软件', '编程语言']
const envOk = envFields.every((f) => envSeg.includes(f))
const envSub = cnt(envSeg, /^###? 2\.\d/gm)
add('C2', '运行环境 7 字段单表', envOk && envSub === 0, `7字段齐=${envOk} 子标题数=${envSub}`, true)

// C3 技术特点
const t3 = (raw.match(/### 3\.3 技术特点[\s\S]*?(?=\n### |$)/) || [''])[0]
const featCount = cnt(t3, /^\*\*（[一二三四五六七八九十\d]+）/gm)
add('C3', '技术特点独立成段', featCount >= 3 && t3.trim().length > 0, `特点条数=${featCount}`, true)

// C4 主要功能字数 ∈ [500,1000]
const t34 = ((raw.match(/### 3\.4 主要功能[\s\S]*?(?=\n## |$)/) || [''])[0].replace(/^### 3\.4 主要功能\s*\n/, ''))
const mc = cn(t34)
add('C4', '主要功能字数 ∈ [500,1000]', mc >= 500 && mc <= 1000, `实测=${mc}`, true)

// C5 总字数 ≥12000
const total = cn(raw)
const c5pass = total >= 12000
add('C5', '总中文字符 ≥12000', c5pass, c5pass ? `实测=${total}` : `实测=${total}（模块数 ≤6 的工具型 / 大屏型软件经 G3 人工确认可降为 ≥9000，走 G3 豁免需人工确认）`, true)

// C6 表格
const tables = cnt(raw, /^\| *:?-{3,}/gm)
add('C6', '表格计数', tables >= 1, `表头分隔行=${tables}`, false)

// C7 操作分组（双形态：五级标题分组 / 文本行「（n）」分组，兼容两种成稿形态）
const groupsH5 = cnt(raw, /^#####\s/gm)
const groupsText = cnt(raw, /^\*{0,2}[（(]\d+[)）]/gm)
const groups = groupsH5 + groupsText
add('C7', '操作分组计数', groups > 0, `分组数=${groups}（五级标题=${groupsH5} 文本分组=${groupsText}）`, false)

// C8 引号（双模式：默认工作态四项 / --legacy 排版态三项）
if (legacy) {
  const q = { 直角: cnt(raw, /[\u300C\u300D]/g), 直引号: cnt(raw, /\u0022/g), 左: cnt(raw, /\u201C/g), 右: cnt(raw, /\u201D/g) }
  add('C8', '引号三项（排版态 legacy）', q['直角'] === 0 && q['直引号'] === 0 && q['左'] === q['右'],
    `直角=${q['直角']} 直引号=${q['直引号']} 左=${q['左']} 右=${q['右']}`, true)
} else {
  const oddLines = lines.filter((l) => cnt(l, /\u0022/g) % 2 === 1).length
  const q2 = { 直角: cnt(raw, /[\u300C\u300D]/g), 奇数行: oddLines, 嵌套L: cnt(raw, /\u27E6/g), 嵌套R: cnt(raw, /\u27E7/g), 弯引号: cnt(raw, /[\u201C\u201D]/g) }
  const ok2 = q2['直角'] === 0 && q2['奇数行'] === 0 && q2['嵌套L'] === q2['嵌套R'] && q2['弯引号'] === 0
  add('C8', '引号工作态四项（T11 两态制）', ok2,
    `直角=${q2['直角']} 奇数行=${q2['奇数行']} 嵌套L=${q2['嵌套L']} 嵌套R=${q2['嵌套R']} 弯引号=${q2['弯引号']}`, true)
}

// C9 占位符与内幕词
const bad = {
  花括号对: cnt(raw, /\{[^}]*\}/g),
  yyyy: cnt(raw, /yyyy/g), HHmm: cnt(raw, /HH:mm/g),
  服务层: cnt(raw, /服务层/g), 界面文件: cnt(raw, /界面文件/g)
}
const badSum = Object.values(bad).reduce((a, b) => a + b, 0)
add('C9', '占位符与内幕词=0', badSum === 0, JSON.stringify(bad), true)

// C10 模板套话（输出清单，人工判定）
const cliches = ['闭环', '赋能', '综上所述', '其一', '其二', '界面友好', '操作简便', '一站式', '完美', '强大']
const hitCliche = cliches.filter((w) => text.includes(w))
add('C10', '模板套话命中（人工判定去留）', true, hitCliche.length ? hitCliche.join('、') : '无命中', false)

// C11 完全重复段落
const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40 && !p.startsWith('|') && !p.startsWith('#'))
const seen = new Map()
for (const p of paras) seen.set(p, (seen.get(p) || 0) + 1)
const dup = [...seen.entries()].filter(([, n]) => n > 1)
add('C11', '完全重复段落=0', dup.length === 0, dup.length ? dup.slice(0, 2).map(([p, n]) => `重复${n}次：${p.slice(0, 24)}…`).join('；') : '无重复', true)

// C12 起手句抽取（状态机逐行：标题行后第一个非空行的前 40 字）
const starts = []
const titleRe = /^(#### 1\. 功能描述|\*\*（[一二三四五六七八九十\d]+）[^*]*\*\*)\s*$/
for (let i = 0; i < lines.length; i++) {
  if (!titleRe.test(lines[i])) continue
  for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
    const s = lines[j].trim()
    if (!s) continue
    const tag = lines[i].includes('功能描述') ? '功能描述' : '技术特点'
    starts.push(tag + ': ' + s.slice(0, 40))
    break
  }
}
add('C12', '起手句抽取（供冷却比对）', starts.length > 0, `抽取 ${starts.length} 条，见 --json 或下方清单`, false)

// C13 行为口径证据完备性（--behavior 提供时生效；缺省跳过不计断言）
if (behaviorFile) {
  if (!fs.existsSync(behaviorFile)) { console.error('⑦类清单文件不存在：' + behaviorFile); process.exit(2) }
  const bAll = fs.readFileSync(behaviorFile, 'utf8').split(/\r?\n/).map((l) => l.trim())
  const sepRe = /^\|[\s:|-]+\|$/
  const headers = new Set()
  for (let i = 0; i + 1 < bAll.length; i++) {
    if (sepRe.test(bAll[i + 1])) headers.add(i)
  }
  const hasTable = bAll.some((l) => l.startsWith('|'))
  const evRe = /[\w./\\-]+\.(java|ts|vue|js|yml|sql|xml):\d+/
  let withEv = 0, pending = 0, missing = 0
  const missRows = []
  for (let i = 0; i < bAll.length; i++) {
    const l = bAll[i]
    if (!l || l.startsWith('#') || sepRe.test(l)) continue
    if (hasTable) { if (!l.startsWith('|') || headers.has(i)) continue } else { if (l.startsWith('|')) continue }
    if (l.includes('待证')) { pending++; continue }
    if (evRe.test(l)) withEv++
    else { missing++; if (missRows.length < 3) missRows.push(l.slice(0, 30)) }
  }
  const detail = '⑦类条目：证据=' + withEv + ' 待证=' + pending + ' 缺口=' + missing + (missRows.length ? '（如：' + missRows.join('；') + '）' : '')
  add('C13', '行为口径证据完备性', pending === 0 && missing === 0, detail, true)
} else {
  add('C13', '行为口径证据完备性', true, '跳过（未提供 --behavior 清单）', false)
}

// C14 分组小标题同型连排计数（信息输出，不断言；供自查 19a 人工复核）
const grpTitles = (raw.match(/^(?:#####\s|\*{2})?[（(]\d+[)）][^\n]{2,40}/gm) || []).map((s) => s.replace(/^#####\s*/, '').replace(/\*{2}/g, '').replace(/^[（(]\d+[)）]\s*/, '').trim())
const headOf = (t) => {
  const m = t.match(/^(查看|查询|维护|新增|编辑|删除|导入|导出|审核|生成|配置|设置|管理|搜索|筛选|切换|处理|提交|打印|下载|上传|登记|确认|取消)/)
  return m ? m[1] : t.slice(0, 2)
}
let maxRun = 0, curRun = 0, curHead = ''
for (const t of grpTitles) {
  const h = headOf(t)
  curRun = h === curHead ? curRun + 1 : 1
  curHead = h
  if (curRun > maxRun) maxRun = curRun
}
add('C14', '分组小标题同型连排（供 19a 复核）', true,
  `分组标题=${grpTitles.length} 最大同型连排=${maxRun}（连续 3 个同型即返工，人工判定）`, false)

// C15 四章引用文案密度（信息输出，不断言；供粒度 14 / 自查 21 双闸复核）
const ch4Seg = (raw.match(/## 四、操作说明[\s\S]*$/) || [''])[0]
const ch4cn = cn(ch4Seg)
const quoteMarks = cnt(ch4Seg, /\u0022/g) + cnt(ch4Seg, /[\u201C\u201D]/g) + cnt(ch4Seg, /[\u27E6\u27E7]/g)
const quotePairs = Math.floor(quoteMarks / 2)
const density = ch4cn > 0 ? +(quotePairs / (ch4cn / 1000)).toFixed(1) : 0
add('C15', '四章引用文案密度（供粒度 14 复核）', true,
  `四章文案条数=${quotePairs} 四章中文字=${ch4cn} 密度=${density} 条/千字（阈值：全篇 ≤18，写透模块单模块 ≤25）`, false)

const assertionFail = results.filter((r) => r['断言'] && !r.pass)
const exitCode = assertionFail.length ? 1 : 0

if (jsonOut) {
  console.log(JSON.stringify({ file, 只检查模块: onlyModule, 总中文字符: total, 退出码: exitCode, results, 起手句清单: starts }, null, 2))
} else {
  for (const r of results) console.log(`${r.pass ? '[通过]' : '[失败]'} ${r.id} ${r.name} —— ${r.detail}`)
  if (!jsonOut && starts.length) { console.log('\n=== 起手句清单（供禁用骨架比对）==='); starts.forEach((s) => console.log('  ' + s)) }
  console.log(`\n断言失败项：${assertionFail.length}；退出码：${exitCode}`)
}
process.exit(exitCode)
