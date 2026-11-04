// Getting Secure It — 追加素材（会社ロゴ）。名鑑と同じ24色パレット
pal({ K: "#1a1426", W: "#f4f0e6", S: "#f2c09a", s: "#c98a68", H: "#3b2416", h: "#6b4226",
      R: "#c2373f", r: "#ff7a6b", B: "#2f4a9e", b: "#5c86d6", G: "#2f7d4a", g: "#6ccf7a",
      Y: "#e8b33a", y: "#ffe08a", P: "#5a3a8a", p: "#8f6ac9", N: "#3a3f55", n: "#7a8099",
      L: "#c3c7d6", O: "#d9742b", T: "#8a5a2b", t: "#b98a52", C: "#2fa3a8", D: "#26223a" })

// ネームヤ（ドメイン会社）：住所札。金色の札に黒い穴と紐
sprite("logo_registrar", { w: 8, h: 8 }, `
  ..KKKK..
  .KYYYYK.
  KYyKKyYK
  KYyyyyYK
  KYYYYYYK
  KYYYYYYK
  .KYYYYK.
  ..KKKK..`)

// ピクセルクラウド（サーバー）：雲
sprite("logo_cloud", { w: 8, h: 8 }, `
  ...KK...
  ..KbbK..
  .KbWbbK.
  KbbbbbbK
  KbbbbbbK
  KBBBBBBK
  .KKKKKK.
  ........`)

// 認証局：印章（リボンつき）
sprite("logo_ca", { w: 8, h: 8 }, `
  ..KKKK..
  .KggggK.
  KgGGGGgK
  KgGWWGgK
  KgGGGGgK
  .KggggK.
  .KGKKGK.
  KGK..KGK`)

sheet("logos", ["logo_*"], { pad: 1 })
