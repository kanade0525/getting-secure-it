// 日を選ぶ・デバッグの確認：
//   ・一般のプレイヤーは、クリアした日と、その次の日だけ選べる（選んだ日の朝の設定になる）
//   ・デバッグ（#debug／タイトルの「全4章…」を5回押す）は、どの日でも選べて、対策の場面から始められる
//   ・16〜17日目（防壁編のインフラ側の2日）を、画面の操作だけで朝からクリアまで通す
//   node test/smoke-days.cjs <index.html のあるフォルダ または URL> <スクショの出力先>
const { chromium } = require('playwright'); const path = require('path');
const DIR = process.argv[2], OUT = process.argv[3];
const URL = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(DIR, 'index.html');
const SAFE = { ca: 'free', keyMade: true, token: 'ABCD-EFGH', issued: true, installed: 'fullchain', autoRenew: false, cert: true, https: true, redirect: true, tlsMin: '1.2', ciph: { aes: true, chacha: true, des3: false, rc4: false }, hsts: true, hstsAge: '31536000', code: { search: 'param', hash: 'bcrypt' }, tasks: {} };
const save6 = { rev: 2, day: 6, phase: 'fix', tab: 'console', voices: [{ who: 'たなか', t: 'a', day: 2, unread: false }, { who: '監視', sys: true, t: 'b', day: 6, unread: false }], badge: {}, cart: 0, chatLog: [], last: null, domain: 'neko.shop', ds: null, whois: true, dnsOk: true, dns: [{ type: 'A', name: '@', value: '203.0.113.24' }], svc: 'hub', sub: 'server', cfg: SAFE };
const fails = []; const ok = (what, cond) => { console.log(cond ? 'ok  ' : 'NG  ', what); if (!cond) fails.push(what); };
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const errs = [];
  const open = async (hash, st, w, h) => { const p = await b.newPage({ viewport: { width: w || 390, height: h || 844 }, reducedMotion: 'reduce', deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(String(e))); await p.goto(URL); await p.evaluate(x => { localStorage.clear(); if (x) localStorage.setItem('gsi-demo-v2', x); }, st ? JSON.stringify(st) : null); await p.goto(URL + (hash || '')); await p.reload(); return p; };
  const state = p => p.evaluate(() => JSON.parse(localStorage.getItem('gsi-demo-v2') || 'null'));
  const clear = async p => { for (let i = 0; i < 60; i++) { if (!(await p.locator('#win').isVisible())) return; await p.click('#win', { position: { x: 24, y: 16 } }); await p.waitForTimeout(40); } };
  const rows = p => p.evaluate(() => [...document.querySelectorAll('.dayrow')].map(r => ({ d: +r.dataset.day, dis: r.disabled, t: r.querySelector('.dn').textContent, s: r.querySelector('.ds').textContent || (r.querySelector('.ds svg') ? 'lock' : '') })));

  // 1) 記録なし：日を選ぶ は出ない
  let p = await open('', null);
  ok('記録なし：タイトルに「日を選ぶ」が出ない', await p.locator('.menu [data-t="days"]').count() === 0);
  await p.close();

  // 2) 6日目の途中の記録：クリアした日（0〜5）と、いまの日（6）だけ選べる
  p = await open('', save6);
  ok('記録あり：タイトルに「日を選ぶ」が出る', await p.locator('.menu [data-t="days"]').count() === 1);
  await p.screenshot({ path: OUT + '/title-390.png' });
  await p.click('.menu [data-t="days"]');
  let r = await rows(p);
  ok('一般：0〜5日目はクリア、6日目はいまここ、7日目から先は選べない', r.length === 25 && r.slice(0, 6).every(x => !x.dis && x.s === 'クリア') && !r[6].dis && r[6].s === 'いまここ' && r.slice(7).every(x => x.dis && x.s === 'lock' && /^\d+日目$/.test(x.t)));
  await p.screenshot({ path: OUT + '/days-normal.png' });
  await p.click('.dayrow[data-day="3"]'); await clear(p);
  let s = await state(p);
  ok('3日目へ：日付と設定が3日目の朝になる（HTTPSあり・HSTSなし・コードの対策なし）', s.day === 3 && s.phase === 'incident' && s.cfg.https && !s.cfg.hsts && !Object.keys(s.cfg.code).length && s.cfg.token === 'ABCD-EFGH' && s.domain === 'neko.shop' && s.cleared === 5);
  ok('3日目へ：あとの日のお知らせは消え、前の日のものは残る', s.voices.every(v => v.day <= 3) && s.voices.some(v => v.day === 2));
  await p.click('.daybtn');
  r = await rows(p);
  ok('画面上部の日付から開ける。3日目がいまここ、6日目はつづき', !r[3].dis && r[3].s === 'いまここ' && !r[6].dis && r[6].s === 'つづき' && r[7].dis);
  await p.click('.dayrow[data-day="6"]'); await clear(p);
  s = await state(p);
  ok('6日目へ戻る：前の日までの対策が入り、6日目の対策は入っていない', s.day === 6 && s.cfg.hsts && s.cfg.code.search === 'param' && s.cfg.code.hash === 'bcrypt' && !s.cfg.code.price);
  await p.close();

  // 3) デバッグ（#debug）：記録なしでも、どの日でも選べる。対策の場面から始められる
  p = await open('#debug', null);
  ok('デバッグ：タイトルに「日を選ぶ」と「デバッグ中」が出る', await p.locator('.menu [data-t="days"]').count() === 1 && /デバッグ中/.test(await p.locator('.tver').textContent()));
  await p.click('.menu [data-t="days"]');
  r = await rows(p);
  ok('デバッグ：全25日が選べる', r.length === 25 && r.every(x => !x.dis));
  await p.screenshot({ path: OUT + '/days-debug.png' });
  await p.check('#dbgFix'); await p.click('.dayrow[data-day="17"]'); await p.waitForTimeout(100);
  s = await state(p);
  ok('デバッグ：17日目の対策の場面から始まる（会話なし・16日目までの対策あり）', s.day === 17 && s.phase === 'fix' && s.cfg.code.bots === 'challenge' && !s.cfg.code.firewall && !(await p.locator('#win').isVisible()) && s.domain === 'pixeldo.shop');
  // 16日目の朝から、画面の操作だけで17日目のクリアまで通す
  await p.click('.daybtn'); await p.uncheck('#dbgFix'); await p.click('.dayrow[data-day="16"]');
  for (const day of [16, 17]) {
    await clear(p); await p.click('.tabs button[data-tab="net"]');
    for (let i = 0; i < 80; i++) { await clear(p); if ((await state(p)).phase === 'fix') break; await p.waitForTimeout(100); }
    await clear(p);
    ok(day + '日目：攻撃を見て、対策の場面になる', (await state(p)).phase === 'fix' && (await state(p)).day === day);
    await p.click('.tabs button[data-tab="console"]'); await clear(p);
    await p.click(day === 16 ? '[data-act="scrapeRun"]' : '[data-act="fwTry"]'); await clear(p);
    if (day === 16) await p.screenshot({ path: OUT + '/d16-flow.png' });
    await p.click('#svc-hub'); await p.click('[data-act="applyFix"]'); await clear(p);
    await p.click('#verifyBtn');
    for (let i = 0; i < 80; i++) { await clear(p); if (await p.locator('#modal').isVisible()) break; await p.waitForTimeout(100); }
    s = await state(p);
    ok(day + '日目：対策を入れて確かめると、クリアになる', s.phase === 'clear' && s.cleared === day);
    if (day === 17) await p.screenshot({ path: OUT + '/d17-learn.png' });
    await p.click('[data-act="nextDay"]');
  }
  await clear(p); s = await state(p);
  ok('17日目のあとは、18日目（切れていた鍵）へ進む', s.day === 18 && (await p.locator('#dayLabel').textContent()).includes('切れていた鍵'));
  await p.close();

  // 4) タイトルの「全4章…」を5回押すと、デバッグの入・切
  p = await open('', save6);
  for (let i = 0; i < 5; i++) await p.click('.tver');
  ok('5回押すとデバッグ中になる', /デバッグ中/.test(await p.locator('.tver').textContent()));
  for (let i = 0; i < 5; i++) await p.click('.tver');
  ok('もう5回押すと戻る', !/デバッグ中/.test(await p.locator('.tver').textContent()));
  await p.close();

  // 5) PC幅のタイトル
  p = await open('', save6, 1280, 800); await p.screenshot({ path: OUT + '/title-1280.png' });
  ok('PC幅のタイトルが横にはみ出さない', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await p.close();
  p = await open('', save6, 320, 568); await p.screenshot({ path: OUT + '/title-320.png' });
  ok('320px幅のタイトルが横にはみ出さない', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await p.close();

  console.log('page errors:', errs.length ? errs : 'none'); console.log(fails.length ? 'FAIL ' + fails.length : 'ALL PASS');
  await b.close(); if (fails.length || errs.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
