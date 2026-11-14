// 管理画面の現実味：ディスプレイの中（各社のサイト）に、その会社が知り得ないことが出ていないかを調べる。
//   ・ほかの会社の名前（良えWSの画面に「レッツ暗号を開く」など）が出ない
//   ・ゲームの言葉（〜日目・攻撃者・トラップ）や、シロの話し言葉が出ない（説明はディスプレイの外のメモに書く）
//   0〜24日目の朝（未対策）と対策後、1日目の証明書の途中の状態を、会社ごと・小メニューごとにすべて開く。
//   node test/smoke-console.cjs <index.html のあるフォルダ または URL>
const { chromium } = require('playwright');
const path = require('path');
const DIR = process.argv[2];
const URL = /^https?:/.test(DIR) ? DIR : 'file://' + path.join(path.resolve(DIR), 'index.html');
const log = (...a) => console.log('[console]', ...a);

const OTHERS = {
  registrar: /良えWS|レッツ暗号|Cithub|入口/,
  cloud: /おなまえや|Cithub|レッツ暗号(?!（中間CA)/,   // 設置した証明書の「発行者」欄だけは、ファイルに書いてある名前なのでよい
  ca: /良えWS|おなまえや|Cithub|入口/,
  hub: /良えWS|おなまえや|レッツ暗号/,
};
const GAME = /\d+日目|攻撃者|トラップ|シロ|だよ|しよう|してね|ゲーム/;

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const fails = [], errors = [];
  const p0 = await browser.newPage(); await p0.goto(URL + '#debug');
  const PLAN = await p0.evaluate(() => { const G = window.GSI_DEBUG, o = {}; for (let n = 0; n <= G.lastDay; n++) o[n] = { bad: G.cfgForDay(n), good: G.cfgForDay(n + 1), dnsBad: G.dnsForDay(n), dnsGood: G.dnsForDay(n + 1) }; return o; });
  await p0.close();
  const cases = [];
  for (let n = 0; n <= 24; n++) for (const fixed of [false, true]) cases.push({ tag: n + '日目' + (fixed ? '（対策後）' : '（朝）'), day: n, cfg: fixed ? PLAN[n].good : PLAN[n].bad, dns: fixed ? PLAN[n].dnsGood : PLAN[n].dnsBad, whois: fixed });
  // 1日目の証明書：鍵だけ／CSRをダウンロード／申請済み／発行済み・未設置／自己署名
  const c1 = PLAN[1].bad;
  [['鍵だけ', { keyMade: true }], ['CSRをダウンロード', { keyMade: true, ca: 'free' }], ['申請済み', { keyMade: true, ca: 'free', token: 'ABCD-EFGH' }],
   ['発行済み', { keyMade: true, ca: 'free', token: 'ABCD-EFGH', issued: true }], ['自己署名', { keyMade: true, ca: 'self', issued: true }]]
    .forEach(([t, x]) => cases.push({ tag: '1日目（証明書：' + t + '）', day: 1, cfg: Object.assign({}, c1, x), dns: PLAN[1].dnsBad, whois: false }));

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(String(e)));
  let opened = 0;
  for (const C of cases) {
    const seed = { rev: 3, day: C.day, phase: 'fix', tab: 'console', voices: [], badge: {}, traps: [], cart: 0, chatLog: [], last: null, domain: 'pixeldo.shop', ds: null, whois: C.whois, dnsOk: true, dns: [].concat(C.dns), svc: 'cloud', sub: 'server', cfg: C.cfg };
    await page.goto(URL); await page.evaluate(x => localStorage.setItem('gsi-demo-v2', x), JSON.stringify(seed)); await page.reload();
    await page.click('.menu button[data-t="cont"]');
    for (let i = 0; i < 40 && await page.locator('#win').isVisible(); i++) { await page.click('#win', { position: { x: 24, y: 16 } }); await page.waitForTimeout(30); }
    await page.click('.tabs button[data-tab="console"]');
    const svcs = await page.$$eval('#p-console .btab[id^="svc-"]', a => a.map(b => b.id.replace('svc-', '')));
    for (const s of svcs) {
      await page.click('#svc-' + s); await page.waitForTimeout(20);
      const subs = s === 'cloud' ? await page.$$eval('.sub', a => a.map(b => b.dataset.sub)) : [''];
      for (const sub of subs) {
        if (sub) { await page.click('.sub[data-sub="' + sub + '"]'); await page.waitForTimeout(20); }
        const t = (await page.locator('#p-console .viewport').innerText()).replace(/作成：シロ/g, '');   // プルリクエストの作成者（アカウント名）はよい
        const where = C.tag + ' ' + s + (sub ? '/' + sub : '');
        const m1 = t.match(OTHERS[s]), m2 = t.match(GAME);
        if (m1) fails.push(where + '：ほかの会社の名前「' + m1[0] + '」');
        if (m2) fails.push(where + '：ゲームの言葉「' + m2[0] + '」');
        opened++;
      }
    }
  }
  log('開いた画面：' + opened);
  fails.forEach(f => log('NG', f));
  log('page errors:', errors.length ? errors : 'none');
  log(fails.length ? 'FAIL ' + fails.length + '件' : 'ALL PASS');
  await browser.close();
  if (fails.length || errors.length) process.exit(1);
})().catch(e => { console.error('[console] FAIL', e); process.exit(1); });
