// 局内网页面（HTML 字符串）。state = { st, tab, view, q, pset, mail }；所有剧情原文运行时取 content.doc(id)
import { content } from '../../engine/content.js';
import { NET, NOTICES, DIRECTORY, MAILS, INCIDENTS, DEPT, LEGAL_CASES, LEGAL_REFS, FACTIONS, CLOCKS, CMD, LOANS, STACKS, SANITY, MEDS, DIR, B2, B5, PEOPLE, WANTED } from './data.js';

export const TABS = [['home', '门户首页'], ['people', '人员档案'], ['mail', '内部邮件'], ['reg', '异常登记簿'], ['dept', '本处专页']];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const H3 = (zh, en) => `<h3>${zh}<small>${en ?? ''}</small></h3><div class="rule"></div>`;
const docText = (id) => content.doc(id).text ?? '';
const docTitle = (id) => content.doc(id).title ?? '';
const field = (txt, key) => (txt.match(new RegExp(key + '：([^\\n]*)')) ?? [])[1] ?? '';

export function frame(state) {
  const st = state.st; const dept = DEPT[st.page];
  return `<div class="bezel"><div class="screen">
  <div class="top"><img src="${content.texUrl('tex_emblem_hd') ?? ''}" alt=""><div><div class="t1">${NET.name}</div><div class="t2">${NET.en}</div></div>
    <div class="who">终端 <b>${st.term}</b>　·　${esc(st.label)}<br>用户 <b>XS-2026-1029-07</b>（临时权限）　${NET.date}</div></div>
  <div class="nav">${TABS.map(([k, n], i) => `<span data-tab="${k}" class="${state.tab === k ? 'on' : ''}"><i>F${i + 1}</i>${k === 'dept' ? (dept.short ?? dept.title) : n}</span>`).join('')}<span class="esc" data-act="close"><i>Esc</i>退出登录</span></div>
  <div class="main" id="nbmain">${page(state)}</div>
  <div class="status"><span>NB-NET　<b>连接正常</b></span><span>京城总部　现实稳定度 <b>${NET.stab}</b></span><span>叙事污染指数 <b>${NET.pol}</b></span><span>地下驯化空间 驯化度 <b>${NET.tame}</b></span><span class="cur">▮</span></div>
  </div><div class="plate"><b>叙事管理局</b>NB-4 TERMINAL · ${st.term}</div><div class="led"></div></div>`;
}

export function page(state) {
  switch (state.tab) {
    case 'home': return state.view?.doc ? docView(state.view.doc, state.view.no) : home(state);
    case 'people': return state.view?.person ? personView(state.view.person) : people(state);
    case 'mail': return mail(state);
    case 'reg': return reg();
    default: return dept(state);
  }
}

function home() {
  const fresh = content.has('q1_badge') ? '今日新入职 1 人：XS-2026-1029-07　姓名：——（人工处理中）' : '今日新入职 1 人：XS-2026-1029-07　待报到';
  return `<div class="cols"><div>
    ${H3('局内公告', 'BULLETIN')}
    <table><tr><th>文号</th><th>标题</th><th>发布</th><th>日期</th></tr>
    ${NOTICES.map((n, i) => `<tr class="click" data-doc="${n.doc}" data-no="${esc(n.no)}"><td class="mono">${esc(n.no)}</td><td>${n.pin ? '<span class="tag pin">置顶</span>' : ''}${esc(n.title)}</td><td class="dim">${n.from}</td><td class="mono">${n.date}</td></tr>`).join('')}</table>
    <div class="card" style="margin-top:16px"><div class="dim" style="font-size:13px;letter-spacing:.08em">人事处 · 今日报到</div><div class="mono ph" style="margin-top:6px;font-size:13.5px">${fresh}</div></div>
  </div><div>
    ${H3('今日态势', 'TODAY')}
    <div class="card"><div class="dim" style="font-size:12.5px">京城　${NET.date}　${NET.weather}</div><div class="big">${NET.stab}</div><div class="dim" style="font-size:12.5px;margin-bottom:8px">现实稳定度（较昨日 ▼0.4%）</div>
      <dl class="kv"><dt>叙事污染指数</dt><dd>${NET.pol}</dd><dt>全国现实稳定度</dt><dd>${CMD.national}</dd><dt>地下驯化空间</dt><dd>驯化度 ${NET.tame}　稳定</dd><dt>文本完整性扫描</dt><dd>今日通过 1,284 人　复核 3 人</dd><dt>全国叙事高考</dt><dd>距 2027 年 222 天</dd></dl></div>
    ${H3('处室通讯录', 'DIRECTORY')}
    <table>${DIRECTORY.map((d) => `<tr><td class="dim" style="font-size:12.5px">${d[0]}</td><td>${d[1]}</td><td class="mono">${d[3]}</td></tr>`).join('')}</table>
  </div></div>`;
}

function docView(id, no) {
  const d = content.doc(id);
  const red = /办〔|通知/.test(no ?? '') || id === 'doc_office_notice';
  return `<span class="back" data-act="back">← 返回公告列表（Esc）</span><div class="doc">${red ? '<div class="red">叙事管理局文件</div>' : ''}<div class="no">${esc(no ?? '')}</div><h4>${esc(d.title)}</h4><div class="body">${esc(d.text)}</div></div>`;
}

// —— 人员档案检索 ——
const P = (k) => { const id = 'doc_archive_pub_' + k; const d = content.doc(id); const name = field(d.text, '姓名') || d.title.split('·').pop().trim(); return { k, id, name, seq: field(d.text, '序列'), d, tex: d.texture ? content.texUrl(d.texture) : content.texUrl('tex_archive_portrait_' + k) }; };
function people(state) {
  const q = (state.q ?? '').trim();
  const head = `${H3('人员档案检索', 'PERSONNEL FILES')}<div class="search"><input id="nbq" placeholder="输入姓名 / 序列 / 档号，回车检索" value="${esc(q)}" autocomplete="off" spellcheck="false"><span class="seg"><span data-pset="pub" class="${state.pset !== 'wanted' ? 'on' : ''}">登记叙事者 · 公开档案</span><span data-pset="wanted" class="${state.pset === 'wanted' ? 'on' : ''}">高危通缉</span></span></div>`;
  if (q && /07-0-0000|XS-2026-1029-07/i.test(q)) return head + `<div class="empty">检索「${esc(q)}」<br>电子档案系统中无此档号。<br>本人档案请至西翼人事档案馆，由管理员陪同调阅纸质档案。</div>`;
  if (q && /留白/.test(q)) return head + `<div class="empty">检索「留白」：0 条结果。<br><span class="dim">（该检索词已记录。）</span></div>`;
  if (q && /^(K|第七局)$/i.test(q)) return head + `<div class="empty">检索「${esc(q)}」：请参见 4.4。</div>`;
  if (state.pset === 'wanted') return head + `<div class="grid">${WANTED.map((w, i) => `<div class="pc" data-wanted="${i}"><div class="im" style="background-image:url('${content.texUrl(w.tex) ?? ''}')"></div><div class="n">${w.name}</div><div class="s">${w.lv}</div></div>`).join('')}</div><p class="dim" style="font-size:13px;margin-top:14px">外勤缉拿处：发现后切勿接触，立即撤离并报警。</p>`;
  let list = PEOPLE.map(P); if (q) list = list.filter((p) => (p.name + p.seq + p.d.text).includes(q));
  return head + (list.length ? `<div class="grid">${list.map((p) => `<div class="pc ${p.k === 'xiaonan' ? 'lock' : ''}" data-person="${p.k}"><div class="im" style="background-image:url('${p.tex ?? ''}')"></div><div class="n">${p.k === 'xiaonan' ? '——' : p.name}</div><div class="s">${p.k === 'xiaonan' ? 'FRAGMENT' : esc(p.seq || field(p.d.text, '职业').slice(0, 6))}</div></div>`).join('')}</div>` : `<div class="empty">检索「${esc(q)}」：无匹配记录。</div>`)
    + `<p class="dim" style="font-size:12.5px;margin-top:14px">${esc(docText('doc_archive_public_intro'))}</p>`;
}
function personView(k) {
  if (String(k).startsWith('w')) { const w = WANTED[+k.slice(1)]; return `<span class="back" data-act="back">← 返回检索（Esc）</span><div class="pdet"><img src="${content.texUrl(w.tex) ?? ''}"><div>${H3(w.name + '　' + w.seq, 'WANTED')}<div class="stampx">${w.lv}</div><div class="body">${esc(w.text)}</div><p class="dim">叙事管理局　外勤缉拿处</p></div></div>`; }
  const p = P(k);
  if (k === 'xiaonan') return `<span class="back" data-act="back">← 返回检索（Esc）</span><div class="pdet"><img src="${p.tex ?? ''}" style="filter:blur(6px) grayscale(1) brightness(.5)"><div>${H3('调阅受限', 'RESTRICTED')}<div class="stampx">暂停调阅</div><div class="body">档案类型：FRAGMENT（残档）\n登记状态：UNKNOWN\n\n本格档案经上级通知暂停展出，电子副本同步封存。\n如需调阅，请向人事档案馆管理员提出申请。</div></div></div>`;
  return `<span class="back" data-act="back">← 返回检索（Esc）</span><div class="pdet"><img src="${p.tex ?? ''}"><div>${H3(p.d.title, 'FILE')}<div class="body">${esc(p.d.text)}</div><p class="dim" style="font-size:12.5px">档案内容仅限阅览，禁止抄录能力细节，禁止朗读其中的引语。</p></div></div>`;
}

// —— 内部邮件 ——
function mail(state) {
  const cur = MAILS.find((m) => m.id === state.mail) ?? MAILS[0];
  return `<div class="mail"><div class="ml">${MAILS.map((m) => `<div class="mi ${m.id === cur.id ? 'on' : ''} ${m.flag === 'odd' ? 'odd' : ''}" data-mail="${m.id}"><div class="f"><span>${esc(m.from)}</span><span>${m.date}</span></div><div class="sj">${m.flag === 'new' ? '<span class="tag new">新</span>' : ''}${esc(m.subj)}</div></div>`).join('')}</div>
  <div class="mv ${cur.flag === 'odd' ? 'odd' : ''}"><div class="hd">发件人　<b>${esc(cur.from)}</b><br>收件人　<b>${esc(cur.to)}</b>${cur.cc ? `<br>抄　送　<b>${esc(cur.cc)}</b>` : ''}<br>时　间　<b>2026-${cur.date}</b></div><h4>${esc(cur.subj)}</h4><div class="body">${esc(cur.body)}</div></div></div>`;
}

// —— 叙事异常登记簿 ——
function reg() {
  return `${H3('叙事异常登记簿', 'NARRATIVE ANOMALY REGISTER')}<p class="dim" style="font-size:12.5px;margin:-4px 0 10px">登记范围：本局京城总部经手及协办事件。境外与特级禁区（9 级）以只读形式见禁区封锁调度厅，不在此登记。</p>
  <table><tr><th>编号</th><th>时间</th><th>地点</th><th>等级</th><th>现象</th><th>状态</th><th>处置单位</th></tr>
  ${INCIDENTS.map((r) => `<tr class="${/自动消除/.test(r[5]) ? 'auto' : /封锁|预警/.test(r[5]) ? 'warn' : ''}"><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td class="dim">${r[6]}</td></tr>`).join('')}</table>
  <p class="dim" style="font-size:12.5px;margin-top:12px">注：系统自动消除的读数按惯例不计入月报。京城地下 · 8 级 · 已驯化，不计入。</p>`;
}

// —— 各处室专页 ——
function dept(state) {
  const st = state.st, D = DEPT[st.page]; const head = `${H3(D.title, D.en)}<p class="dim" style="font-size:13px;margin:-4px 0 14px;letter-spacing:.06em">${D.sub}</p>`;
  const T = (h, rows, cls = () => '') => `<table><tr>${h.map((x) => `<th>${x}</th>`).join('')}</tr>${rows.map((r, i) => `<tr class="${cls(r, i)}">${r.map((c, j) => `<td class="${j === 0 ? 'mono' : ''}">${c}</td>`).join('')}</tr>`).join('')}</table>`;
  switch (st.page) {
    case 'legal': return head + `<div class="cols"><div>${H3('契约类能力合同解除登记', '117')}${T(['登记号', '当事人', '合同', '影响', '状态'], LEGAL_CASES)}
      <div class="card" style="margin-top:16px"><div class="gold" style="font-family:var(--serif-zh);font-weight:600;letter-spacing:.2em">来访须知</div><div style="margin-top:6px;line-height:1.9">来访请先敲门。<br>不要对律师说「我发誓」。<br>已签署的【画押】类合同请勿自行撕毁，撕毁不等于解除。</div></div></div>
      <div>${H3('法规速查', 'STATUTES')}<table>${LEGAL_REFS.map((r) => `<tr><td style="white-space:nowrap" class="gold">${r[0]}</td><td class="dim" style="font-size:13px">${r[1]}</td></tr>`).join('')}</table>
      <p class="dim" style="font-size:12.5px;margin-top:12px">「法律也是一种现实。」—— 方妍</p></div></div>`;
    case 'liaison': return head + `${H3('世界时钟', 'WORLD CLOCKS')}<div class="clocks">${CLOCKS.map(([n, off]) => `<div><div class="c">${off == null ? '--:--' : clock(off)}</div><div class="l">${n}${off == null ? '（坐标漂移中）' : ''}</div></div>`).join('')}</div>
      <div class="cols" style="margin-top:18px"><div>${H3('势力评估摘要', 'FACTION ASSESSMENT')}<table><tr><th>#</th><th>势力</th><th>属性</th><th>关系</th></tr>${FACTIONS.map((f, i) => `<tr class="${f[0] === '（空）' ? 'auto' : ''}"><td class="mono">${String(i + 1).padStart(2, '0')}</td><td class="gold">${f[0]}</td><td class="dim">${f[1]}</td><td>${f[2]}</td></tr>`).join('')}</table><p class="dim" style="font-size:12.5px">评估墙共 13 个位置。评估内容不代表本局正式外交立场。</p></div>
      <div>${H3('来电记录', 'CALL LOG')}<div class="card"><div class="body" style="white-space:pre-wrap;line-height:1.9;font-size:14px">${esc(docText('doc_liaison_greytower_call'))}</div></div>${H3('渡鸦信箱', 'RAVEN POST')}<div class="card dim" style="font-size:13.5px;line-height:1.9">深瞳渡鸦投递 1 封（匿名，已拆阅）。<br>LIA-2026-0919 黑色书签 1 枚（已拦截）。</div></div></div>`;
    case 'publicity': return head + `<div class="cols"><div>${H3('《宣传口径手册》第 4 章', 'GUIDELINES')}<div class="card" style="white-space:pre-wrap;line-height:2;font-size:14.5px">${esc(docText('doc_pub_guide'))}</div>
      ${H3('通稿审核队列', 'PRESS QUEUE')}${T(['稿号', '标题', '状态'], [['XC-1028-03', '我局成功处置通州区 1 级禁区「重复路段」事件', '第三稿 · 待发'], ['XC-1027-01', '2027 全国叙事高考觉醒加试报名启动', '已发布']])}</div>
      <div>${H3('短视频后台 · 热门评论', 'COMMENTS')}<div class="card" style="white-space:pre-wrap;line-height:2;font-size:14px">${esc(docText('doc_pub_comments'))}</div><p class="dim" style="font-size:12.5px">「已折叠」评论按 4.2 处理，无需回复。</p></div></div>`;
    case 'command': return head + `<div class="cols3"><div class="card"><div class="dim">全国现实稳定度</div><div class="big">${CMD.national}</div></div><div class="card"><div class="dim">京城</div><div class="big">${NET.stab}</div></div><div class="card"><div class="dim">地下驯化空间 驯化度</div><div class="big">${NET.tame}</div></div></div>
      <div class="cols"><div>${H3('今日预警', 'ALERTS')}<table>${CMD.alerts.map((a) => `<tr><td><span class="tag ${a[0] === '橙色' ? 'or' : 'ye'}">${a[0]}</span></td><td>${a[1]}</td><td>${a[2]}</td></tr>`).join('')}</table>
      ${H3('京城逐时读数', 'HOURLY')}<table>${CMD.hourly.map((h) => `<tr class="${h[2] ? 'auto' : ''}"><td class="mono">${h[0]}</td><td class="mono">${h[1]}</td></tr>`).join('')}</table></div>
      <div>${H3('各区监测', 'DISTRICTS')}<table>${CMD.districts.map((d) => `<tr class="${d[2] ? 'warn' : ''}"><td>${d[0]}</td><td class="mono">${d[1]}${d[2] ? '　⚠' : ''}</td></tr>`).join('')}</table>
      ${H3('预警发布流程', 'PROTOCOL')}<div class="card" style="white-space:pre-wrap;line-height:1.9;font-size:13.5px">${esc(docText('doc_cmd_alert_flow'))}</div></div></div>`;
    case 'archive': return head + `<div class="cols"><div>${H3('电子借阅记录', 'LOANS')}${T(['日期', '档号', '调阅人', '陪同', '归还'], LOANS)}<p class="dim" style="font-size:12.5px">电子系统只收录在册档号；纸质借阅登记簿另存借阅柜台，以纸质为准。</p>
      ${H3('馆藏分布', 'STACKS')}${T(['库区', '馆藏', '说明'], STACKS)}</div><div>${H3('阅览规章', 'RULES')}<div class="card" style="white-space:pre-wrap;line-height:2;font-size:14px">${esc(docText('doc_archive_rules'))}</div></div></div>`;
    case 'medical': return head + `<div class="cols"><div>${H3('理智值记录（脱敏）', 'SANITY LOG')}${T(['时间', '对象', '理智值', '分级', '处置'], SANITY)}
      ${H3('理智值自测', 'SELF-TEST')}<div class="card" id="nbsan">${state.view?.san ? `<div class="meter"><i style="width:0"></i></div><div class="alertbox" style="margin-top:10px">无法测定：被测者文本过短。<br><span style="font-size:12.5px">（本结果不登记。如有不适，请到诊室找苏予医生。）</span></div>` : `<div class="dim" style="font-size:13.5px">请将手掌放在读数板上，保持安静，勿默念任何文字。</div><span class="btnx" data-act="san">开始测定</span>`}</div></div>
      <div>${H3('理智值分级表', 'SCALE')}<div class="card" style="white-space:pre-wrap;line-height:1.95;font-size:13.5px">${esc(docText('doc_med_sanity_table'))}</div>${H3('药柜', 'DISPENSARY')}<table>${MEDS.map((m) => `<tr><td class="gold">${m[0]}</td><td class="dim" style="font-size:13px">${m[1]}</td></tr>`).join('')}</table></div></div>`;
    case 'director': {
      const classified = st.sub === 'classified';
      return head + `<div class="cols"><div>${H3('日程', 'SCHEDULE')}${T(['日期', '事项', '备注'], DIR.schedule)}${H3('来访与送审登记', 'VISITORS')}${T(['日期', '来源', '事由', '处理'], DIR.visitors)}</div>
      <div>${H3('机要文件目录', 'CLASSIFIED INDEX')}${classified ? `<div class="card" style="white-space:pre-wrap;line-height:2;font-size:14px">${esc(docText('doc_dir_secret_index'))}</div><p class="dim" style="font-size:12.5px">密电终端 · 仅限机要室内查阅，禁止打印。</p>` : `<div class="alertbox">权限不足。<br>机要文件目录须持机要级证件，于机要室密电终端查阅。<br><span style="font-size:12.5px">当前用户：XS-2026-1029-07（临时权限）</span></div>`}
      <div class="card" style="margin-top:16px;font-size:14px;line-height:1.9">${esc(content.doc('doc_dir_motto_draft').title)}<br><span class="dim">（原件存局长室，不提供电子副本。）</span></div></div></div>`; }
    case 'interrogation': return head + `<div class="cols"><div>${H3('羁押台账', 'CUSTODY')}${T(['对象', '归属', '状态', '材料'], B2)}${H3('笔录索引', 'TRANSCRIPTS')}${T(['编号', '被审讯人', '页数'], [['SX-2026-1027-01', '第二草稿成员（代号「誊抄员」）', '1']])}</div>
      <div>${H3('监看须知', 'NOTICE')}<div class="card" style="line-height:1.9;font-size:14px">监看期间请勿与被审讯人对视超过十秒。<br>若被审讯人说出您的下一句话，请立即离开观察间，到医务室登记。</div></div></div>`;
    case 'vault': return head + `<div class="cols"><div>${H3('深库收容台账', 'DEEP VAULT')}<table><tr><th>编号</th><th>名称</th><th>等级</th><th>收容位置</th><th>处理要求</th></tr>${B5.map((r) => `<tr><td class="mono">${r[0]}</td><td class="gold">${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="dim">${r[4]}</td></tr>`).join('')}</table></div>
      <div>${H3('分级收容制度', 'RULES')}<div class="card" style="white-space:pre-wrap;line-height:1.95;font-size:13.5px">${esc(docText('doc_vault_rules'))}</div></div></div>`;
    default: return head;
  }
}
function clock(off) { const d = new Date(Date.now() + (off + 8) * 3600e3 + new Date().getTimezoneOffset() * 60e3); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
