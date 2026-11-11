// ディスプレイ（サイトタブ・管理タブ）の通し確認：デモのある日を、未対策と対策後のそれぞれで操作して表示を確かめる。
// 設定（cfg）は直接そろえる。確かめること：
//   ・ディスプレイ（.pc）が出ている　・シロのメモ（.hj-meta）がディスプレイの中に入っていない　・横にはみ出さない
//   ・未対策なら「まずいこと」のメモが出る／対策後なら出ず、「防げた」のメモが出る
//   ・管理タブ：未対策なら、対策を入れるタブ（ピクセルハブ）に案内の矢印が立つ／対策後は立たない
//   node test/smoke-site.cjs <index.html のあるフォルダ または URL> <スクショの出力先> [日,日,...]
const { chromium } = require('playwright');
const path = require('path');
const DIR = process.argv[2], OUT = process.argv[3], ONLY = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const URL = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(DIR, 'index.html');
const log = (...a) => console.log('[site]', ...a);

const SAFE = { ca: 'free', keyMade: true, token: 'DONE-DONE', issued: true, installed: 'fullchain', autoRenew: true, cert: true, https: true, redirect: true, tlsMin: '1.2', ciph: { aes: true, chacha: true, des3: false, rc4: false }, hsts: true, hstsAge: '31536000', code: {}, tasks: {} };
const cfg = o => { const c = JSON.parse(JSON.stringify(SAFE)); for (const k in o) { if (k === 'code') Object.assign(c.code, o[k]); else c[k] = o[k]; } return c; };
const seed = (day, c, D) => ({ rev: 2, day, phase: 'fix', tab: D.tab || 'shop', voices: [], badge: {}, cart: 0, chatLog: [], last: null, domain: 'pixeldo.shop', ds: null, whois: true, dnsOk: true, dnsVal: '', dnsMsg: '', dns: [{ type: 'A', name: '@', value: '203.0.113.24' }], svc: D.svc || 'hub', sub: D.sub || 'server', cfg: c });
// 日ごとの「対策の中身」と、デモの操作。bad は未対策のときに上書きする設定
const DAYS = {
  4: { key: 'search', val: 'param', steps: [async p => { await p.fill('#shopQ', "' OR '1'='1"); await p.click('.store-search [data-act="doSearch"]'); }] },
  6: { key: 'price', val: 'server', steps: [async p => { await p.click('[data-act="ordBuy"]'); }, async p => { await p.fill('#ordPrice', '1'); await p.click('[data-act="ordSend"]'); }] },
  7: { key: 'review', val: 'escape', steps: [async p => { await p.fill('#reviewQ', '<script>location="x"</script>'); await p.click('[data-act="postReview"]'); await p.waitForTimeout(1800); }] },
  8: { key: 'session', val: 'secure', steps: [async p => { await p.click('[data-act="sessOpen"]'); }, async p => { const b = p.locator('[data-act="sessShare"]'); if (await b.count()) await b.click(); }] },
  9: { key: 'csrf', val: 'token', steps: [async p => { await p.click('[data-act="csrfOpen"]'); }] },
  10: { key: 'access', val: 'owner', steps: [async p => { await p.click('[data-act="idorOpen"]'); }, async p => { const v = await p.inputValue('#idorUrl'); await p.fill('#idorUrl', v.replace(/id=\d+/, m => 'id=' + (Number(m.slice(3)) + 1))); await p.click('[data-act="idorGo"]'); }] },
  11: { key: 'coupon', val: 'atomic', steps: [async p => { await p.click('[data-act="couponFire"]'); }] },
  12: { key: 'signup', val: 'verify', steps: [async p => { await p.click('[data-act="botRun"]'); }] },
  13: { key: 'login', val: 'throttle', steps: [async p => { await p.click('[data-act="bruteTry"]'); }] },
  18: { bad: { autoRenew: false }, steps: [] },
  21: { key: 'thirdparty', val: 'lock', steps: [async p => { await p.click('[data-act="skimPay"]'); }] },
  22: { key: 'apikey', val: 'server', steps: [async p => { await p.click('[data-act="keyView"]'); }] },
  // 管理タブに出るデモ（サーバーやドメイン会社の画面）。tab/svc/sub は、開いておく画面
  5: { tab: 'console', svc: 'cloud', key: 'hash', val: 'bcrypt', steps: [async p => { await p.click('[data-act="storeRead"]'); }] },
  14: { tab: 'console', svc: 'cloud', key: 'dos', val: 'shield', steps: [async p => { await p.click('[data-act="dosFire"]'); }] },
  15: { tab: 'console', svc: 'cloud', key: 'defense', val: 'layered', steps: [async p => { await p.click('[data-act="wafEnc"]'); }, async p => { await p.click('[data-act="wafSend"]'); }] },
  16: { tab: 'console', svc: 'cloud', key: 'bots', val: 'challenge', steps: [async p => { await p.click('[data-act="scrapeRun"]'); }] },
  17: { tab: 'console', svc: 'cloud', key: 'firewall', val: 'restrict', steps: [async p => { await p.click('[data-act="fwTry"]'); }] },
  19: { tab: 'console', svc: 'cloud', key: 'os', val: 'update', steps: [async p => { const b = p.locator('[data-act="vulnScan"]'); if (await b.count()) await b.click(); }] },
  20: { tab: 'console', svc: 'cloud', key: 'deps', val: 'update', steps: [async p => { const b = p.locator('[data-act="vulnScan"]'); if (await b.count()) await b.click(); }] },
  23: { tab: 'console', svc: 'registrar', key: 'registrar', val: 'lock', steps: [async p => { await p.click('[data-act="domTry"]'); }] },
  24: { tab: 'console', svc: 'cloud', key: 'egress', val: 'monitor', steps: [async p => { await p.click('[data-act="exfilRun"]'); }] },
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const errors = [], fails = [];
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
      await page.evaluate(x => localStorage.setItem('gsi-demo-v2', x), JSON.stringify(seed(day, fixed ? cfg(D.key ? { code: { [D.key]: D.val } } : {}) : cfg(D.bad || {}), D)));
      await page.reload(); await page.click('.menu button[data-t="cont"]'); await clearWin();
      for (const step of D.steps) {
        try { await step(page); } catch (e) { check('デモを操作できる（' + String(e).split('\n')[0] + '）', false); }
        await page.waitForTimeout(120); await clearWin();
      }
      const v = await page.evaluate(() => {
        const P = document.querySelector('main .panel:not([hidden])'), g = P.querySelector('.btab .guide');
        return {
          pcs: P.querySelectorAll('.pc').length,
          metaIn: P.querySelectorAll('.viewport .hj-meta').length,
          wide: document.documentElement.scrollWidth > innerWidth || [...P.querySelectorAll('.viewport')].some(e => e.scrollWidth > e.clientWidth + 1),
          danger: P.querySelectorAll('.hj-meta.danger').length, ok: P.querySelectorAll('.hj-meta.ok').length,
          guide: g ? g.closest('.btab').id : '',
        };
      });
      check('ディスプレイが出ている', v.pcs >= 1);
      check('シロのメモがディスプレイの外にある', v.metaIn === 0);
      check('横にはみ出さない', !v.wide);
      if (fixed) check('対策後は「まずいこと」のメモがなく、「防げた」のメモがある', v.danger === 0 && v.ok >= 1);
      else check('未対策は「まずいこと」のメモが出る', v.danger >= 1);
      if (D.tab === 'console') check(fixed ? '対策後は、案内の矢印が立たない' : '未対策は、ピクセルハブのタブに案内の矢印が立つ', v.guide === (fixed ? '' : 'svc-hub'));
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
