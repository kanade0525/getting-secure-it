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

// ---------- タイトル画面：夜のよろず屋ピクセル堂（180×110） ----------
ramps("DNnL", "KTtS", "KHhS", "DBbW", "KRrW", "KYyW")

sprite("_star", "W")
sprite("_star2", "L")
sprite("_winb", `
  ....
  .DD.
  .DD.
  ....`)
sprite("_winy", "yy\nyy")
sprite("_stripe", `
  RRWW
  RRWW
  RRWW
  RRWW
  RRWW
  RRWW
  RRWW
  RRWW`)
sprite("_mug", `
  .LLL.
  .LbLL
  .LbL.
  .LLL.`)
sprite("_robot", `
  .nn.
  nKKn
  .nn.
  n..n`)
sprite("_lamp", `
  .KKKK.
  KyYYyK
  KYYYYK
  .KyyK.
  ..KK..`)

scene("title", { w: 180, h: 110, bg: "D" },
  layer("sky", grad(0, 0, 180, 70, "DN", "v", 0.6), scatter("_star", 0, 0, 180, 48, 26, { seed: 7 }), scatter("_star2", 0, 0, 180, 58, 18, { seed: 3 })),
  layer("moon", circ(150, 16, 7, "y"), circ(153, 14, 6, "D"), circ(152, 15, 5, "y")),
  layer("far",
    rect(0, 44, 24, 26, "N"), rect(26, 36, 18, 34, "N"), rect(48, 50, 14, 20, "N"),
    rect(130, 40, 20, 30, "N"), rect(152, 48, 28, 22, "N"), rect(166, 30, 10, 40, "N"),
    tile("_winb", 2, 46, 5, 5), tile("_winb", 28, 38, 4, 7), tile("_winb", 132, 42, 4, 6), tile("_winb", 154, 50, 6, 4), tile("_winb", 168, 32, 2, 8),
    stamp("_winy", 7, 51), stamp("_winy", 33, 47), stamp("_winy", 37, 59), stamp("_winy", 141, 55), stamp("_winy", 159, 59), stamp("_winy", 171, 41)),
  layer("ground",
    rect(0, 70, 180, 10, "L"), hline(0, 70, 180, "n"), hline(0, 79, 180, "n"),
    rect(0, 80, 180, 30, "N"), hline(0, 80, 180, "D"),
    rect(10, 94, 12, 2, "L"), rect(40, 94, 12, 2, "L"), rect(70, 94, 12, 2, "L"), rect(100, 94, 12, 2, "L"), rect(130, 94, 12, 2, "L"), rect(160, 94, 12, 2, "L")),
  layer("shop",
    rect(60, 28, 62, 42, "t"), rect(62, 30, 58, 40, "T"),
    rect(58, 26, 66, 3, "H"),
    pattern("_stripe", 62, 32, 58, 8),
    rect(64, 41, 54, 7, "Y"), rect(66, 42, 50, 5, "K"), text(91, 43, "PIXELDO", "Y", { align: "c" }),
    rect(66, 50, 16, 18, "B"), rect(67, 51, 14, 16, "b"), rect(100, 50, 16, 18, "B"), rect(101, 51, 14, 16, "b"),
    stamp("_mug", 69, 60), stamp("_robot", 76, 62), stamp("_robot", 103, 62), stamp("_mug", 109, 60),
    rect(85, 50, 12, 20, "H"), rect(87, 52, 8, 7, "y"), px(94, 62, "Y"),
    hline(60, 69, 62, "H")),
  layer("lamp", rect(34, 45, 2, 25, "K"), rect(30, 44, 10, 2, "K"), stamp("_lamp", 32, 39),
    rect(146, 45, 2, 25, "K"), rect(142, 44, 10, 2, "K"), stamp("_lamp", 144, 39)),
  layer("spill", { light: 1 }, rect(64, 70, 54, 10, "y"), rect(26, 70, 18, 8, "y"), rect(138, 70, 18, 8, "y")),
  glow("y", { r: 7, strength: 0.45 })
)

// ピクセルハブ（コード共有）：分岐のアイコン
sprite("logo_hub", { w: 8, h: 8 }, `
  .KK..KK.
  KppK.Kp.
  .KKK.KK.
  ..Kp.pK.
  ..KpKK..
  ..KppK..
  .KppppK.
  ..KKKK..`)


// ---------- 商品アイコン（12×12） ----------
sprite("item_robot", { w: 12, h: 12 }, `
  ...KKKK...
  ..KnnnnK..
  ..KnKKnK..
  ..KnnnnK..
  .KKKKKKKK.
  KnLLLLLLnK
  KnLrLLrLnK
  KnLLLLLLnK
  KnLLLLLLnK
  .KnnnnnnK.
  ..KK..KK..
  ..KK..KK..`)
sprite("item_mug", { w: 12, h: 12 }, `
  ..........
  ..LLLLLL..
  .LWWWWWWL.
  .LWbbbbWLK
  .LWbbbbWKK
  .LWbbbbWKK
  .LWbbbbWLK
  .LWWWWWWL.
  .LLLLLLLL.
  ..LLLLLL..
  ..........
  ..........`)
sprite("item_sign", { w: 12, h: 12 }, `
  KKKKKKKKKK
  KRRRRRRRRK
  KRWWWWWWRK
  KRWRRRRWRK
  KRWRYYRWRK
  KRWRYYRWRK
  KRWRRRRWRK
  KRWWWWWWRK
  KRRRRRRRRK
  KKKKKKKKKK
  ...KKKK...
  ...KKKK...`)
sprite("item_bottle", { w: 12, h: 12 }, `
  ....KK....
  ....Kt K..
  ...KttK...
  ...KbbK...
  ..KbbbbK..
  ..KbWbbK..
  ..KbbbbK..
  ..KbbbbK..
  ..KbbbbK..
  ..KbbbbK..
  ..KKKKKK..
  ..........`)
sprite("item_cat", { w: 12, h: 12 }, `
  .K.....K..
  KyK...KyK.
  KyyKKKyyK.
  KyWWWWWyK.
  KyWKWKWyK.
  KyWWWWWyK.
  KyWWRWWyK.
  .KyWWWyK..
  ..KyyyK...
  ..KyRyK...
  ..KyyyK...
  ..KKKKK...`)
sheet("items", ["item_*"], { pad: 1 })

// ブラウザの再読み込みアイコン（8×8、円形の矢印）
sprite("icon_reload", { w: 8, h: 8 }, `
  ..NNN.N.
  .N...NNN
  N....N.N
  N.......
  N.......
  N......N
  .N...N.N
  ..NNN.N.`)
sheet("ui", ["icon_*"], { pad: 1 })

// ---------- キャラ 16×16：シロ＝天使 / 攻撃者＝黒・赤の悪魔 ----------
// シロ（天使）：金の輪・銀の翼・白いローブ
sprite("shiro16", { w:16, h:16 }, `
  ................
  ...LL......LL...
  ..LCCL....LCCL..
  ..LCCCL..LCCCL..
  ...LCCL..LCCL...
  ....LL....LL....
  ......bWWb......
  .....bWWWWb.....
  .....WWyyWW.....
  .....WWyyWW.....
  .....bWWWWb.....
  ......bWWb......
  ................
  ....y.......y...
  .......y..y.....
  ................`)

// 悪魔（攻撃者・基本）：黒ずくめ、赤い目、角、紫の差し色
sprite("demon16", { w:16, h:16 }, `
  ..K.........K...
  ..KK.......KK...
  ...KKDDDDDDKK...
  ...KDDDDDDDDK...
  ..KDDDDDDDDDDK..
  ..KDDRRDDRRDDK..
  ..KDDrRDDRrDDK..
  ..KDDDDDDDDDDK..
  ...KDDDDDDDDK...
  ..KDPDDDDDDPDK..
  .KDDPDDDDDDPDDK.
  .KDDDDDPPDDDDDK.
  .KDDDDDDDDDDDDK.
  ..KDDDDDDDDDDK..
  ....KDK..KDK....
  ....KK....KK....`)

// 悪魔（術者タイプ）：紫を強めた変種
sprite("demon16b", { base:"demon16", swap:{ D:"P", P:"p" } })

sheet("chars16", ["shiro16","demon16","demon16b"], { pad: 1 })

// ---------- 通信図のノード（16×16）：ルーター / インターネットの雲 ----------
// ルーター：黒枠の機器＋アンテナ2本＋緑/橙のランプ
sprite("router16", { w:16, h:16 }, `
  ................
  ....K......K....
  ....K......K....
  ....K......K....
  ..KKKKKKKKKKKK..
  ..KnnnnnnnnnnK..
  ..KnLLLLLLLLnK..
  ..KngLLLLLLynK..
  ..KnLLLLLLLLnK..
  ..KnLLLLLLLLnK..
  ..KnLLLLLLLLnK..
  ..KKKKKKKKKKKK..
  ...K........K...
  ...K........K...
  ................
  ................`)

// インターネット：青い雲（白いハイライト）
sprite("cloud16", { w:16, h:16, outline:"K" },
  ellipse(8, 10, 7, 3, "b"),
  circ(5, 8, 3, "b"), circ(10, 7, 4, "b"), circ(13, 9, 2, "b"),
  hline(2, 12, 12, "B"),
  px(5, 6, "W"), px(6, 6, "W"), px(5, 7, "W"))

sheet("netnodes", ["router16","cloud16"], { pad: 1 })

// ---------- 友達（テスト役）16×16：濃い髪＋緑パーカー＋メガネ ----------
sprite("tomo16", { w:16, h:16 }, `
  ................
  .....KKKKKK.....
  ....KNNNNNNK....
  ...KNnnnnnnNK...
  ...KNSSSSSSNK...
  ...KKSSKSSKKK...
  ...KSSKSSKSSK...
  ...KsSSSSSSsK...
  ....KsSSSSsK....
  ....KKGGGGKK....
  ...KGGgggGGGK...
  ..KSKGgggGGKSK..
  ..KKKGGGGGKKK...
  ....KGGGGGGK....
  ....KNNKKNNK....
  ....KKK..KKK....`)
sheet("friend", ["tomo16"], { pad: 1 })
