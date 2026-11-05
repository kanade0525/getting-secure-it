const { chromium } = require('playwright');
const path = require('path');
const DIR = process.argv[2], OUT = process.argv[3];
const URL = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(DIR, 'index.html');
const log = (...a) => console.log('[ch2]', ...a);

const SEED = {
  day: 3, phase: 'clear', tab: 'console', voices: [], badge: {}, cart: 0, shopQ: '', shopRes: null, seenLeak: false, last: null,
  domain: 'pixeldo.shop', ds: null, whois: true, dnsOk: true, dnsVal: '', dnsMsg: '',
  dns: [{ type: 'A', name: '@', value: '203.0.113.24' }], svc: 'cloud', sub: 'net',
  relMsg: '', dcvMsg: '', instMsg: '', dnsAddMsg: '',
  cfg: { ca: 'free', keyMade: true, token: 'DONE-DONE', issued: true, installed: 'fullchain', autoRenew: true, cert: true, https: true, redirect: true, tlsMin: '1.2', ciph: { aes: true, chacha: true, des3: false, rc4: false }, hsts: true, hstsAge: '31536000', code: {}, app: {}, tasks: {} }
};
const PLAY = {
  4: { fix: { search: 'param' }, tasks: ['notice', 'report'] },
  5: { fix: { hash: 'bcrypt' }, tasks: ['resetGuide'] },
  6: { fix: { price: 'server' }, tasks: ['cancel'] },
  7: { fix: { review: 'escape' }, tasks: ['delete', 'resetGuide'] },
  8: { appsel: { store: 'cookie', samesite: 'lax', expiry: '2weeks' }, appsw: ['secure', 'httponly', 'logout'], tasks: ['invalidate'] },
  9: { fix: { csrf: 'token' }, tasks: ['cancel', 'restore'] },
  10: { fix: { access: 'owner' }, tasks: ['api', 'notice'] },
  11: { fix: { coupon: 'atomic' }, tasks: ['cancel'] }
};

(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
  await p.goto(URL);
  await p.evaluate(s => localStorage.setItem('gsi-demo-v2', s), JSON.stringify(SEED));
  await p.reload();
  const state = () => p.evaluate(() => JSON.parse(localStorage.getItem('gsi-demo-v2') || 'null'));
  const winUp = () => p.locator('#win').isVisible();
  const tab = async t => { await p.click(`.tabs button[data-tab="${t}"]`); await p.waitForTimeout(40); };
  const svc = async s => { await p.click(`#svc-${s}`); await p.waitForTimeout(40); };
  const sub = async s => { await p.click(`.sub[data-sub="${s}"]`); await p.waitForTimeout(40); };
  // フェーズに達するまで会話を消しつつ待つ（会話中はログが止まる新挙動に対応）
  const settle = async ph => { for (let i = 0; i < 160; i++) { const s = await state(); if (s && s.phase === ph) return; if (await winUp()) await p.click('#win'); await p.waitForTimeout(100); } throw new Error('phase ' + ph + ' not reached; now ' + (await state()).phase + ' day ' + (await state()).day); };
  // 解説モーダルの「次へ」が出るまで会話を消す
  const toNext = async () => { for (let i = 0; i < 60; i++) { if (await p.locator('#sheet [data-act="nextDay"]').isVisible()) { await p.click('#sheet [data-act="nextDay"]'); return; } if (await winUp()) await p.click('#win'); await p.waitForTimeout(100); } throw new Error('learn modal nextDay not shown, day ' + (await state()).day); };

  await p.click('.menu button[data-t="cont"]');
  await toNext(); // 3日目の解説 → 4日目へ
  await settle('incident');
  log('day after seed:', (await state()).day);

  for (let day = 4; day <= 11; day++) {
    if ((await state()).day !== day) throw new Error('expected day ' + day + ' got ' + (await state()).day);
    await tab('net'); await settle('fix');
    const label = await p.locator('.loghead span').innerText();
    const play = PLAY[day];
    await tab('console');
    if (play.fix) { await svc('hub'); for (const k in play.fix) { await p.check(`input[data-fix="${k}"][data-v="${play.fix[k]}"]`); await p.waitForTimeout(20); } }
    if (play.appsel || play.appsw) {
      await svc('cloud'); await sub('app');
      for (const k in (play.appsel || {})) { await p.selectOption(`#app-${k}`, play.appsel[k]); await p.waitForTimeout(20); }
      for (const k of (play.appsw || [])) { const btn = p.locator(`#app-${k}`); if ((await btn.getAttribute('aria-pressed')) !== 'true') await btn.click(); await p.waitForTimeout(20); }
    }
    if (play.tasks) { await tab('shop'); for (const id of play.tasks) { await p.click(`button[data-act="task"][data-id="${id}"]`); await p.waitForTimeout(40); await p.click(`#sheet [data-act="taskDone"][data-id="${id}"]`); await p.waitForTimeout(40); } }
    await tab('net'); await p.click('#verifyNet');
    await settle('clear');
    log('day', day, 'label:', label, '→ cleared');
    await p.screenshot({ path: path.join(OUT, 'ch2-day' + day + '.png') });
    await toNext();
    if (day < 11) await settle('incident'); else await settle('end');
  }
  log('errors:', errors.length ? errors : 'none');
  await b.close();
  if (errors.length) process.exit(1);
})().catch(e => { console.error('[ch2] FAIL', e); process.exit(1); });
