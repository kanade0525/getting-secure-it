// 12〜24日目とエンディングの通し確認：朝の会話 →「お知らせ」→「通信」→ 管理画面で設定 →「防げたか確かめる」→ クリア、を画面の操作だけで進める。
// 確かめること：
//   ・シロの案内どおり「お知らせ」を読んでからでないと、「通信」で再生が始まらない
//   ・対策は、それがある場所で入れる（ピクセルクラウドの入口・WAF・ファイアウォールなど／ネームヤ／ピクセルハブ）。案内の矢印が次の場所に立つ
//   ・まちがえた設定（ゆるすぎ・きつすぎ）ではクリアにならず、トラップとして記録される
//   ・24日目のあとにエンディングが流れ、エンドロール（攻撃者の役名・ゲスト出演・引っかかったトラップ）が出る
//   node test/smoke-infra.cjs <index.html のあるフォルダ または URL> <スクショの出力先> [開始日（既定12）]
const { chromium } = require('playwright');
const path = require('path');
const DIR = process.argv[2], OUT = process.argv[3], FROM = Number(process.argv[4] || 12);
const BASE = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(DIR, 'index.html');
const log = (...a) => console.log('[infra]', ...a);
const fails = [], errors = [];
const check = (what, ok) => { if (ok) return; fails.push(what); log('NG', what); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 664 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('gsi-demo-v2') || 'null'));
  const winUp = () => page.locator('#win').isVisible();
  const winNext = () => page.click('#win', { position: { x: 24, y: 16 } });
  const clearWin = async () => { for (let i = 0; i < 80; i++) { if (!(await winUp())) return; await winNext(); await page.waitForTimeout(40); } };
  const until = async (what, fn) => { for (let i = 0; i < 200; i++) { if (await fn(await state())) return true; if (await winUp()) await winNext(); await page.waitForTimeout(50); } check(what, false); return false; };
  const click = async sel => { await clearWin(); await page.click(sel); await page.waitForTimeout(40); };
  const tab = t => click(`.tabs button[data-tab="${t}"]`);
  const svc = s => click('#svc-' + s);
  const sub = s => click(`.sub[data-sub="${s}"]`);
  const set = async (k, v) => { await clearWin(); await page.selectOption('#inf-' + k, v); await page.waitForTimeout(40); };
  const sw = k => click('#inf-' + k);
  const shot = n => page.screenshot({ path: path.join(OUT, 'infra-' + n + '.png') });
  // 案内の矢印が立っている場所（ブラウザのタブ＝svc-◯◯／ピクセルクラウドの小メニュー＝sub-◯◯）
  const arrow = () => page.evaluate(() => { const g = document.querySelector('#p-console .guide'); if (!g) return ''; const b = g.closest('.btab'), s = g.closest('.sub'); return b ? b.id : s ? 'sub-' + s.dataset.sub : '?'; });
  const wide = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('main .panel:not([hidden]) .viewport')].some(e => e.scrollWidth > e.clientWidth + 1));
  const notes = () => page.evaluate(() => [...document.querySelectorAll('main .panel:not([hidden]) .hj-meta')].map(e => (e.className.replace('hj-meta', '').trim() || 'plain') + ':' + e.querySelector('.hj-meta-h').textContent));

  // 朝：会話 →（通信を先に開いても始まらない）→ お知らせ → 通信で再生 → 対策フェーズ
  const morning = async day => {
    await until(day + '日目：お知らせが届いて、シロが「まずお知らせ」と案内する', s => s.day === day && s.phase === 'incident' && s.step === 'read');
    const said = await page.evaluate(() => { const l = JSON.parse(localStorage.getItem('gsi-demo-v2')).chatLog; return l[l.length - 1].t; });
    check(day + '日目：シロが「お知らせ」タブへ案内する（' + said + '）', /まず「お知らせ」タブ/.test(said));
    await clearWin();
    check(day + '日目：お知らせタブに未読の数が出る', await page.locator('.tabs button[data-tab="voice"] .cnt').count() === 1);
    check(day + '日目：読む前は、通信タブに目印がない', await page.locator('.tabs button[data-tab="net"] .dot').count() === 0);
    await page.click('.tabs button[data-tab="net"]'); await page.waitForTimeout(80);
    check(day + '日目：お知らせを読む前に通信を開くと、シロが止める', (await winUp()) && /先に「お知らせ」/.test(await page.locator('#winText').innerText()));
    await clearWin();
    check(day + '日目：読む前は、再生が始まらない', (await state()).phase === 'incident' && (await page.locator('#netLog .lh.atk').count()) === 0);
    await tab('voice');
    const s = await state();
    check(day + '日目：お知らせを開くと、次は通信', s.step === 'net' && (await page.locator('#p-voice .hj-meta').count()) === 1 && (await page.locator('.tabs button[data-tab="net"] .dot').count()) === 1);
    check(day + '日目：その日のお知らせが届いている', s.voices.filter(v => v.day === day).length >= 2);
    if (day === 12) await shot('12-voice');
    await tab('net');
    await until(day + '日目：通信で再生したあと、対策フェーズになる', s => s.phase === 'fix');
    await clearWin();
    check(day + '日目：未対策の被害が出ている', (await page.locator('#netLog .ln.b.bad').count()) >= 1);
  };
  // 「防げたか確かめる」。ok＝クリアになるはず／trap＝クリアにならず、この名前のトラップが記録されるはず（null なら記録なし）
  const verify = async (day, ok, trap) => {
    await clearWin();
    const before = (await state()).traps.length;
    await page.click('#verifyBtn');
    if (ok) { await until(day + '日目：正しい設定でクリアになる', s => s.phase === 'clear'); return; }
    await until(day + '日目：確かめ終わる', async () => !(await page.locator('#verifyBtn').isDisabled()) && (await page.locator('#verifyBtn').innerText()) === '防げたか確かめる' && (await winUp()));
    await page.waitForTimeout(60);
    const lead = await page.locator('#winText').innerText();
    await clearWin(); await page.waitForTimeout(80); await clearWin();
    const s = await state();
    check(day + '日目：まちがえた設定ではクリアにならない（' + (trap || '記録なし') + '）', s.phase === 'fix');
    if (trap) check(day + '日目：トラップが記録される「' + trap + '」', s.traps.some(x => x.day === day && x.t === trap));
    else check(day + '日目：これはトラップに数えない', s.traps.length === before);
    return lead;
  };
  const next = async day => {
    for (let i = 0; i < 80; i++) { if (await page.locator('#sheet [data-act="nextDay"]').isVisible()) break; if (await winUp()) await winNext(); await page.waitForTimeout(50); }
    check(day + '日目：クリア後に解説が出る', await page.locator('#sheet [data-act="nextDay"]').isVisible());
    check(day + '日目：横にはみ出さない', !(await wide()));
    await page.click('#sheet [data-act="nextDay"]'); await page.waitForTimeout(60);
  };

  // デバッグで、開始日の朝へ
  await page.goto(BASE + '#debug');
  await page.click('.menu button[data-t="days"]');
  await page.click(`.dayrow[data-day="${FROM}"]`);
  const steps = {
    12: async () => {
      await tab('shop'); await click('[data-act="botRun"]'); check('12日目：未対策は、自動登録が通る', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      await tab('console');
      check('12日目：ピクセルハブに、今日のプルリクエストはない', await (async () => { await svc('hub'); const t = await page.locator('#p-console .viewport').innerText(); return /未対応のプルリクエストはありません/.test(t) && (await page.locator('[data-act="applyFix"]').count()) === 0; })());
      check('12日目：矢印はピクセルクラウドへ', (await arrow()) === 'svc-cloud');
      await svc('cloud');
      check('12日目：小メニューに「入口（CDN）」と「WAF」がある', /入口（CDN）/.test(await page.locator('.subs').innerText()) && /WAF/.test(await page.locator('.subs').innerText()));
      await sub('waf'); check('12日目：入口を作る前は、WAFを設定できない', (await page.locator('#inf-wafSignup').count()) === 0 && (await arrow()) === 'sub-edge');
      await sub('edge'); await shot('12-edge-before');
      await click('[data-act="edgeMake"]'); await clearWin();
      check('12日目：入口を作ったら、矢印はネームヤ（DNS）へ', (await arrow()) === 'svc-registrar');
      await verify(12, false, null);   // 入口を作っただけ：まだ誰も通らない
      await tab('console'); await click('[data-act="copyEdge"]'); await shot('12-edge-made');
      await svc('registrar');
      // ドメインそのもの（@）に CNAME は置けない。ALIAS で、入口の名前へ向ける
      await page.selectOption('#nrType', 'CNAME'); await page.fill('#nrName', '@'); await click('[data-act="paste"]');
      check('12日目：コピーした入口のアドレス（名前）を貼り付けられる', (await page.inputValue('#nrVal')) === 'pixeldo-edge.pixelcdn.example');
      await click('[data-act="dnsAdd"]');
      check('12日目：@ に CNAME を登録しようとすると、ALIAS を使うよう言われる', /CNAME を登録できません/.test(await page.locator('#p-console .viewport').innerText()) && !(await state()).dns.some(r => r.type === 'CNAME'));
      await page.selectOption('#nrType', 'ALIAS'); await page.fill('#nrName', '@'); await click('[data-act="paste"]');
      await click('[data-act="dnsAdd"]');
      check('12日目：ALIAS レコードが登録される', (await state()).dns.some(r => r.type === 'ALIAS' && r.name === '@' && r.value === 'pixeldo-edge.pixelcdn.example'));
      const i = (await state()).dns.findIndex(r => r.type === 'A' && r.value === '203.0.113.24');
      await shot('12-dns');
      await click(`[data-act="dnsDel"][data-i="${i}"]`);
      check('12日目：向き先を変え終えると、シロがWAFへ案内する', (await winUp()) && /入口を通るようになった/.test(await page.locator('#winText').innerText()));
      await clearWin();
      check('12日目：入口へ向けたレコードは、もう消せない', (await page.locator('[data-act="dnsDel"]').count()) === (await state()).dns.length - 1);
      check('12日目：矢印はピクセルクラウドへ戻る', (await arrow()) === 'svc-cloud');
      await svc('cloud'); check('12日目：矢印は小メニューの「WAF」', (await arrow()) === 'sub-waf');
      await sub('waf'); await shot('12-waf');
      await set('wafSignup', 'count'); await verify(12, false, 'WAFのルールを「数えるだけ」にした');
      await tab('console'); await set('wafSignup', 'block'); await verify(12, false, '会員登録をすべてブロックした');
      check('12日目：きつすぎると、お客さんの苦情が届く', (await state()).voices.some(v => v.day === 12 && /アクセスが拒否/.test(v.t)));
      await tab('shop'); check('12日目：すべてブロックだと、お店の登録フォームも403になる', /403 Forbidden/.test(await page.locator('#p-shop .viewport').innerText()));
      await tab('console'); await set('wafSignup', 'captcha');
      check('12日目：設定がそろうと矢印が消える', (await arrow()) === '');
      await tab('shop'); await click('[data-act="botRun"]'); check('12日目：対策後は、自動登録が0件', (await notes()).some(n => /^ok/.test(n)) && !(await notes()).some(n => /^danger/.test(n)));
      await verify(12, true);
    },
    13: async () => {
      await tab('console'); check('13日目：WAFの画面が開いていて、ログインの回数を選べる', (await page.locator('#inf-wafLogin').count()) === 1);
      await set('wafLogin', '10000'); await verify(13, false, 'ログインの制限を「5分で10,000回」にした');
      await tab('console'); await set('wafLogin', '10'); await verify(13, false, 'ログインの制限を「5分で10回」にした');
      check('13日目：きつすぎると、同じ接続元を共有する法人のお客さまから苦情が届く', (await state()).voices.some(v => v.day === 13 && v.who === '法人のお客さま'));
      await tab('console'); await set('wafLogin', '100');
      await tab('shop'); await click('[data-act="bruteTry"]'); check('13日目：対策後は、100回で止まる', /100回で止まった/.test(await page.locator('#p-shop').innerText()));
      await verify(13, true);
    },
    14: async () => {
      await tab('console'); await click('[data-act="dosFire"]'); check('14日目：未対策は、サーバーが落ちる', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      check('14日目：矢印は小メニューの「WAF」', (await arrow()) === 'sub-waf');
      await set('size', 'l'); await verify(14, false, 'サーバーを大きくして耐えようとした');
      await tab('console'); await set('size', 's'); await sub('waf'); await shot('14-waf');
      await set('wafRate', '100'); const lead = await verify(14, false, 'レート制限を「5分で100回」にした');
      check('14日目：きつすぎると「お客さんが困ってる」と言われる', /お客さんが困ってる/.test(lead || ''));
      await tab('console'); await set('wafRate', '2000');   // 同じ画面で、ゆるめる
      await sub('edge'); await sw('cache');
      await verify(14, true);
    },
    15: async () => {
      await tab('console'); await click('[data-act="wafEnc"]'); await click('[data-act="wafSend"]'); check('15日目：エンコードした攻撃は、WAFを通過する', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      check('15日目：矢印はピクセルハブ（コードを直す日）', (await arrow()) === 'svc-hub');
      await sw('wafDecode'); await verify(15, false, null);   // WAFを強めるだけでは足りない
      await tab('console'); await svc('hub'); await shot('15-hub');
      check('15日目：ピクセルハブにプルリクエストと、これまでのコミット履歴がある', /プルリクエスト/.test(await page.locator('#p-console .viewport').innerText()) && /コミット履歴/.test(await page.locator('#p-console .viewport').innerText()) && /ほか \d+ 件/.test(await page.locator('#p-console .viewport').innerText()));
      await click('[data-act="applyFix"]'); await clearWin();
      await verify(15, true);
    },
    16: async () => {
      await tab('console'); await click('[data-act="scrapeRun"]'); check('16日目：未対策は、全商品を取られる', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      await set('bot', 'ua'); await verify(16, false, '名乗り（User-Agent）でボットを見分けようとした');
      await tab('console'); await set('bot', 'challenge'); await set('crawler', 'block'); await verify(16, false, '検索エンジンまで止めた');
      await tab('console'); await set('crawler', 'allow'); await shot('16-waf');
      await verify(16, true);
    },
    17: async () => {
      await tab('console'); await click('[data-act="fwTry"]'); check('17日目：未対策は、直接つないで試し続けられる', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      check('17日目：矢印は小メニューの「ファイアウォール」', (await arrow()) === 'sub-fw');
      await sub('fw'); await shot('17-fw');
      await set('fwSsh', 'port'); await verify(17, false, 'SSHのポート番号を変えるだけにした');
      await tab('console'); await set('fwSsh', 'admin'); await verify(17, false, null);   // Webがまだ直接つなげる
      await tab('console'); await set('fwWeb', 'admin'); await verify(17, false, 'お店のサイトまで「管理者だけ」にした');
      await tab('console'); await set('fwWeb', 'edge');
      await verify(17, true);
    },
    18: async () => {
      await tab('shop'); await click('[data-act="goCert"]');
      check('18日目：メモのボタンは、ピクセルクラウドの「証明書」を開くだけ', (await state()).tab === 'console' && (await state()).sub === 'cert' && !(await state()).cfg.autoRenew);
      await click('#autorenew'); await clearWin();
      await verify(18, true);
    },
    19: async () => {
      await tab('console'); check('19日目：サーバーの画面に「ソフトウェアの更新」がある', /ソフトウェアの更新/.test(await page.locator('#p-console .viewport').innerText()));
      await sw('autoPatch'); await verify(19, false, null);   // 自動適用だけでは、いまの穴は残る
      await tab('console'); await click('[data-act="vulnScan"]'); await clearWin(); check('19日目：調べると、既知の穴が並ぶ', (await notes()).some(n => /^danger/.test(n))); await shot('19-server');
      await click('[data-act="patchNow"]'); await clearWin();
      check('19日目：適用しても、OSは同じまま。更新だけが当たる', /Ubuntu 22\.04/.test(await page.locator('#p-console .viewport').innerText()) && /更新をすべて適用/.test(await page.locator('#p-console .viewport').innerText()));
      await verify(19, true);
    },
    20: async () => {
      await tab('console'); check('20日目：ピクセルハブにセキュリティ警告が出ている', (await state()).svc === 'hub' && /セキュリティ警告/.test(await page.locator('#p-console .viewport').innerText()) && (await notes()).some(n => /^danger/.test(n)));
      await shot('20-hub'); await click('[data-act="applyFix"]'); await clearWin();
      await verify(20, true);
    },
    21: async () => {
      await tab('shop'); await click('[data-act="skimPay"]'); check('21日目：未対策は、カード情報が外へ送られる', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      await tab('console'); check('21日目：通信設定に CSP がある', (await page.locator('#inf-csp').count()) === 1 && (await page.locator('[data-act="applyFix"]').count()) === 0);
      await set('csp', 'strict'); await verify(21, false, 'CSPを「お店だけ許可」にして、決済を止めた');
      await tab('console'); await set('csp', 'allow'); await shot('21-net');
      await verify(21, true);
    },
    22: async () => {
      await tab('console'); check('22日目：矢印はピクセルハブ（今いる場所なので立たない）', (await state()).svc === 'hub' && (await arrow()) === '');
      await click('[data-act="applyFix"]'); await clearWin();
      check('22日目：マージしたあと、シロがシークレットへ案内する', /シークレット/.test((await state()).chatLog.slice(-1)[0].t));
      check('22日目：矢印はピクセルクラウドへ', (await arrow()) === 'svc-cloud');
      await verify(22, false, '漏れたキーを、使えるまま残した');
      await tab('console'); await svc('cloud'); check('22日目：矢印は小メニューの「シークレット」', (await arrow()) === 'sub-secret');
      await sub('secret'); await shot('22-secret');
      await click('[data-act="keyRotate"]'); await clearWin();
      await verify(22, true);
    },
    23: async () => {
      await tab('console'); await click('[data-act="domTry"]'); check('23日目：未対策は、なりすましの申請が通りかける', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      await sw('regLock'); await verify(23, false, null);   // 2段階認証がまだ
      await tab('console'); await sw('reg2fa'); await sw('dnsFreeze'); await shot('23-registrar');
      const lead = await verify(23, false, 'DNSの変更をすべて凍結した');
      check('23日目：止めすぎは「別のものまで止めた」と言われる', /別のものまで/.test(lead || ''));
      await tab('console'); check('23日目：凍結中は、DNSを変えられない', (await page.locator('[data-act="dnsAdd"]').count()) === 0);
      await sw('dnsFreeze');
      await verify(23, true);
    },
    24: async () => {
      await tab('console'); check('24日目：「監視」の画面が開いている', (await state()).sub === 'mon');
      await click('[data-act="exfilRun"]'); check('24日目：未対策は、外へ送れてしまう', (await notes()).some(n => /^danger/.test(n))); await clearWin();
      check('24日目：矢印は小メニューの「ファイアウォール」', (await arrow()) === 'sub-fw');
      await sub('fw'); await set('fwOut', 'none'); await shot('24-fw'); await verify(24, false, '出ていく通信をすべて止めた');
      await tab('console'); await set('fwOut', 'allow');
      check('24日目：宛先を絞ったら、矢印は小メニューの「監視」', (await arrow()) === 'sub-mon');
      const lead = await verify(24, false, null);
      check('24日目：止めただけでは足りない、と言われる', /送信は止められた/.test(lead || ''));
      await tab('console'); await sub('mon'); await sw('alarmOut'); await shot('24-mon');
      await verify(24, true);
    }
  };
  for (let day = FROM; day <= 24; day++) {
    await morning(day);
    await steps[day]();
    log(day + '日目 OK');
    if (day < 24) await next(day);
  }

  // エンディング：解説の「エンディングへ」→ 夜の街角で会話 → エンドロール
  for (let i = 0; i < 80; i++) { if (await page.locator('#sheet [data-act="nextDay"]').isVisible()) break; if (await winUp()) await winNext(); await page.waitForTimeout(50); }
  check('24日目：解説のボタンが「エンディングへ」', /エンディングへ/.test(await page.locator('#sheet [data-act="nextDay"]').innerText()));
  await page.click('#sheet [data-act="nextDay"]'); await page.waitForTimeout(150);
  check('エンディング：夜の街角の場面が出て、会話が始まる', (await page.locator('#ending').isVisible()) && (await winUp()) && (await page.locator('#ending .ch').count()) >= 6);
  await shot('ending');
  const talk = [], shiro = []; for (let i = 0; i < 60 && (await winUp()); i++) { talk.push(await page.locator('#winText').innerText()); shiro.push(await page.evaluate(() => document.querySelector('#ending .ch[data-cast="shiro"]').className)); await winNext(); await page.waitForTimeout(50); }
  check('エンディング：会話が流れる（' + talk.length + 'こと）', talk.length >= 14 && /今日の営業を終えた/.test(talk[0]) && !talk.some(t => /店じまい/.test(t)) && talk.some(t => /まちがえた設定も、\d+回あった/.test(t)));
  check('エンディング：「セキュリティ対策に終わりはない」と伝える', talk.some(t => /セキュリティ対策に終わりはない/.test(t)));
  check('エンディング：シロが正体を明かし、薄れて、消える', talk.some(t => /「穴」から生まれた妖精/.test(t)) && shiro.some(c => /flick/.test(c)) && /gone/.test(shiro[shiro.length - 1]) && !/flick|gone/.test(shiro[0]) && /いつもどおりに店を開けた/.test(talk[talk.length - 1]));
  check('エンドロール：会話のあとに始まる', (await page.locator('#roll').isVisible()) && !(await page.locator('#ending').isVisible()));
  const roll = await page.locator('#roll').innerText();
  const s = await state();
  check('エンドロール：主演・案内役・お客さん・協力・スペシャルサンクス・制作', ['主演', '案内役', 'お客さん', '協力', 'スペシャルサンクス', 'ピクセルクラウド', '毎日苦情をくれたお客さんたち', '制作', 'kanade0525'].every(t => roll.includes(t)));
  check('エンドロール：攻撃者の役名が、登場順に明かされる', ['カフェの盗聴者', 'ダウングレード職人', 'クーポン連打部隊', 'WAFすり抜け師', '深夜のデータ持ち出し屋'].every(t => roll.includes(t)) && roll.indexOf('カフェの盗聴者') < roll.indexOf('深夜のデータ持ち出し屋') && (await page.locator('#roll .rsp').count()) >= 20);
  check('エンドロール：ゲスト出演（困らせてしまったお客さん）が出る', FROM > 12 || (roll.includes('ゲスト出演') && roll.includes('会員になれなかった やまだ')));
  check('エンドロール：引っかかったトラップの一覧（' + s.traps.length + '件）', (await page.locator('#roll .rtraps li').count()) === s.traps.length && (FROM > 12 || s.traps.length >= 5));
  check('エンドロール：「そして、お店は今日も営業中」と、終わりのボタンがある', roll.includes('そして、お店は今日も営業中') && roll.includes('お店の「穴」から生まれた妖精') && (await page.locator('#roll [data-act="rollTitle"]').count()) === 1);
  check('最後の場面：見える位置に来るまでは始まらない', (await page.locator('#stingCh.in').count()) === 0);
  check('クリアの記録が残る', s.phase === 'end' && s.cleared === 24);
  await shot('roll-top');
  await page.evaluate(() => { const r = document.getElementById('roll'); r.scrollTop = r.scrollHeight; });
  // 最後の場面（動きを減らす設定では、姿の切り替えだけ）：シロ → 黒い姿 → いなくなる
  const seen = []; for (let i = 0; i < 60; i++) { const c = await page.evaluate(() => { const e = document.getElementById('stingCh'); return e.dataset.cast + '|' + e.className; }); if (seen[seen.length - 1] !== c) seen.push(c); if (/kuro/.test(c) && /dark/.test(c) && !/out/.test(c) && !seen.shot) { seen.shot = 1; await shot('roll-kuro'); } if (/out/.test(c)) break; await page.waitForTimeout(100); }
  check('最後の場面：シロが現れ、黒い姿に変わり、いなくなる（' + seen.join(' → ') + '）', seen.some(c => /^shiro\|.*\bin\b/.test(c)) && seen.some(c => /^kuro\|.*dark/.test(c)) && /out/.test(seen[seen.length - 1]));
  await shot('roll-end');
  await page.click('#roll [data-act="rollTitle"]'); await page.waitForTimeout(100);
  check('エンドロールのあと、タイトルへ戻る', (await page.locator('#title').isVisible()) && /全24日クリア/.test(await page.locator('#title').innerText()));
  // つづきから：まとめ → エンディングをもう一度
  await page.click('.menu button[data-t="cont"]'); await page.waitForTimeout(100);
  check('クリア後の「つづきから」で、まとめが出る', /守りきった/.test(await page.locator('#sheet').innerText()) && (await page.locator('#sheet [data-act="ending"]').isVisible()));
  await page.close();

  // 動きあり：エンドロールが下から流れ、スキップで最後の画面へ
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  p2.on('pageerror', e => errors.push('roll: ' + String(e)));
  await p2.goto(BASE + '#debug');
  await p2.click('.menu button[data-t="days"]'); await p2.click('.dayrow[data-act="ending"]'); await p2.waitForTimeout(400);
  check('デバッグ：日を選ぶ一覧から、エンディングを見られる', await p2.locator('#ending').isVisible());
  await p2.screenshot({ path: path.join(OUT, 'infra-ending-pc.png') });
  for (let i = 0; i < 60 && !(await p2.locator('#roll').isVisible()); i++) { await p2.click('#win', { position: { x: 24, y: 16 } }).catch(() => {}); await p2.waitForTimeout(120); }
  await p2.waitForTimeout(2500);
  const mv = await p2.evaluate(() => { const t = document.getElementById('rollTrack'); return { go: t.classList.contains('go'), y: t.getBoundingClientRect().top, h: innerHeight, dur: getComputedStyle(t).animationDuration }; });
  check('エンドロール：下から上へ流れる（' + JSON.stringify(mv) + '）', mv.go && mv.y < mv.h);
  await p2.screenshot({ path: path.join(OUT, 'infra-roll-pc.png') });
  // スキップ：名前の流れを飛ばす →「営業中」→ 最後の場面（シロが震えて、黒い姿に変わり、飛び去る）→ おわり
  await p2.click('#roll .rskip'); await p2.waitForTimeout(1200);
  check('エンドロール：スキップで「そして、お店は今日も営業中」へ', (await p2.locator('#rollFin').isVisible()) && !(await p2.locator('#rollTrack').isVisible()) && !(await p2.locator('#rollEnd').isVisible()));
  await p2.screenshot({ path: path.join(OUT, 'infra-roll-fin.png') });
  const st = []; let t0 = Date.now();
  for (let i = 0; i < 140 && !(await p2.locator('#rollEnd').isVisible()); i++) {
    const c = await p2.evaluate(() => { const b = document.getElementById('rollSting'), e = document.getElementById('stingCh'); return b.hidden ? 'wait' : e.dataset.cast + '|' + e.className.replace('sting-ch', '').trim(); });
    if (st[st.length - 1] !== c) { st.push(c); if (/^shiro\|in$/.test(c)) { await p2.waitForTimeout(900); await p2.screenshot({ path: path.join(OUT, 'infra-sting-1shiro.png') }); } if (/shake/.test(c)) { await p2.waitForTimeout(1200); await p2.screenshot({ path: path.join(OUT, 'infra-sting-2shake.png') }); } if (/^kuro\|in dark$/.test(c)) { await p2.waitForTimeout(700); await p2.screenshot({ path: path.join(OUT, 'infra-sting-3kuro.png') }); } if (/fly/.test(c)) { await p2.waitForTimeout(250); await p2.screenshot({ path: path.join(OUT, 'infra-sting-4fly.png') }); } }
    await p2.waitForTimeout(100);
  }
  check('最後の場面：シロ → 震える → 黒い姿 → 飛び去る → おわり（' + st.join(' → ') + '、' + Math.round((Date.now() - t0) / 100) / 10 + '秒）', st.some(c => /^shiro\|in$/.test(c)) && st.some(c => /shake/.test(c)) && st.some(c => /^kuro\|.*dark/.test(c)) && st.some(c => /fly/.test(c)) && (await p2.locator('#rollEnd').isVisible()));
  check('おわり：ボタンだけが残る', (await p2.locator('#roll [data-act="rollTitle"]').isVisible()) && !(await p2.locator('#rollSting').isVisible()) && !(await p2.locator('#roll .rskip').isVisible()));
  await p2.screenshot({ path: path.join(OUT, 'infra-roll-end-pc.png') });
  // もう一度見る → スキップを3回押すと、すぐ終わりまで行ける
  await p2.click('#roll [data-act="rollAgain"]'); await p2.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { await p2.click('#roll .rskip'); await p2.waitForTimeout(150); }
  check('もう一度見る：スキップを3回で、おわりまで飛ばせる', (await p2.locator('#rollEnd').isVisible()) && !(await p2.locator('#rollSting').isVisible()));
  check('デバッグで見返しただけでは、クリアの記録は変わらない', (await p2.evaluate(() => JSON.parse(localStorage.getItem('gsi-demo-v2') || 'null'))) === null || (await p2.evaluate(() => JSON.parse(localStorage.getItem('gsi-demo-v2')).phase)) !== 'end');
  await p2.close();

  log('page errors:', errors.length ? errors : 'none');
  log(fails.length ? 'FAIL ' + fails.length + '件' : 'ALL PASS');
  await browser.close();
  if (errors.length || fails.length) process.exit(1);
})().catch(e => { console.error('[infra] FAIL', e); process.exit(1); });
