// Getting Secure It — アイソメトリック通信シーン素材（名鑑と同じ24色パレット）
pal({ K: "#1a1426", W: "#f4f0e6", S: "#f2c09a", s: "#c98a68", H: "#3b2416", h: "#6b4226",
      R: "#c2373f", r: "#ff7a6b", B: "#2f4a9e", b: "#5c86d6", G: "#2f7d4a", g: "#6ccf7a",
      Y: "#e8b33a", y: "#ffe08a", P: "#5a3a8a", p: "#8f6ac9", N: "#3a3f55", n: "#7a8099",
      L: "#c3c7d6", O: "#d9742b", T: "#8a5a2b", t: "#b98a52", C: "#2fa3a8", D: "#26223a" })

// 2:1 アイソメの立方体。cx=上面の中央X, ty=上の頂点Y, hw=上面の半幅, H=高さ
function cube(c, cx, ty, hw, H, top, right, left){
  const hh = Math.round(hw/2);
  c.poly([cx,ty, cx+hw,ty+hh, cx,ty+hh*2, cx-hw,ty+hh], top);           // 上面
  c.poly([cx-hw,ty+hh, cx,ty+hh*2, cx,ty+hh*2+H, cx-hw,ty+hh+H], left); // 左面（暗）
  c.poly([cx,ty+hh*2, cx+hw,ty+hh, cx+hw,ty+hh+H, cx,ty+hh*2+H], right);// 右面（中）
  return {hh, baseL:ty+hh+H, baseR:ty+hh+H};
}

// お客さんの端末（ノートPC風の小さな箱＋画面）
sprite("iso_client", { w: 30, h: 34, outline: "K" }, (c)=>{
  cube(c, 15, 4, 11, 12, "L", "N", "D");
  c.poly([18,18, 25,14, 25,21, 18,25], "b");   // 右面の画面
  c.poly([19,18, 22,16, 22,18, 19,20], "W");   // 画面のハイライト
})

// ルーター（低い箱＋アンテナ2本）
sprite("iso_router", { w: 32, h: 30, outline: "K" }, (c)=>{
  cube(c, 15, 6, 13, 7, "C", "N", "D");
  c.line(9,6,9,0,"K",1); c.rect(8,0,2,2,"y");   // 左アンテナ
  c.line(21,5,21,-1,"K",1); c.rect(20,-1,2,2,"y"); // 右アンテナ
})

// サーバーラック（高い箱＋スロット＋LED）
sprite("iso_server", { w: 30, h: 44, outline: "K" }, (c)=>{
  cube(c, 15, 3, 12, 24, "n", "N", "D");
  // 右面にスロット線とLED
  const rx=15, ry=3+6; // 右面の上端あたり
  for(let i=0;i<4;i++){ const yy=18+i*6; c.line(15,yy,27,yy-6,"K",1); c.rect(24,yy-5,2,2, i%2? "g":"Y"); }
})

// インターネット（雲・アイソメではなく浮かぶ雲）
sprite("iso_cloud", { w: 34, h: 20, outline: "K" }, `
  .........KKKKK......
  .......KKbbbbbKK....
  ....KKKbbbbbbbbbKK..
  ..KKbbbbbbWbbbbbbbK.
  .KbbbbbbbbbbbbbbbbK.
  KbbbbbbbbbbbbbbbbbbK
  KBBBBBBBBBBBBBBBBBBK
  .KKKKKKKKKKKKKKKKKK.`)

// 攻撃者（暗い端末＋赤い画面）
sprite("iso_attacker", { w: 30, h: 34, outline: "K" }, (c)=>{
  cube(c, 15, 4, 11, 13, "D", "K", "N");
  c.poly([18,18, 25,14, 25,22, 18,26], "R");   // 右面の赤い画面
  c.poly([19,18, 22,16, 22,18, 19,20], "r");   // 画面のハイライト
})

// 床タイル（アイソメの菱形）
sprite("iso_tile", { w: 32, h: 18 }, (c)=>{
  c.poly([16,1, 31,8, 16,16, 1,8], "N");
  c.poly([16,3, 29,8, 16,14, 3,8], "D");
})

sheet("iso", ["iso_client","iso_router","iso_server","iso_cloud","iso_attacker","iso_tile"], { pad: 2 })
