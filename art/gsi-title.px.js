// Getting Secure It — タイトル画面のジオラマ（アイソメ）と、お店のアイコン。名鑑と同じ24色パレット
//   node ~/.claude/skills/pxl-pixel-art/bin/pxl.js build art/gsi-title.px.js
//   できた art/out/scenes/title.png を、リポジトリ直下の title.png に置く（art/mkicons.mjs がまとめてやる）
pal({ K: "#1a1426", W: "#f4f0e6", S: "#f2c09a", s: "#c98a68", H: "#3b2416", h: "#6b4226",
      R: "#c2373f", r: "#ff7a6b", B: "#2f4a9e", b: "#5c86d6", G: "#2f7d4a", g: "#6ccf7a",
      Y: "#e8b33a", y: "#ffe08a", P: "#5a3a8a", p: "#8f6ac9", N: "#3a3f55", n: "#7a8099",
      L: "#c3c7d6", O: "#d9742b", T: "#8a5a2b", t: "#b98a52", C: "#2fa3a8", D: "#26223a" })

// ---------- 2:1 アイソメの描画ヘルパー ----------
// 地面の座標 (x, y) は 1 マス＝横2px。x は右下へ、y は左下へ進む。z は高さ（px）
// 見える面は3つ：上面 top／左の壁 wallL（y が一定）／右の壁 wallR（x が一定）
function iso(c, OX, OY) {
  const pick = (col, a, b) => (typeof col === "function" ? col(a, b) : col)
  const put = (sx, sy, k) => { if (k && k !== ".") c.px(sx, sy, k) }
  const P = (x, y, z = 0) => [OX + (x - y) * 2, OY + x + y - z]
  // 上面：[x0,x1)×[y0,y1) を高さ z に。col は色か (x, y) => 色
  function top(x0, y0, x1, y1, z, col) {
    const l = P(x0, y1)[0], r = P(x1, y0)[0], t = P(x0, y0, z)[1], b = P(x1, y1, z)[1]
    for (let sy = t; sy < b; sy++) for (let sx = l; sx < r; sx++) {
      const u = (sx + 0.5 - OX) / 2, w = sy + 0.5 - OY + z, x = (u + w) / 2, y = (w - u) / 2
      if (x >= x0 && x < x1 && y >= y0 && y < y1) put(sx, sy, pick(col, x, y))
    }
  }
  // 左の壁：y=yc の面。x0→x1 の幅、上端の高さ z1 から下へ h px。col は色・行の配列（上から）・(i, row) => 色
  function wallL(x0, x1, yc, z1, h, col) {
    const sx0 = P(x0, yc)[0], base = OY - z1 + x0 + yc, n = (x1 - x0) * 2
    for (let i = 0; i < n; i++) for (let row = 0; row < h; row++)
      put(sx0 + i, base + ((i + 1) >> 1) + row, Array.isArray(col) ? (col[row] || "")[i] : pick(col, i, row))
  }
  // 右の壁：x=xc の面。手前の角（y1）から奥（y0）へ
  function wallR(xc, y0, y1, z1, h, col) {
    const sx0 = P(xc, y1)[0], base = OY - z1 + xc + y1, n = (y1 - y0) * 2
    for (let j = 0; j < n; j++) for (let row = 0; row < h; row++)
      put(sx0 + j, base - ((j + 1) >> 1) + row, Array.isArray(col) ? (col[row] || "")[j] : pick(col, j, row))
  }
  // 箱：上面と2つの壁をまとめて
  function box(x0, y0, x1, y1, z0, z1, ct, cl, cr) {
    wallL(x0, x1, y1, z1, z1 - z0, cl); wallR(x1, y0, y1, z1, z1 - z0, cr); top(x0, y0, x1, y1, z1, ct)
  }
  // 左の壁から手前に張り出す、ななめの板（ひさし）。壁の高さ zt から、奥行き d マス・下がり drop px
  function slopeL(x0, x1, yc, zt, d, drop, col) {
    const [ax, ay] = P(x0, yc, zt), len = x1 - x0, k = d + drop
    for (let sy = ay - 1; sy < ay + len + k + 2; sy++) for (let sx = ax - 2 * d - 1; sx < ax + 2 * len + 1; sx++) {
      const px = sx + 0.5 - ax, py = sy + 0.5 - ay
      const t = (py - px / 2) / (k + d), s = (px + 2 * d * t) / 2
      if (t >= 0 && t < 1 && s >= 0 && s < len) put(sx, sy, pick(col, s, t))
    }
  }
  return { P, top, wallL, wallR, box, slopeL, put }
}

// 文字（5×7）。看板用。I だけ幅3
const FONT = {
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
}
function textRows(str, on, off) {
  const rows = Array.from({ length: 7 }, () => "")
  ;[...str].forEach((ch, n) => FONT[ch].forEach((r, i) => { rows[i] += (n ? off : "") + r.replace(/#/g, on).replace(/\./g, off) }))
  return rows
}

// ---------- 店の壁。平らに描いて、壁に貼る（横1列＝画面の1px、2列ごとに1px下がる） ----------
// 文字の格子を作り、部品を置いていく
function tex(w, h, fill) {
  const g = Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, i) => (typeof fill === "function" ? fill(i, r) : fill)))
  const api = {
    rect(x, y, ww, hh, k) { for (let r = y; r < y + hh; r++) for (let i = x; i < x + ww; i++) if (g[r] && i >= 0 && i < w) g[r][i] = k; return api },
    grid(x, y, rows) { rows.forEach((row, r) => [...row].forEach((k, i) => { if (k !== "." && g[y + r] && x + i >= 0 && x + i < w) g[y + r][x + i] = k })); return api },
    rows: () => g.map((r) => r.join("")),
  }
  return api
}
const WALL_H = 34
// 正面（左の壁）48×34：ショーウィンドウ・ドア・ショーウィンドウ。上のほうは、ひさしに隠れる
const FRONT = tex(48, WALL_H, (i, r) => (r < 2 ? "t" : r < 27 ? "T" : r === 27 ? "t" : r < 32 ? "T" : r === 32 ? "H" : "K"))
  // 左のショーウィンドウ（ブリキのロボットとマグカップ）
  .rect(2, 12, 16, 15, "H").rect(3, 13, 14, 12, "y").rect(3, 25, 14, 1, "t")
  .grid(4, 18, [".nn..", "nKKn.", "nrrn.", ".nn..", "nnnn.", "n..n.", "n..n."])
  .grid(11, 20, ["LLLL.", "LbbLL", "LbbL.", "LbbLL", "LLLL."])
  .grid(4, 14, ["W", "W"]).grid(5, 13, ["W"])
  // ドア（上半分はガラス）
  .rect(20, 10, 10, 22, "H").rect(21, 11, 8, 21, "h").rect(22, 12, 6, 9, "y").grid(22, 12, ["WW", "W"]).rect(27, 23, 1, 2, "Y").rect(21, 22, 8, 1, "H")
  // 右のショーウィンドウ（ホーロー看板・びん・まねき猫）
  .rect(32, 12, 14, 15, "H").rect(33, 13, 12, 12, "y").rect(33, 25, 12, 1, "t")
  .grid(34, 15, ["RRRR", "RWWR", "RWWR", "RRRR"])
  .grid(34, 21, ["b.", "bb", "bb", "bb"])
  .grid(39, 19, ["W..W.", "WWWW.", "WKWK.", "WWWW.", "WrrW.", "WWWW."])
  .grid(33, 13, ["WW", "W"])
  .rows()
// 横（右の壁）32×34：窓・はり紙・配管
const SIDE = tex(32, WALL_H, (j, r) => (r < 2 ? "T" : r < 28 ? "h" : r < 33 ? "H" : "K"))
  .rect(4, 9, 11, 11, "H").rect(5, 10, 4, 4, "y").rect(10, 10, 4, 4, "y").rect(5, 15, 4, 4, "y").rect(10, 15, 4, 4, "y").rect(4, 20, 11, 1, "T")
  .grid(19, 12, ["WWWWW", "WRRRW", "WWWWW", "WnnnW", "WWWWW", "WnnWW", "WWWWW"])
  .rect(27, 2, 1, 30, "n").rect(26, 31, 2, 1, "n")
  .rows()

// 雲（ピクセルクラウド）
sprite("_cloud", `
  ......KKKK......
  .....KbbbbK.....
  ..KKKbbbbbbK....
  .KbbbKbbbbbbKK..
  .KbWWbbbbbbbbbK.
  KbbWbbbbbbbbbbbK
  KbbbbbbbbbbbbbbK
  .KBBBBBBBBBBBBK.
  ..KKKKKKKKKKKK..`)

const TW = 168, TH = 136, TOX = 84, TOY = 40, G = 40
ramps("DNnL", "KTtS", "KHhS", "DBbW", "KRrW", "KYyW", "KGg")

scene("title", { w: TW, h: TH },
  (c) => {
    const I = iso(c, TOX, TOY), { P, top, wallL, wallR, box, slopeL, put } = I
    const fr = (v) => v - Math.floor(v)
    // --- 土台：舗道（タイルの目地）と、手前の道路 ---
    top(0, 0, G, G, 0, (x, y) => {
      if (y >= 30) {                                       // 道路
        if (y < 30.5) return "D"
        if (x >= 32 && x < 37 && y >= 31 && y < 39.5) return fr(y / 2) < 0.5 ? "L" : "N"   // 横断歩道
        if (y >= 34.5 && y < 35.5 && fr(x / 8) < 0.5 && x < 30) return "L"                 // 中央線
        return "N"
      }
      if (y >= 29) return "L"                              // 縁石
      if (fr(x / 5) < 0.1 || fr(y / 5) < 0.1) return "N"   // 目地
      return "n"
    })
    // 土台の側面（地層ではなく、コンクリートの台）
    wallL(0, G, G, 0, 10, (i, row) => (row < 1 ? "L" : row < 4 ? "N" : row < 9 ? "D" : "K"))
    wallR(G, 0, G, 0, 10, (j, row) => (row < 1 ? "n" : row < 4 ? "D" : "K"))

    // --- 店（x:6-30, y:3-19, 高さ28） ---
    const X0 = 6, Y0 = 3, X1 = 30, Y1 = 19, Hh = WALL_H
    wallL(X0, X1, Y1, Hh, Hh, FRONT)
    wallR(X1, Y0, Y1, Hh, Hh, SIDE)
    // 屋上：ふち（パラペット）と床
    top(X0, Y0, X1, Y1, Hh, (x, y) => (x < X0 + 1 || y < Y0 + 1 || x >= X1 - 1 || y >= Y1 - 1 ? "t" : x < X0 + 1.5 || y < Y0 + 1.5 ? "D" : "N"))
    // 屋上の室外機
    box(10, 6, 14, 9, Hh, Hh + 5, "L", (i, row) => (row === 2 ? "N" : "n"), "N")
    // 屋上のアンテナ（先に赤いランプ）
    { const [ax, ay] = P(25, 8, Hh); c.rect(ax, ay - 13, 1, 13, "n"); c.rect(ax - 2, ay - 10, 5, 1, "n"); c.rect(ax - 1, ay - 7, 3, 1, "n"); put(ax, ay - 14, "r") }
    // 屋上の看板（左の壁と同じ向き）。脚＋黒い板＋光る文字
    { const sx0 = 9, sx1 = 29, sy = Y1 - 1, zt = Hh + 15
      const txt = textRows("PIXELDO", "y", "K"), tw = txt[0].length, padL = Math.floor(((sx1 - sx0) * 2 - tw) / 2)
      const rows = []
      for (let r = 0; r < 13; r++) {
        let s = ""
        for (let i = 0; i < (sx1 - sx0) * 2; i++) {
          if (r === 0 || r === 12) s += "Y"
          else if (i === 0 || i === (sx1 - sx0) * 2 - 1) s += "Y"
          else if (r >= 3 && r < 10 && i >= padL && i < padL + tw) s += txt[r - 3][i - padL]
          else s += "K"
        }
        rows.push(s)
      }
      wallL(sx0, sx1, sy, zt, 13, rows)
      wallL(sx0 + 2, sx0 + 3, sy, zt - 13, 2, "N"); wallL(sx1 - 3, sx1 - 2, sy, zt - 13, 2, "N")   // 脚
    }
    // ひさし（赤白のしま）。壁の高さ AW から、手前に3マス・4px下がる
    const AW = Hh - 4
    slopeL(X0, X1, Y1, AW, 3, 4, (s, t) => (fr(s / 4) < 0.5 ? "R" : "W"))
    // ひさしの垂れ（下のふち）
    { const d = 3, drop = 4
      for (let i = 0; i < (X1 - X0) * 2; i++) {
        const s = i / 2, k = fr(s / 4) < 0.5 ? "r" : "L", [bx, by] = P(X0, Y1 + d, AW - drop)
        put(bx + i, by + ((i + 1) >> 1), k); if (fr(s / 2) < 0.5) put(bx + i, by + ((i + 1) >> 1) + 1, k)
      }
    }

    // --- 街灯（2本） ---
    const lamp = (x, y) => { const [lx, ly] = P(x, y); c.rect(lx, ly - 24, 1, 24, "K"); c.rect(lx - 1, ly - 1, 3, 1, "K"); c.rect(lx - 2, ly - 28, 5, 1, "K"); c.rect(lx - 2, ly - 27, 5, 3, "y"); c.rect(lx - 1, ly - 24, 3, 1, "K") }
    lamp(2, 27); lamp(39, 25)
    // --- 自動販売機（店の右わき） ---
    box(32, 6, 35, 10, 0, 15, "L", "B", (j, row) => (row < 1 || row > 13 ? "B" : j < 1 || j > 6 ? "B" : row < 8 ? (row % 3 === 1 ? ["r", "y", "g", "W", "r", "g"][j - 1] || "W" : "W") : row === 10 && j > 1 && j < 6 ? "K" : "b"))
    // --- 植木（右の奥） ---
    { const [tx, ty] = P(36, 3); c.rect(tx - 1, ty - 6, 2, 6, "H"); c.circ(tx, ty - 11, 6, "G"); c.circ(tx - 2, ty - 13, 3, "g"); c.px(tx + 2, ty - 9, "g"); c.px(tx + 3, ty - 12, "g"); c.px(tx - 3, ty - 8, "G") }
    // --- 赤いポスト（左の手前） ---
    box(3, 21, 5, 23, 0, 9, "r", (i, row) => (row === 2 && i > 0 && i < 3 ? "K" : "R"), (j, row) => (row === 5 && j > 0 && j < 3 ? "W" : "R"))
  },
  // 雲と、店をつなぐ点線（お店はネットにつながっている）
  stamp("_cloud", 138, 6),
  (c) => { for (let i = 0; i < 7; i++) c.px(121 + i * 3, 23 - Math.round(i * 1.3), i % 2 ? "b" : "W") },
  // 三日月
  circ(20, 15, 6, "y"), circ(23, 13, 5, "_"),
  glow("y", { r: 9, strength: 0.5 }),
  glow("r", { r: 3, strength: 0.35 })
)

// ---------- お店のアイコン（16×16）。ヘッダー・サイトのロゴ・ファビコンで共通 ----------
// 16px でも「お店」と読めるよう、正面を平らに見せて、屋根と右の壁で奥行きを出す
// 赤白のひさし・明かりのついたショーウィンドウ・ガラスのドア・横の窓
const SHOP = [
  "....KKKKKKKKKKK.",
  "...KLLLLLLLLLLKK",
  "..KLLLLLLLLLLKhK",
  ".KKKKKKKKKKKKhhK",
  ".KRRWWRRWWRRKhhK",
  ".KRRWWRRWWRRKhyK",
  ".KrrLLrrLLrrKhyK",
  ".KTTTTTTTTTTKhhK",
  ".KtWyyytHHHtKhhK",
  ".KtyyyytHyHtKhhK",
  ".KtynyytHyHtKhhK",
  ".KtnnnytHHHtKhHK",
  ".KttttttHHYtKHK.",
  ".KTTTTTTHHHTKK..",
  ".KKKKKKKKKKKK...",
  "................"]
sprite("shop16", { w: 16, h: 16 }, SHOP.join("\n"))   // → sprites.js の icons.shop

// ファビコン：同じ絵を整数倍にしたもの（にじませない）
const blowUp = (c, px, ox, oy) => SHOP.forEach((row, y) => [...row].forEach((k, x) => { if (k !== ".") c.rect(ox + x * px, oy + y * px, px, px, k) }))
sprite("favicon", { w: 32, h: 32 }, (c) => blowUp(c, 2, 0, 1))                                        // → favicon.png
sprite("touch", { w: 180, h: 180 }, (c) => { c.rect(0, 0, 180, 180, "#14162b"); blowUp(c, 10, 10, 15) })   // → apple-touch-icon.png
