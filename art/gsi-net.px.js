// Getting Secure It — 通信図の素材（横並びの図）。名鑑と同じ24色パレット
// 機器は 16×16（キャラと同じ枠・黒フチ）、パケットは 10×8。sprites.js の icons に行データで反映する
pal({ K: "#1a1426", W: "#f4f0e6", S: "#f2c09a", s: "#c98a68", H: "#3b2416", h: "#6b4226",
      R: "#c2373f", r: "#ff7a6b", B: "#2f4a9e", b: "#5c86d6", G: "#2f7d4a", g: "#6ccf7a",
      Y: "#e8b33a", y: "#ffe08a", P: "#5a3a8a", p: "#8f6ac9", N: "#3a3f55", n: "#7a8099",
      L: "#c3c7d6", O: "#d9742b", T: "#8a5a2b", t: "#b98a52", C: "#2fa3a8", D: "#26223a" })

// ルーター：アンテナ2本の箱。正面にランプ
sprite("n_router", { w: 16, h: 16 }, `
  ................
  ................
  ...n........n...
  ...n........n...
  ...n........n...
  ...n........n...
  .KKKKKKKKKKKKKK.
  .KLLLLLLLLLLLLK.
  .KLLLLLLLLLLLLK.
  .KnnnnnnnnnnnnK.
  .KngnynnnnNNNnK.
  .KnnnnnnnnnnnnK.
  .KKKKKKKKKKKKKK.
  ..KK........KK..
  ................
  ................`)

// インターネット：雲
sprite("n_cloud", { w: 16, h: 16 }, `
  ................
  ................
  ................
  ......KKKK......
  .....KbbbbK.....
  ..KKKbbbbbbK....
  .KbbbKbbbbbbKK..
  .KbWWbbbbbbbbbK.
  KbbWbbbbbbbbbbbK
  KbbbbbbbbbbbbbbK
  KbbbbbbbbbbbbbbK
  .KBBBBBBBBBBBBK.
  ..KKKKKKKKKKKK..
  ................
  ................
  ................`)

// ショップのサーバー：3段のラック
sprite("n_server", { w: 16, h: 16 }, `
  ................
  ..KKKKKKKKKKKK..
  ..KLLLLLLLLLLK..
  ..KLgLLLLnnnLK..
  ..KLLLLLLLLLLK..
  ..KNNNNNNNNNNK..
  ..KLLLLLLLLLLK..
  ..KLgLLLLnnnLK..
  ..KLLLLLLLLLLK..
  ..KNNNNNNNNNNK..
  ..KLLLLLLLLLLK..
  ..KLgLLLLnnnLK..
  ..KLLLLLLLLLLK..
  ..KKKKKKKKKKKK..
  ...KK......KK...
  ................`)

// パケット（ふつう）：中身が読める手紙
sprite("pk_open", { w: 10, h: 8 }, `
  KKKKKKKKKK
  KWWWWWWWWK
  KWnnnnnnWK
  KWWWWWWWWK
  KWnnnnWWWK
  KWWWWWWWWK
  KWnnnWWWWK
  KKKKKKKKKK`)

// パケット（暗号化）：鍵のかかった箱。中身は見えない
sprite("pk_seal", { w: 10, h: 8 }, `
  KKKKKKKKKK
  KnnnnnnnnK
  KnnnYYnnnK
  KnnYnnYnnK
  KnnYYYYnnK
  KnnYKKYnnK
  KnnYYYYnnK
  KKKKKKKKKK`)

// パケット（盗まれた・悪用）：赤い手紙
sprite("pk_bad", { base: "pk_open", swap: { W: "r", n: "R" } })

// パケット（防いだ）：緑の箱に鍵
sprite("pk_ok", { base: "pk_seal", swap: { n: "g", Y: "W" } })

// 盾：防いだ印
sprite("shield", { w: 9, h: 10 }, `
  KKKKKKKKK
  KgggggggK
  KggggggWK
  KgggggWgK
  KgWggWggK
  KggWWgggK
  .KggWggK.
  .KGgggGK.
  ..KGGGK..
  ...KKK...`)

// 開いた錠：暗号化されていない
sprite("lock_open", { w: 8, h: 8 }, `
  .RRRR...
  R....R..
  R.......
  RRRRRRRR
  RRRKKRRR
  RRRKKRRR
  RRRRRRRR
  ........`)

// 注意の印：お客さんが困っている
sprite("warn", { w: 7, h: 7 }, `
  .KKKKK.
  KRRWRRK
  KRRWRRK
  KRRWRRK
  KRRRRRK
  KRRWRRK
  .KKKKK.`)

sheet("net", ["n_*", "pk_*", "shield", "lock_open", "warn"], { pad: 1 })
