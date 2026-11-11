// 通信タブの通し確認（全24日）：攻撃の再生 → 対策 → 「防げたか確かめる」→ クリア。
// 各日の対策画面は通らず、設定（cfg）を直接そろえて、通信タブの表示と進行だけを確かめる。
//   node test/smoke-net.cjs <index.html のあるフォルダ または URL> <スクショの出力先> [日,日,...]
const { chromium } = require('playwright');
const path = require('path');
const DIR = process.argv[2], OUT = process.argv[3], ONLY = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const URL = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(DIR, 'index.html');
const log = (...a) => console.log('[net]', ...a);

const SAFE = { ca: 'free', keyMade: true, token: 'DONE-DONE', issued: true, installed: 'fullchain', autoRenew: true, cert: true, https: true, redirect: true, tlsMin: '1.2', ciph: { aes: true, chacha: true, des3: false, rc4: false }, hsts: true, hstsAge: '31536000', code: {}, tasks: {} };
const cfg = o => { const c = JSON.parse(JSON.stringify(SAFE)); for (const k in o) { if (k === 'ciph' || k === 'code') Object.assign(c[k], o[k]); else c[k] = o[k]; } return c; };
// 日ごとの「未対策の設定」と「対策の中身」。fix は対策後に上書きする項目
const DAYS = {
  1: { bad: { https: false, cert: false, redirect: false, hsts: false, ca: null, installed: null, issued: false }, fix: {} },
  2: { bad: { tlsMin: '1.0', ciph: { rc4: true, des3: true }, hsts: false }, fix: { hsts: false } },
  3: { bad: { hsts: false }, fix: {} },
  4: { key: 'search', val: 'param' }, 5: { key: 'hash', val: 'bcrypt' }, 6: { key: 'price', val: 'server' }, 7: { key: 'review', val: 'escape' },
  8: { key: 'session', val: 'secure' }, 9: { key: 'csrf', val: 'token' }, 10: { key: 'access', val: 'owner' }, 11: { key: 'coupon', val: 'atomic' },
  12: { key: 'signup', val: 'verify' }, 13: { key: 'login', val: 'throttle' }, 14: { key: 'dos', val: 'shield' }, 15: { key: 'defense', val: 'layered' },
  16: { key: 'bots', val: 'challenge' }, 17: { key: 'firewall', val: 'restrict' },
  18: { bad: { autoRenew: false }, fix: {} },
  19: { key: 'os', val: 'update' }, 20: { key: 'deps', val: 'update' }, 21: { key: 'thirdparty', val: 'lock' }, 22: { key: 'apikey', val: 'server' },
  23: { key: 'registrar', val: 'lock' }, 24: { key: 'egress', val: 'monitor' }
};
const seed = (day, phase, c, last) => ({ rev: 2, day, phase, tab: 'shop', voices: [], badge: {}, cart: 0, chatLog: [], last: last || null, domain: 'pixeldo.shop', ds: null, whois: true, dnsOk: true, dnsVal: '', dnsMsg: '', dns: [{ type: 'A', name: '@', value: '203.0.113.24' }], svc: 'hub', sub: 'server', cfg: c });

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const errors = [], fails = [];
  const check = (day, what, ok) => { if (!ok) { fails.push(day + '日目: ' + what); log('NG', day + '日目', what); } };
  for (const day of Object.keys(DAYS).map(Number)) {
    if (ONLY && !ONLY.includes(day)) continue;
    const D = DAYS[day], bad = cfg(D.bad || {}), good = cfg(Object.assign({}, D.fix || {}, D.key ? { code: { [D.key]: D.val } } : {}));
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(day + '日目: ' + String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(day + '日目: ' + m.text()); });
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('gsi-demo-v2') || 'null'));
    const winUp = () => page.locator('#win').isVisible();
    const settle = async ph => { for (let i = 0; i < 120; i++) { const s = await state(); if (s && s.phase === ph) return true; if (await winUp()) await page.click('#win', { position: { x: 24, y: 16 } }); await page.waitForTimeout(60); } return false; };
    const clearWin = async () => { for (let i = 0; i < 40; i++) { if (!(await winUp())) return; await page.click('#win', { position: { x: 24, y: 16 } }); await page.waitForTimeout(40); } };
    const boot = async s => { await page.goto(URL); await page.evaluate(x => localStorage.setItem('gsi-demo-v2', x), JSON.stringify(s)); await page.reload(); await page.click('.menu button[data-t="cont"]'); await page.waitForTimeout(60); };
    const view = () => page.evaluate(() => {
      const vis = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('off'); };
      return { fits: document.documentElement.scrollHeight <= innerHeight, atk: vis('nAtk'), shield: vis('nShield'), warn: vis('nWarn'),
        lines: document.querySelectorAll('#netLog .ln.b').length, steps: document.querySelectorAll('#netLog .ln:not(.b)').length,
        head: (document.querySelector('#netLog .lh.atk') || {}).innerText || '', sub: (document.querySelector('#p-net>p') || {}).innerText || '',
        bad: document.querySelectorAll('#netLog .ln.b.bad').length, ok: document.querySelectorAll('#netLog .ln.b.ok').length };
    });

    // 1) 攻撃の日：通信タブを開くと再生され、対策フェーズへ進む
    await boot(seed(day, 'incident', bad));
    await clearWin();
    await page.click('.tabs button[data-tab="net"]');
    check(day, '攻撃の再生後に対策フェーズへ進む', await settle('fix'));
    await clearWin();
    const a = await view();
    check(day, '一画面に収まる（攻撃後）', a.fits);
    check(day, '攻撃者が図に出ている', a.atk);
    check(day, '「攻撃者の画面」の見出しと行がある', /攻撃者の画面/.test(a.head) && a.lines >= 2);
    check(day, '未対策なので被害の行がある', a.bad >= 1 && !a.shield);
    await page.screenshot({ path: path.join(OUT, 'net-' + String(day).padStart(2, '0') + '-a.png') });

    // 2) 対策してから「防げたか確かめる」→ クリア
    const s = await state();
    await boot(Object.assign(seed(day, 'fix', good, s.last), { tab: 'console' }));
    await clearWin();
    const before = await (async () => { await page.click('.tabs button[data-tab="net"]'); await page.waitForTimeout(60); return view(); })();
    check(day, '確かめる前は、前回の結果のまま（先に答えを見せない）', before.bad >= 1 && !before.shield);
    await page.click('#verifyBtn');
    check(day, '確かめるとクリアになる', await settle('clear'));
    await page.waitForTimeout(80);
    if (await page.locator('#modal').isVisible()) await page.evaluate(() => { document.getElementById('modal').hidden = true; });
    await clearWin();
    const b = await view();
    check(day, '防いだ印（盾）が出て、被害の行がない', b.shield && b.bad === 0 && b.ok >= 1);
    check(day, '一画面に収まる（対策後）', b.fits);
    await page.screenshot({ path: path.join(OUT, 'net-' + String(day).padStart(2, '0') + '-b.png') });
    log(`${day}日目 OK  攻撃:${a.steps}+${a.lines}行  対策後:${b.steps}+${b.lines}行  「${a.sub}」`);
    await page.close();
  }
  log('page errors:', errors.length ? errors : 'none');
  log(fails.length ? 'FAIL ' + fails.length + '件' : 'ALL PASS');
  await browser.close();
  if (errors.length || fails.length) process.exit(1);
})().catch(e => { console.error('[net] FAIL', e); process.exit(1); });
