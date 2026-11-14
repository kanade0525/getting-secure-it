const { chromium } = require('playwright');
const path = require('path');
const DIR = process.argv[2];
const OUT = process.argv[3];
const URL = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(DIR, 'index.html');
const log = (...a) => console.log('[smoke]', ...a);
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png'), fullPage: false });
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('gsi-demo-v2') || 'null'));
  const winUp = () => page.locator('#win').isVisible();
  // 会話ウィンドウは中のコピー欄に当たらないよう、左上（顔の位置）を押して進める
  const winNext = () => page.click('#win', { position: { x: 24, y: 16 } });
  const dismiss = async () => { for (let i = 0; i < 40; i++) { if (!(await winUp())) return; await winNext(); await page.waitForTimeout(30); } throw new Error('dialogue never ended'); };
  const clearWin = async () => { for (let i = 0; i < 60; i++) { if (!(await winUp())) return; await winNext(); await page.waitForTimeout(80); } };
  // シロが話している間は背景を操作できない（プレイヤーと同じく、会話を読み終えてから操作する）
  const click = async (sel, o) => { await clearWin(); await page.click(sel, o); };
  const fill = async (sel, v) => { await clearWin(); await page.fill(sel, v); };
  const select = async (sel, v) => { await clearWin(); await page.selectOption(sel, v); };
  const check = async sel => { await clearWin(); await page.check(sel); };
  const uncheck = async sel => { await clearWin(); await page.uncheck(sel); };
  const tab = async t => { await click(`.tabs button[data-tab="${t}"]`); await page.waitForTimeout(50); };
  const svc = async (s, sub) => { await click(`#svc-${s}`); await page.waitForTimeout(30); if (sub) { await click(`.sub[data-sub="${sub}"]`); await page.waitForTimeout(30); } };
  const header = async () => (await page.locator('#chapLabel').innerText()) + ' / ' + (await page.locator('#dayLabel').innerText());
  const waitPhase = async (p) => { for (let i = 0; i < 100; i++) { const s = await state(); if (s && s.phase === p) return; await page.waitForTimeout(100); } throw new Error('phase not reached: ' + p + ' (now ' + (await state()).phase + ')'); };
  // フェーズに達するまで会話を消しつつ待つ（会話中はログが止まる挙動に対応）
  const settle = async ph => { for (let i = 0; i < 160; i++) { const s = await state(); if (s && s.phase === ph) return; if (await winUp()) await winNext(); await page.waitForTimeout(100); } throw new Error('phase ' + ph + ' not reached; now ' + (await state()).phase); };
  const toNext = async () => { for (let i = 0; i < 60; i++) { if (await page.locator('#sheet [data-act="nextDay"]').isVisible()) { await page.click('#sheet [data-act="nextDay"]'); return; } if (await winUp()) await winNext(); await page.waitForTimeout(100); } throw new Error('learn nextDay not shown'); };

  // 朝の流れ：お知らせが届く → シロの案内どおり「お知らせ」を開く →「通信」で再生 → 対策フェーズ
  const morning = async () => {
    for (let i = 0; i < 160; i++) { const s = await state(); if (s && s.phase === 'incident' && s.step === 'read') break; if (await winUp()) await winNext(); await page.waitForTimeout(100); }
    if ((await state()).step !== 'read') throw new Error('お知らせが届かない');
    await tab('voice');
    if ((await state()).step !== 'net') throw new Error('お知らせを開いても、通信へ進まない');
    await tab('net'); await settle('fix');
  };

  await shot('00-title');
  await page.click('.menu button[data-t="new"]');
  await dismiss();
  log('setup header:', await header());
  // day0: domain
  await tab('console'); await svc('registrar');
  await fill('#domName', 'pixeldo'); await select('#domTld', '.shop'); await page.waitForTimeout(50); await click('#domSearch'); await page.waitForTimeout(50);
  await click('#domBuy'); await dismiss();
  await select('#nrType', 'A'); await fill('#nrName', '@'); await fill('#nrVal', '198.51.100.7'); await click('[data-act="dnsAdd"]');
  await click('[data-act="dnsDel"][data-i="0"]'); await page.waitForTimeout(30); log('dns after delete:', (await state()).dns.length);
  await select('#nrType', 'A'); await fill('#nrName', '@'); await fill('#nrVal', '203.0.113.24'); await click('[data-act="dnsAdd"]');
  await shot('01-registrar');
  await svc('cloud'); await shot('02-cloud-server');
  await click('[data-act="publish"]'); await page.waitForTimeout(500); await dismiss();
  await waitPhase('incident');
  log('day1 header:', await header());
  // お知らせを読む前に「通信」を開いても、再生は始まらない（シロが「先にお知らせ」と言う）
  for (let i = 0; i < 160; i++) { const s = await state(); if (s.step === 'read') break; if (await winUp()) await winNext(); await page.waitForTimeout(100); }
  await tab('net'); await page.waitForTimeout(200);
  log('net before reading:', (await page.locator('#winText').innerText()).slice(0, 12), '/ phase', (await state()).phase);
  if ((await state()).phase !== 'incident') throw new Error('お知らせを読む前に再生が始まった');
  await morning();
  log('day1 attacker label:', await page.locator('#netLog .lh.atk').innerText(), '/ button:', await page.locator('#verifyBtn').innerText());
  await shot('03-net-day1');
  // day1 fix
  await tab('console'); await svc('cloud'); await shot('04-console-cloud-cert');
  log('subs:', await page.locator('.subs').innerText());
  await click('[data-act="keygen"]'); await dismiss();
  await click('[data-act="ca"][data-ca="free"]'); await dismiss();
  log('opened CA tab after CSR download:', (await state()).svc);
  if (!/^(?!.*良えWS).*$/s.test(await page.locator('#p-console .viewport').innerText())) throw new Error('認証局の画面に良えWSの名前が出ている');
  await click('[data-act="apply"]'); await dismiss();
  const token = (await state()).cfg.token; log('token', token);
  await svc('registrar');
  await select('#nrType', 'TXT'); await fill('#nrName', '_acme-challenge'); await fill('#nrVal', token); await click('[data-act="dnsAdd"]');
  await svc('ca'); await click('[data-act="dcv"]'); await page.waitForTimeout(500); await dismiss();
  if (/良えWS/.test(await page.locator('#p-console .viewport').innerText())) throw new Error('認証局の画面に良えWSの名前が出ている');
  await svc('cloud', 'cert'); await page.waitForTimeout(50);
  await check('input[name="inst"][value="fullchain"]'); await click('[data-act="install"]'); await dismiss();
  await click('[data-act="sub"][data-sub="net"]'); await page.waitForTimeout(30);
  await click('#https'); await click('#redirect'); await shot('05-cloud-net');
  await click('#verifyBtn'); await settle('clear'); await clearWin(); await shot('06-learn-day1');
  await toNext(); await settle('incident');
  log('day2 header:', await header());
  await morning();
  log('day2 attacker label:', await page.locator('#netLog .lh.atk').innerText());
  await shot('07-net-day2');
  await tab('console'); await svc('cloud', 'net');
  await select('#tlsMin', '1.2'); await uncheck('#ci-rc4'); await uncheck('#ci-des3');
  await click('#verifyBtn'); await settle('clear');
  await toNext(); await settle('incident');
  log('day3 header:', await header());
  await morning();
  log('day3 attacker label:', await page.locator('#netLog .lh.atk').innerText());
  // trap: hsts 5分（わざと失敗させる）
  await tab('console'); await svc('cloud', 'net'); await click('#hsts');
  await click('#verifyBtn'); await page.waitForTimeout(1500); await clearWin();
  log('trap voices:', (await state()).voices.length);
  // 正しい設定にして、空いたら「確かめる」を押す
  await tab('console'); await select('#hstsAge', '31536000');
  for (let i = 0; i < 60; i++) { const s = await state(); if (s.phase === 'clear') break; if (await winUp()) { await winNext(); } else { const vb = page.locator('#verifyBtn'); if (await vb.isVisible()) await vb.click(); } await page.waitForTimeout(150); }
  await settle('clear'); await shot('08-day3-clear');
  // 3日目クリア後は、4日目へ進むことだけ確かめる（4日目以降は smoke-net・smoke-site・smoke-infra で確かめる）
  await toNext(); await settle('incident');
  log('after day3 → day', (await state()).day);
  log('errors:', errors.length ? errors : 'none');
  await browser.close();
  if (errors.length) process.exit(1);
})().catch(e => { console.error('[smoke] FAIL', e); process.exit(1); });
