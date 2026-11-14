// 日を選ぶ・デバッグの確認：
//   ・一般のプレイヤーは、クリアした日と、その次の日だけ選べる（選んだ日の朝の設定になる）
//   ・デバッグ（#debug／タイトルの「全4章…」を5回押す）は、どの日でも選べて、対策の場面から始められる
//   ・どの日も「その日の朝の設定」では防げず、「次の日の朝の設定」では防げる（日を選んだ先で、ちゃんと遊べる）
//   ・古い保存データ（12日目以降の対策がコードだった版）は、その日の朝からやり直しになる
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
  const rows = p => p.evaluate(() => [...document.querySelectorAll('.dayrow[data-day]')].map(r => ({ d: +r.dataset.day, dis: r.disabled, t: r.querySelector('.dn').textContent, s: r.querySelector('.ds').textContent || (r.querySelector('.ds svg') ? 'lock' : '') })));

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
  ok('デバッグ：一覧の最後に「エンディングとエンドロール」がある', await p.locator('.dayrow[data-act="ending"]').count() === 1);
  await p.screenshot({ path: OUT + '/days-debug.png' });
  await p.check('#dbgFix'); await p.click('.dayrow[data-day="17"]'); await p.waitForTimeout(100);
  s = await state(p);
  ok('デバッグ：17日目の対策の場面から始まる（会話なし・16日目までの対策あり）', s.day === 17 && s.phase === 'fix' && s.cfg.inf.bot === 'challenge' && s.cfg.inf.wafRate === '2000' && s.cfg.inf.fwSsh === 'any' && s.dns.some(x => x.type === 'ALIAS' && x.value === 'pixeldo-edge.pixelcdn.example') && !s.dns.some(x => x.type === 'A' && x.name === '@') && !(await p.locator('#win').isVisible()) && s.domain === 'pixeldo.shop');
  // どの日も、その日の朝の設定では防げず、次の日の朝の設定では防げる
  const plan = await p.evaluate(() => { const G = window.GSI_DEBUG, D = window.GSI_DAYS.days, out = [];
    const cfg = n => Object.assign(G.cfgForDay(n), { dnsTo: G.dnsForDay(n).type === 'ALIAS' ? 'edge' : 'server' });
    for (let n = 1; n <= G.lastDay; n++) { const a = D[n].check(cfg(n)), b = D[n].check(cfg(n + 1)); if (a.ok || !b.ok || !a.why || !b.lines.length) out.push(n + ':' + a.ok + '/' + b.ok); }
    return out; });
  ok('全24日：朝の設定では防げず、正解を入れると防げる' + (plan.length ? '（' + plan.join(' ') + '）' : ''), plan.length === 0);
  await p.close();

  // 3b) 一般のプレイヤー：全部クリアするまで、一覧に「エンディング」は出ない
  p = await open('', save6); await p.click('.menu [data-t="days"]');
  ok('一般：クリア前は「エンディング」が一覧に出ない', await p.locator('.dayrow[data-act="ending"]').count() === 0);
  await p.close();

  // 3c) 古い保存データ（版2：12日目以降の対策を、ピクセルハブのコードで入れていた）
  const old14 = Object.assign({}, save6, { day: 14, phase: 'fix', step: undefined, cfg: Object.assign({}, SAFE, { code: { search: 'param', signup: 'verify', login: 'throttle', dos: 'shield' } }), voices: [{ who: '監視', sys: true, t: 'x', day: 13, unread: false }, { who: '監視', sys: true, t: 'y', day: 14, unread: false }] });
  p = await open('', old14); s = await state(p);
  ok('古い記録（14日目の途中）：14日目の朝からやり直しになる', s.rev === 3 && s.day === 14 && s.phase === 'incident' && !s.step && s.voices.every(v => v.day < 14));
  ok('古い記録：13日目までの対策は、新しい設定の形で入っている', s.cfg.inf.edge && s.cfg.inf.wafSignup === 'captcha' && s.cfg.inf.wafLogin === '100' && s.cfg.inf.wafRate === '0' && !s.cfg.code.dos && !s.cfg.code.signup && s.cfg.code.search === 'param' && s.dns.some(x => x.type === 'ALIAS' && x.value === 'pixeldo-edge.pixelcdn.example') && !s.dns.some(x => x.type === 'A' && x.value === '203.0.113.24') && s.trapsFrom === 14);
  await p.click('.menu button[data-t="cont"]'); await p.waitForTimeout(100);
  ok('古い記録：つづきからで、14日目の朝の会話が始まる', (await p.locator('#win').isVisible()) && /落ちてる/.test(await p.locator('#winText').innerText()));
  await p.close();
  // 入口をIPアドレスで向けていた版（版3の最初）の記録は、名前（ALIAS）に直る
  const ipEdge = Object.assign({}, save6, { rev: 3, day: 15, phase: 'fix', traps: [], dns: [{ type: 'A', name: '@', value: '198.51.100.10' }, { type: 'TXT', name: '_acme-challenge', value: 'ABCD-EFGH' }], cfg: Object.assign({}, SAFE, { inf: { edge: true, wafSignup: 'captcha' } }) });
  p = await open('', ipEdge); s = await state(p); await p.click('.menu button[data-t="cont"]'); await clear(p); await p.click('.tabs button[data-tab="console"]'); await p.click('#svc-cloud'); await p.click('.sub[data-sub="edge"]');
  ok('入口をIPアドレスで向けていた記録：ALIAS に直り、入口を通っている扱いになる', /入口を通っています/.test(await p.locator('#p-console .viewport').innerText()) && (await state(p)).dns.some(x => x.type === 'ALIAS' && x.value === 'pixeldo-edge.pixelcdn.example'));
  await p.close();
  const oldEnd = Object.assign({}, save6, { day: 24, phase: 'end', cfg: Object.assign({}, SAFE, { autoRenew: true, code: { search: 'param', egress: 'monitor', registrar: 'lock' } }) });
  p = await open('', oldEnd); s = await state(p);
  ok('古い記録（全部クリア）：クリアのまま、全部の対策が入った設定になる', s.phase === 'end' && s.cleared === 24 && s.cfg.inf.alarmOut && s.cfg.inf.regLock && s.cfg.code.apikey === 'server' && !s.cfg.code.egress && s.trapsFrom === 25);
  // トラップを数える前の記録：エンドロールは「ひとつもなし／おみごと」ではなく「記録なし」
  await p.click('.menu button[data-t="cont"]'); await p.click('#sheet [data-act="ending"]'); await p.waitForTimeout(150);
  const talk = []; for (let i = 0; i < 40 && !(await p.locator('#roll').isVisible()); i++) { talk.push(await p.locator('#winText').innerText()); await p.click('#win', { position: { x: 24, y: 16 } }); await p.waitForTimeout(50); }
  const rollText = await p.locator('#roll').innerText();
  ok('古い記録（全部クリア）：エンドロールのトラップは「記録なし」。シロも「まちがえなかった」とは言わない', /記録なし/.test(rollText) && !/おみごと/.test(rollText) && !talk.some(t => /たいしたものだよ|まちがえた設定も/.test(t)));
  await p.click('#roll [data-act="rollTitle"]'); await p.waitForTimeout(100);
  await p.click('.menu [data-t="days"]');
  ok('全部クリアしたあとは、一般でも「エンディング」を選べる', await p.locator('.dayrow[data-act="ending"]').count() === 1);
  await p.close();

  // 3d) 「はじめから → はい」：前の記録が、状態にも画面にも残らない（まっさらな新規と同じになる）
  const endSave = Object.assign({}, save6, { rev: 3, day: 24, phase: 'end', cleared: 24, cart: 2, shopQ: 'ロボット', traps: [{ day: 2, t: 'TLS 1.3 だけにした' }], trapsFrom: 0, chatLog: [{ who: 'シロ', t: 'まえのきろく' }], badge: { voice: true, net: true }, last: { ok: true, https: true, lines: [{ k: 'ok', t: 'まえのきろく' }] }, domain: 'maeno-kiroku.shop',
    voices: [{ who: 'たなか', t: 'まえのきろく', day: 3, unread: true }], dns: [{ type: 'ALIAS', name: '@', value: 'pixeldo-edge.pixelcdn.example' }, { type: 'TXT', name: '_acme-challenge', value: 'ABCD-EFGH' }], svc: 'cloud', sub: 'waf', cfg: Object.assign({}, SAFE, { autoRenew: true, inf: { edge: true, wafSignup: 'captcha', wafLogin: '100', regLock: true } }) });
  const begin = async st => {
    const q = await open('', st); await q.click('.menu button[data-t="new"]'); if (st) await q.click('.menu button[data-t="yes"]'); await q.waitForTimeout(150); await clear(q);
    const texts = []; for (const t of ['shop', 'voice', 'net', 'console']) { await q.click(`.tabs button[data-tab="${t}"]`); await q.waitForTimeout(50); texts.push((await q.locator('body').innerText()).replace(/\s+/g, ' ')); }
    await q.click('#logBtn'); texts.push((await q.locator('#sheet').innerText()).replace(/\s+/g, ' ')); await q.click('#sheet [data-act="close"]');
    await q.click('.daybtn'); texts.push((await q.locator('#sheet').innerText()).replace(/\s+/g, ' ')); await q.click('#sheet [data-act="close"]');
    const st2 = await state(q); await q.close(); return { texts: texts.join('\n'), state: JSON.stringify(st2, Object.keys(st2).sort()), raw: st2 };
  };
  const fresh0 = await begin(null), again = await begin(endSave);
  ok('はじめから：全部クリアした記録から始め直すと、保存内容が、まっさらな新規と同じになる', fresh0.state === again.state && again.raw.cleared === -1 && !again.raw.traps.length && !again.raw.voices.length && !again.raw.domain && !again.raw.dns.length && !again.raw.cfg.inf.edge);
  ok('はじめから：どのタブ・会話ログ・日の一覧にも、前の記録が出ない（画面の文字が、まっさらな新規と同じ）', fresh0.texts === again.texts && !/まえのきろく|maeno/.test(again.texts));

  // 3e) 同じサイトを2つのタブで開いているとき：片方で「はじめから」にしたら、もう片方の古い画面が、あとから記録を上書きしない
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const t1 = await ctx.newPage(), t2 = await ctx.newPage(); t1.on('pageerror', e => errs.push(String(e))); t2.on('pageerror', e => errs.push(String(e)));
    await t1.goto(URL); await t1.evaluate(x => localStorage.setItem('gsi-demo-v2', x), JSON.stringify(Object.assign({}, save6, { rev: 3, traps: [] }))); await t1.goto(URL); await t1.click('.menu button[data-t="cont"]'); await clear(t1);   // タブ1：6日目の途中
    await t2.goto(URL); await t2.click('.menu button[data-t="new"]'); await t2.click('.menu button[data-t="yes"]'); await t2.waitForTimeout(150); await clear(t2);                     // タブ2：はじめから
    await t1.click('.tabs button[data-tab="console"]'); await t1.waitForTimeout(80);   // タブ1（古い画面）を操作する：以前はここで、6日目の記録が書き戻っていた
    s = await state(t2);
    ok('2つのタブ：古いほうのタブを操作しても、記録は「はじめから」のまま', s.day === 0 && s.cleared === -1 && !s.domain);
    await t1.evaluate(() => window.dispatchEvent(new Event('focus'))); await t1.waitForTimeout(400);   // タブ1に戻ってきた
    ok('2つのタブ：古いほうのタブは、戻ってきたときに読み込み直して、新しい記録になる', (await t1.locator('#title').isVisible()) && /0日目/.test(await t1.locator('#title').innerText()) && !/6日目|neko/.test(await t1.locator('#title').innerText()));
    await ctx.close(); }

  // 3f) 壊れた記録（ない日を指している）でも、起動で止まらず、タイトルが出る
  p = await open('', Object.assign({}, save6, { rev: 3, day: 99, phase: 'fix' }));
  ok('壊れた記録：タイトルが出て、「はじめから」を選べる', (await p.locator('#title').isVisible()) && (await p.locator('.menu button[data-t="new"]').count()) === 1);
  await p.click('.menu button[data-t="new"]'); await p.click('.menu button[data-t="yes"]'); await p.waitForTimeout(150); s = await state(p);
  ok('壊れた記録：「はじめから」で、まっさらになる', s.day === 0 && s.phase === 'intro' && s.cleared === -1);
  await p.close();

  // 3g) 「日を選ぶ → 0日目」は、もう一度遊ぶための移動：クリアの印・会話ログ・引っかかったトラップは残る（説明にも書いてある）
  p = await open('', endSave); await p.click('.menu [data-t="days"]');
  ok('日を選ぶ：説明に「クリアの印と会話ログは残る／すべて消すにはタイトルのはじめから」とある', /クリアの印と会話ログは残ります/.test(await p.locator('#sheet').innerText()) && /タイトルの「はじめから」/.test(await p.locator('#sheet').innerText()));
  await p.click('.dayrow[data-day="0"]'); await p.waitForTimeout(150); await clear(p); s = await state(p);
  ok('日を選ぶ → 0日目：0日目から遊び直せて、クリアの印・会話ログ・トラップは残り、ドメインや設定は最初に戻る', s.day === 0 && s.cleared === 24 && s.traps.length === 1 && s.chatLog.some(m => m.t === 'まえのきろく') && !s.domain && !s.dns.length && !s.cfg.https && !s.voices.length);
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
