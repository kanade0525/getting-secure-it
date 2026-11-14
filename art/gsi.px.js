// Getting Secure It — 追加素材（会社ロゴ）。名鑑と同じ24色パレット
pal({ K: "#1a1426", W: "#f4f0e6", S: "#f2c09a", s: "#c98a68", H: "#3b2416", h: "#6b4226",
      R: "#c2373f", r: "#ff7a6b", B: "#2f4a9e", b: "#5c86d6", G: "#2f7d4a", g: "#6ccf7a",
      Y: "#e8b33a", y: "#ffe08a", P: "#5a3a8a", p: "#8f6ac9", N: "#3a3f55", n: "#7a8099",
      L: "#c3c7d6", O: "#d9742b", T: "#8a5a2b", t: "#b98a52", C: "#2fa3a8", D: "#26223a" })

// ネームヤ（ドメイン会社）：住所札。金色の札に黒い穴と紐
sprite("logo_registrar", { w: 8, h: 8 }, `
  ..KKKK..
  .KBBBBK.
  KBbKKbBK
  KBbbbbBK
  KBBBBBBK
  KBBBBBBK
  .KBBBBK.
  ..KKKK..`)

// ピクセルクラウド（サーバー）：雲
sprite("logo_cloud", { w: 8, h: 8 }, `
  ...KK...
  ..KYYK..
  .KYWYYK.
  KYYYYYYK
  KYYYYYYK
  KOOOOOOK
  .KKKKKK.
  ........`)

// 認証局：印章（リボンつき）
sprite("logo_ca", { w: 8, h: 8 }, `
  ..KKKK..
  .KYYYYK.
  KYBBBBYK
  KYBWWBYK
  KYBBBBYK
  .KYYYYK.
  .KBKKBK.
  KBK..KBK`)

sheet("logos", ["logo_*"], { pad: 1 })

// タイトル画面のジオラマと、お店のアイコン・ファビコンは art/gsi-title.px.js

// ピクセルハブ（コード共有）：分岐のアイコン
sprite("logo_hub", { w: 8, h: 8 }, `
  .KK..KK.
  KWWK.KW.
  .KKK.KK.
  ..KW.WK.
  ..KWKK..
  ..KWWK..
  .KWWWWK.
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
// 古い銀の鈴（非売品）：シロが宿っている。結び目はシロの翼の色、舌（ぜつ）はシロの芯の色
sprite("item_bell", { w: 10, h: 12 }, `
  ...CKKC...
  ..CCKKCC..
  ...KLLK...
  ..KLWWLK..
  ..KLWLLK..
  .KLWLLLLK.
  .KLLLLLLK.
  .KLLLLLnK.
  KLLLLLLnnK
  KKKKKKKKKK
  ....yy....
  ....yy....`)
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

// シロの黒い姿（エンドロールのあとにだけ出る）：同じ形のまま、体は黒、目は赤、翼はとがる
sprite("kuro16", { w:16, h:16 }, `
  ..P..........P..
  ..PP........PP..
  ..PDP......PDP..
  ..PDDP....PDDP..
  ...PDDP..PDDP...
  ....PP....PP....
  ......NKKN......
  .....NKKKKN.....
  .....KrKKrK.....
  .....KKKKKK.....
  .....NKKKKN.....
  ......NKKN......
  ................
  ....R.......R...
  .......R..R.....
  ................`)

sheet("chars16", ["shiro16","kuro16","demon16","demon16b"], { pad: 1 })

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

// ---------- セキュリティ研究者 16×16：白衣＋メガネ＋グレー髪 ----------
sprite("kenkyu16", { w:16, h:16 }, `
  ................
  .....KKKKKK.....
  ....KLLLLLLK....
  ...KLnnnnnnLK...
  ...KLSSSSSSLK...
  ...KKSSKSSKKK...
  ...KSSKSSKSSK...
  ...KsSSSSSSsK...
  ....KsSSSSsK....
  ....KKWWWWKK....
  ...KWWLbLWWWK...
  ..KSKWLbLWWKSK..
  ..KKKWWbWWKKK...
  ....KWWWWWWK....
  ....KNNKKNNK....
  ....KKK..KKK....`)
sheet("researcher", ["kenkyu16"], { pad: 1 })

// ---------- 監視アイコン 8×8：目（ウォッチ） ----------
sprite("eye8", { w:8, h:8 }, `
  ........
  ..KKKK..
  .KWWWWK.
  KWKbbKWK
  KWKbbKWK
  .KWWWWK.
  ..KKKK..
  ........`)
sheet("watch", ["eye8"], { pad: 1 })
