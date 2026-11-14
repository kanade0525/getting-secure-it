// ディスプレイ（サイトタブ・管理タブ）の通し確認：デモのある日を、未対策と対策後のそれぞれで操作して表示を確かめる。
// 設定（cfg）は直接そろえる。確かめること：
//   ・ディスプレイ（.pc）が出ている　・シロのメモ（.hj-meta）がディスプレイの中に入っていない　・横にはみ出さない
//   ・未対策なら「まずいこと」のメモが出る／対策後なら出ず、「防げた」のメモが出る
//   ・管理タブ：未対策なら、対策を入れる場所（ブラウザのタブか、良えWSの小メニュー）に案内の矢印が立つ／対策後は立たない
//   node test/smoke-site.cjs <index.html のあるフォルダ または URL> <スクショの出力先> [日,日,...]
const { chromium } = require('playwright');
const path = require('path');
const DIR = process.argv[2], OUT = process.argv[3], ONLY = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const URL = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(DIR, 'index.html');
const log = (...a) => console.log('[site]', ...a);

// 設定は、ゲーム本体から「n日目の朝の設定」を取り出して使う（#debug のときだけ window.GSI_DEBUG がある）。
//   未対策＝その日の朝（前の日までの対策だけ）／対策後＝次の日の朝（その日の対策も入っている）
const getPlan = async browser => {
  const p = await browser.newPage(); await p.goto(URL + '#debug');
  const r = await p.evaluate(() => { const o = {}, G = window.GSI_DEBUG; for (let n = 1; n <= G.lastDay; n++) o[n] = { bad: G.cfgForDay(n), good: G.cfgForDay(n + 1), dnsBad: G.dnsForDay(n), dnsGood: G.dnsForDay(n + 1) }; return o; });
  await p.close(); return r;
};
const seed = (day, c, rec, D) => ({ rev: 3, day, phase: 'fix', tab: D.tab || 'shop', voices: [], badge: {}, traps: [], cart: 0, chatLog: [], last: null, domain: 'pixeldo.shop', ds: null, whois: true, dnsOk: true, dnsVal: '', dnsMsg: '', dns: [rec], svc: D.svc || 'hub', sub: D.sub || 'server', cfg: c });
// 日ごとのデモの操作。tab/svc/sub は、開いておく画面。guide は、未対策のときに案内の矢印が立つ場所
//   （ブラウザのタブ＝svc-◯◯／良えWSの小メニュー＝sub-◯◯／対策を入れる画面をもう開いているなら ''）
const DAYS = {
  4: { steps: [async p => { await p.fill('#shopQ', "' OR '1'='1"); await p.click('.store-search [data-act="doSearch"]'); }] },
  6: { steps: [async p => { await p.click('[data-act="ordBuy"]'); }, async p => { await p.fill('#ordPrice', '1'); await p.click('[data-act="ordSend"]'); }] },
  7: { steps: [async p => { await p.fill('#reviewQ', '<script>location="x"</script>'); await p.click('[data-act="postReview"]'); await p.waitForTimeout(1800); }] },
  8: { steps: [async p => { await p.click('[data-act="sessOpen"]'); }, async p => { const b = p.locator('[data-act="sessShare"]'); if (await b.count()) await b.click(); }] },
  9: { steps: [async p => { await p.click('[data-act="csrfOpen"]'); }] },
  10: { steps: [async p => { await p.click('[data-act="idorOpen"]'); }, async p => { const v = await p.inputValue('#idorUrl'); await p.fill('#idorUrl', v.replace(/id=\d+/, m => 'id=' + (Number(m.slice(3)) + 1))); await p.click('[data-act="idorGo"]'); }] },
  // 連打：すき間（約1.5秒）のうちに6回押し、結果が出るのを待つ
  11: { steps: [async p => { for (let i = 0; i < 6; i++) await p.click('[data-act="couponApply"]'); await p.waitForTimeout(2400); }] },
  12: { steps: [async p => { await p.click('[data-act="botRun"]'); }] },
  13: { steps: [async p => { await p.click('[data-act="bruteTry"]'); }] },
  18: { steps: [] },
  21: { steps: [async p => { await p.click('[data-act="skimPay"]'); }] },
  22: { steps: [async p => { await p.click('[data-act="keyView"]'); }] },
  // 管理タブに出るデモ（良えWS・キットハブ・おなまえや.comの画面）
  5: { tab: 'console', svc: 'cloud', sub: 'server', guide: 'svc-hub', steps: [async p => { await p.click('[data-act="storeRead"]'); }] },
  14: { tab: 'console', svc: 'cloud', sub: 'server', guide: 'sub-waf', steps: [async p => { await p.click('[data-act="dosFire"]'); }] },
  15: { tab: 'console', svc: 'cloud', sub: 'waf', guide: 'svc-hub', steps: [async p => { await p.click('[data-act="wafEnc"]'); }, async p => { await p.click('[data-act="wafSend"]'); }] },
  16: { tab: 'console', svc: 'cloud', sub: 'waf', guide: '', steps: [async p => { await p.click('[data-act="scrapeRun"]'); }] },
  17: { tab: 'console', svc: 'cloud', sub: 'server', guide: 'sub-fw', steps: [async p => { await p.click('[data-act="fwTry"]'); }] },
  19: { tab: 'console', svc: 'cloud', sub: 'server', guide: '', steps: [async p => { const b = p.locator('[data-act="vulnScan"]'); if (await b.count()) await b.click(); }] },
  20: { tab: 'console', svc: 'hub', guide: '', steps: [] },
  23: { tab: 'console', svc: 'registrar', guide: '', steps: [async p => { await p.click('[data-act="domTry"]'); }] },
  24: { tab: 'console', svc: 'cloud', sub: 'mon', guide: 'sub-fw', steps: [async p => { await p.click('[data-act="exfilRun"]'); }] },
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const errors = [], fails = [];
  const PLAN = await getPlan(browser);
  for (const day of Object.keys(DAYS).map(Number).sort((a, b) => a - b)) {
    if (ONLY && !ONLY.includes(day)) continue;
    const D = DAYS[day];
    for (const fixed of [false, true]) {
      const tag = day + '日目（' + (fixed ? '対策後' : '未対策') + '）';
      const check = (what, ok) => { if (!ok) { fails.push(tag + ': ' + what); log('NG', tag, what); } };
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      page.on('pageerror', e => errors.push(tag + ': ' + String(e)));
      page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(tag + ': ' + m.text()); });
      const clearWin = async () => { for (let i = 0; i < 40; i++) { if (!(await page.locator('#win').isVisible())) return; await page.click('#win', { position: { x: 24, y: 16 } }); await page.waitForTimeout(40); } };
      await page.goto(URL);
      await page.evaluate(x => localStorage.setItem('gsi-demo-v2', x), JSON.stringify(seed(day, fixed ? PLAN[day].good : PLAN[day].bad, fixed ? PLAN[day].dnsGood : PLAN[day].dnsBad, D)));
      await page.reload(); await page.click('.menu button[data-t="cont"]'); await clearWin();
      for (const step of D.steps) {
        try { await step(page); } catch (e) { check('デモを操作できる（' + String(e).split('\n')[0] + '）', false); }
        await page.waitForTimeout(120); await clearWin();
      }
      const v = await page.evaluate(() => {
        const P = document.querySelector('main .panel:not([hidden])'), g = P.querySelector('.btab .guide'), gs = P.querySelector('.sub .guide');
        return {
          pcs: P.querySelectorAll('.pc').length,
          metaIn: P.querySelectorAll('.viewport .hj-meta').length,
          wide: document.documentElement.scrollWidth > innerWidth || [...P.querySelectorAll('.viewport')].some(e => e.scrollWidth > e.clientWidth + 1),
          danger: P.querySelectorAll('.hj-meta.danger').length, ok: P.querySelectorAll('.hj-meta.ok').length,
          guide: g ? g.closest('.btab').id : gs ? 'sub-' + gs.closest('.sub').dataset.sub : '',
        };
      });
      check('ディスプレイが出ている', v.pcs >= 1);
      check('シロのメモがディスプレイの外にある', v.metaIn === 0);
      check('横にはみ出さない', !v.wide);
      if (fixed) check('対策後は「まずいこと」のメモがなく、「防げた」のメモがある', v.danger === 0 && v.ok >= 1);
      else check('未対策は「まずいこと」のメモが出る', v.danger >= 1);
      if (D.tab === 'console') check(fixed ? '対策後は、案内の矢印が立たない' : '未対策は、対策を入れる場所に案内の矢印が立つ（' + (D.guide || 'いま開いている画面') + '）', v.guide === (fixed ? '' : D.guide));
      await page.screenshot({ path: path.join(OUT, 'site-' + String(day).padStart(2, '0') + (fixed ? '-b' : '-a') + '.png') });
      await page.close();
    }
    log(day + '日目 OK');
  }
  log('page errors:', errors.length ? errors : 'none');
  log(fails.length ? 'FAIL ' + fails.length + '件' : 'ALL PASS');
  await browser.close();
  if (errors.length || fails.length) process.exit(1);
})().catch(e => { console.error('[site] FAIL', e); process.exit(1); });
