# Getting Secure It

自作のECサイトを公開した店長が、21日間で攻撃を受けながら少しずつ守りを固めていく Webセキュリティ学習シミュレーションゲーム。

現在はデモ版（第1章 通信編：0〜3日目）。

## ファイル

| ファイル | 中身 |
| --- | --- |
| `index.html` | 画面・CSS・ゲームエンジン |
| `days.js` | ステージ定義（セリフ、判定、解説） |
| `sprites.js` | 24色パレットと16×16のキャラ、UIアイコン |
| `art/gsi.px.js` | 追加素材の元データ（pxl 形式） |
| `art/gsi-net.px.js` | 通信図の素材の元データ（機器・パケット・盾など） |
| `art/gsi-title.px.js` | タイトルのジオラマ（アイソメ）・お店のアイコン・ファビコンの元データ |
| `title.png` `favicon.png` `apple-touch-icon.png` | 上の元データから作った画像（下の手順で作り直す） |

## 絵を作り直す

タイトルの絵とファビコンは、pxl でビルドしてリポジトリ直下に置きます。

```sh
node ~/.claude/skills/pxl-pixel-art/bin/pxl.js build art/gsi-title.px.js
cp art/out/scenes/title.png title.png
cp art/out/sprites/favicon.png favicon.png
cp art/out/sprites/touch.png apple-touch-icon.png
```

お店のアイコン（`shop16`）を変えたら、`sprites.js` の `icons.shop` にも同じ行データを写します。

## ローカルで動かす

ビルド不要。`index.html` をブラウザで開くだけで動きます。

## 公開

`main` に push すると GitHub Actions が構文チェックのうえ GitHub Pages にデプロイします。
