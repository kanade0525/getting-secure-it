# Getting Secure It

自作のECサイトを公開した店長が、攻撃を受けながら少しずつ守りを固めていく Webセキュリティ学習シミュレーションゲーム。

全4章・24日（通信編 0〜3日目／アプリ編 4〜11日目／防壁編 12〜17日目／運用編 18〜24日目）。

## ファイル

| ファイル | 中身 |
| --- | --- |
| `index.html` | 画面・CSS・ゲームエンジン |
| `days.js` `days-ch2.js` `days-ch3.js` `days-ch4.js` | ステージ定義（セリフ、判定、解説）。章ごとに1ファイル |
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

## 日を選ぶ・デバッグ

- タイトルの「日を選ぶ」か、画面上部の日付を押すと、日の一覧が開きます。クリアした日と、その次の日を選べます。選んだ日の朝の設定（前の日までの対策が入った状態）から始まります。
- デバッグ：URL の末尾に `#debug` を付けて開くか、タイトルの「全4章・24日…」を続けて5回押すと、どの日でも選べます。「対策の場面から始める」にチェックを入れると、朝の会話と攻撃の再生を飛ばします。
- 日を足したり並べ替えたりしたら、`index.html` の保存データの版（`rev`）と読み込み時の日付のずらし方、`test/` の日付の表も合わせます。

## テスト

Playwright で実際に操作して確かめます（CI では走りません。手元で、変えた所に関係するものだけ）。

```sh
node test/smoke.cjs      <フォルダ または URL> <スクショの出力先>            # 0〜3日目を最初から通す
node test/smoke-net.cjs  <フォルダ または URL> <スクショの出力先> [日,日,…]  # 通信タブ：全24日
node test/smoke-site.cjs <フォルダ または URL> <スクショの出力先> [日,日,…]  # サイトタブ・管理タブのデモ
node test/smoke-days.cjs <フォルダ または URL> <スクショの出力先>            # 日を選ぶ・デバッグ・16〜17日目の通し
```

## 公開

`main` に push すると GitHub Actions が構文チェックのうえ GitHub Pages にデプロイします。
