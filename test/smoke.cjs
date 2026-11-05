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
  const dismiss = async () => { for (let i = 0; i < 40; i++) { const v = await page.locator('#win').isVisible(); if (!v) return; await page.click('#win'); await page.waitForTimeout(30); } throw new Error('dialogue never ended'); };
  const tab = async t => { await page.click(`.tabs button[data-tab="${t}"]`); await page.waitForTimeout(50); };
  const svc = async (s, sub) => { await page.click(`#svc-${s}`); await page.waitForTimeout(30); if (sub) { await page.click(`.sub[data-sub="${sub}"]`); await page.waitForTimeout(30); } };
  const header = async () => (await page.locator('#chapLabel').innerText()) + ' / ' + (await page.locator('#dayLabel').innerText());
  const waitPhase = async (p) => { for (let i = 0; i < 100; i++) { const s = await state(); if (s && s.phase === p) return; await page.waitForTimeout(100); } throw new Error('phase not reached: ' + p + ' (now ' + (await state()).phase + ')'); };
  const winUp = () => page.locator('#win').isVisible();
  // フェーズに達するまで会話を消しつつ待つ（会話中はログが止まる挙動に対応）
  const settle = async ph => { for (let i = 0; i < 160; i++) { const s = await state(); if (s && s.phase === ph) return; if (await winUp()) await page.click('#win'); await page.waitForTimeout(100); } throw new Error('phase ' + ph + ' not reached; now ' + (await state()).phase); };
  const toNext = async () => { for (let i = 0; i < 60; i++) { if (await page.locator('#sheet [data-act="nextDay"]').isVisible()) { await page.click('#sheet [data-act="nextDay"]'); return; } if (await winUp()) await page.click('#win'); await page.waitForTimeout(100); } throw new Error('learn nextDay not shown'); };
  const clearWin = async () => { for (let i = 0; i < 60; i++) { if (!(await winUp())) return; await page.click('#win'); await page.waitForTimeout(80); } };

  await shot('00-title');
  await page.click('.menu button[data-t="new"]');
  await dismiss();
  log('setup header:', await header());
  // day0: domain
  await tab('console'); await svc('registrar');
  await page.fill('#domName', 'pixeldo'); await page.selectOption('#domTld', '.shop'); await page.waitForTimeout(50); await page.click('#domSearch'); await page.waitForTimeout(50);
  await page.click('#domBuy'); await dismiss();
  await page.selectOption('#nrType', 'A'); await page.fill('#nrName', '@'); await page.fill('#nrVal', '198.51.100.7'); await page.click('[data-act="dnsAdd"]');
  await page.click('[data-act="dnsDel"][data-i="0"]'); await page.waitForTimeout(30); log('dns after delete:', (await state()).dns.length);
  await page.selectOption('#nrType', 'A'); await page.fill('#nrName', '@'); await page.fill('#nrVal', '203.0.113.24'); await page.click('[data-act="dnsAdd"]');
  await shot('01-registrar');
  await svc('cloud'); await shot('02-cloud-server');
  await page.click('[data-act="publish"]'); await page.waitForTimeout(500); await dismiss();
  await waitPhase('incident');
  log('day1 header:', await header());
  await page.waitForTimeout(400); await dismiss();
  await tab('net'); await settle('fix');
  log('day1 attacker label:', await page.locator('.loghead span').innerText(), '/ button:', await page.locator('#verifyNet').innerText());
  await shot('03-net-day1');
  // day1 fix
  await tab('console'); await svc('cloud'); await shot('04-console-cloud-cert');
  log('subs:', await page.locator('.subs').innerText());
  await page.click('[data-act="ca"][data-ca="free"]'); await dismiss();
  await page.click('[data-act="keygen"]'); await dismiss();
  await page.click('[data-act="svc"][data-s="ca"]'); await page.click('[data-act="apply"]'); await dismiss();
  const token = (await state()).cfg.token; log('token', token);
  await svc('registrar');
  await page.selectOption('#nrType', 'TXT'); await page.fill('#nrName', '_acme-challenge'); await page.fill('#nrVal', token); await page.click('[data-act="dnsAdd"]');
  await svc('ca'); await page.click('[data-act="dcv"]'); await page.waitForTimeout(500); await dismiss();
  await page.click('[data-act="svc"][data-s="cloud"][data-sub="cert"]'); await page.waitForTimeout(50);
  log('cloud sub after CA link:', (await state()).sub);
  await page.check('input[name="inst"][value="fullchain"]'); await page.click('[data-act="install"]'); await dismiss();
  await page.click('[data-act="sub"][data-sub="net"]'); await page.waitForTimeout(30);
  await page.click('#https'); await page.click('#redirect'); await shot('05-cloud-net');
  await page.click('#verifyBtn'); await settle('clear'); await clearWin(); await shot('06-learn-day1');
  await toNext(); await settle('incident');
  log('day2 header:', await header());
  await tab('net'); await settle('fix');
  log('day2 attacker label:', await page.locator('.loghead span').innerText());
  await shot('07-net-day2');
  await tab('console'); await svc('cloud', 'net');
  await page.selectOption('#tlsMin', '1.2'); await page.uncheck('#ci-rc4'); await page.uncheck('#ci-des3');
  await page.click('#verifyBtn'); await settle('clear');
  await toNext(); await settle('incident');
  log('day3 header:', await header());
  await tab('net'); await settle('fix');
  log('day3 attacker label:', await page.locator('.loghead span').innerText());
  // trap: hsts 5分（わざと失敗させる）
  await tab('console'); await svc('cloud', 'net'); await page.click('#hsts');
  await page.click('#verifyBtn'); await page.waitForTimeout(1500); await clearWin();
  log('trap voices:', (await state()).voices.length);
  // 正しい設定にして、空いたら「確かめる」を押す
  await tab('console'); await page.selectOption('#hstsAge', '31536000');
  for (let i = 0; i < 60; i++) { const s = await state(); if (s.phase === 'clear') break; if (await winUp()) { await page.click('#win'); } else { const vb = page.locator('#verifyBtn'); if (await vb.isVisible()) await vb.click(); } await page.waitForTimeout(150); }
  await settle('clear'); await shot('08-day3-clear');
  // デモは11日目まで続く。3日目クリア後は4日目へ進むことだけ確認（4日目以降は smoke-ch2 で検証）
  await toNext(); await settle('incident');
  log('after day3 → day', (await state()).day);
  log('errors:', errors.length ? errors : 'none');
  await browser.close();
  if (errors.length) process.exit(1);
})().catch(e => { console.error('[smoke] FAIL', e); process.exit(1); });
