/* Getting Secure It — 第2章 アプリ編（4〜11日目）
   学習用の防御シミュレーション。各日は「症状→原因確認→修正案を選ぶ→もう一度確かめる→解説」。
   データの形：
     fixes:[{key,file,title,opts:[{v,l,code,note,bad?}]}]  ピクセルハブで選ぶ修正案（c.code[key]）
     app:[{key,l,note,type:'sw'|'sel',opts?}]              ピクセルクラウド「アプリ設定」（c.app[key]）
     tasks:[{id,l,kind}]                                   サイトタブ「お店の対応」（c.tasks[id]）
     check(c)→{ok,lines,why,blocked,todo,voices}
   verify の流れは第1章と同じ（通信タブで再生→ok ならクリア）。*/
(function(){
const G=window.GSI_DAYS,SHIRO=G.SHIRO,YOU=G.YOU;
const code=(c,k)=>(c.code||{})[k];
const app=(c,k)=>(c.app||{})[k];
const task=(c,k)=>!!(c.tasks||{})[k];

const D={
/* ===== 4日目 SQLインジェクション ===== */
4:{
  title:'4日目　検索窓からの侵入',attacker:'sqli',svc:'hub',
  start:[{who:SHIRO,t:'通信は守れた。でも今日は、お店の「中身」の話になりそうだ'}],
  voices:[
    {who:'たなか',t:'商品を検索したら英語のエラーが出ました。「SQL syntax error」って……'},
    {who:'匿名の通報',mail:true,t:'貴店の会員メールアドレスの一覧が、掲示板に貼られています。'},
    {who:'やまだ',t:'私のアドレスが流出したって本当ですか？'}
  ],
  alert:[
    {who:SHIRO,t:'検索した言葉が、そのままデータベースへの命令として扱われてる'},
    {who:SHIRO,t:'サイトタブの検索窓で、試しに攻撃者と同じ入力をしてみて。ほら、会員の一覧が出てきちゃう'},
    {who:SHIRO,t:'「管理」タブの「ピクセルハブ」で、検索の扱い方を直そう'}
  ],
  demo:{
    hint:'攻撃者はこう入力したらしい。試してみよう。',
    payload:"' OR '1'='1",
    products:[{name:'ブリキのロボット',price:'¥1,800'},{name:'レトロなマグカップ',price:'¥980'},{name:'ホーローの看板',price:'¥3,200'},{name:'すりガラスのびん',price:'¥600'},{name:'まねき猫の貯金箱',price:'¥1,200'}],
    members:[{name:'たなか','mail':'tanaka@****.jp'},{name:'すずき','mail':'suzuki@****.com'},{name:'やまだ','mail':'yamada@****.jp'},{name:'（ほか約1,200件）','mail':'………'}]
  },
  fixes:[{key:'search',title:'検索の扱い方',opts:[
    {v:'strip',l:'入力から記号を取り除く',note:'引用符などを消すだけ。別の書き方で抜けられる',bad:true},
    {v:'reject',l:'記号が入っていたら検索しない',note:'安全だが、「M&M」のような商品名も探せなくなる'},
    {v:'param',l:'入力は「検索する言葉」として扱う',note:'入力が何であっても命令にはせず、ただの検索語として渡す。これが基本'}
  ]}],
  tasks:[
    {id:'notice',l:'漏えいのお知らせを出す',kind:'notice'},
    {id:'report',l:'個人情報保護委員会に報告する',kind:'report'}
  ],
  success:()=>[{who:SHIRO,t:'入力は「値」として扱われて、命令にならなくなった。4日目クリア！'}],
  check(c){
    const f=code(c,'search');
    if(f==='raw'||!f)return {ok:false,pkt:"' OR 1=1 --",why:'入力がまだ命令文に差し込まれている。プレースホルダを使おう',lines:[
      {k:'info',t:'検索窓に命令文を混ぜて送信'},
      {k:'bad',t:'会員テーブルの中身がそのまま応答に出た'},
      {k:'bad',t:'メールアドレスの一覧を抜き取られた'}]};
    if(f==='strip')return {ok:false,pkt:'別の書き方',why:'引用符を消しただけでは、引用符を使わない書き方で抜けられる。入力を「値」として渡そう',lines:[
      {k:'info',t:'引用符を使わない書き方で送信'},
      {k:'ok',t:'最初の引用符は消えた'},
      {k:'bad',t:'残った書き方で命令が通ってしまった'}]};
    if(f==='reject')return {ok:false,blocked:true,why:'記号を全部はじくと、「&」や「-」を含む商品名で検索できない。入力は受け付けたまま「値」として渡そう',
      voices:[{who:'すずき',t:'「M&M」で検索したら「記号は使えません」と出ます。商品名なのに……'}],
      lines:[{k:'info',t:'命令文を混ぜた検索は拒否された'},{k:'ok',t:'攻撃は失敗'},{k:'bad',t:'記号入りの商品名で検索できないお客さんが続出'}]};
    // param: 正解だが後始末が残る
    if(!task(c,'notice')||!task(c,'report'))return {ok:false,todo:true,why:'攻撃は防げた。でも、もう漏れてしまった分がある。サイトタブの「お店の対応」で、お知らせと報告をしよう',lines:[
      {k:'ok',t:'検索窓からはもう抜けない'},
      {k:'bad',t:'すでに流出した会員情報への対応が残っている'}]};
    return {ok:true,lines:[
      {k:'info',t:'検索窓に命令文を混ぜて送信'},
      {k:'ok',t:'入力は「値」として扱われ、命令にならない'},
      {k:'ok',t:'お知らせと報告も済んだ'}]};
  },
  learn:{title:'SQLインジェクションとプレースホルダ',
    points:['入力をそのまま命令文につなぐと、入力が命令として実行されてしまう','プレースホルダ（?）を使うと、命令文の形は固定され、入力は必ず「値」として扱われる','引用符を消す・記号を拒否する、といった入力側の小細工は抜け道が残りやすい','個人情報が漏れたら、お客さんへのお知らせと、個人情報保護委員会への報告が必要'],
    real:'多くの言語やフレームワークに、プレースホルダ（プリペアドステートメント）やORMが用意されています。表示名やテーブル名など「値」にできない部分は、決めた候補から選ぶ形にします。'}
},
/* ===== 5日目 パスワードの保存 ===== */
5:{
  title:'5日目　パスワードの守り方',attacker:'reuse',svc:'hub',
  start:[{who:SHIRO,t:'昨日の流出、会員のパスワードも一緒に保存されてたよね。どう保存してた？'}],
  voices:[
    {who:'たなか',t:'別のサイトと同じパスワードにしてたら、そっちにも勝手にログインされました……'},
    {who:'すずき',t:'お店の会員情報、パスワードは大丈夫だったんですか？'}
  ],
  alert:[
    {who:SHIRO,t:'パスワードがそのまま読める形で保存されてる。流出したら即アウトだ'},
    {who:SHIRO,t:'パスワードは「元に戻せない形」にして保存するのが基本。それでも使い回しは危ない'},
    {who:SHIRO,t:'ピクセルハブで保存方法を直して、会員に再設定の案内も出そう'}
  ],
  fixes:[{key:'hash',file:'auth.js',title:'パスワードの保存',opts:[
    {v:'plain',l:'そのまま保存',code:'save(password)',note:'読める形のまま。流出したら全員分が即バレる',bad:true},
    {v:'encrypt',l:'暗号化して保存',code:'save(encrypt(password, key))',note:'鍵があれば元に戻せる。鍵も一緒に漏れたら無意味',bad:true},
    {v:'md5',l:'MD5でハッシュ化',code:'save(md5(password))',note:'古くて速すぎる。総当たりに弱い',bad:true},
    {v:'sha',l:'SHA-256（ソルトなし）',code:'save(sha256(password))',note:'同じパスワードが同じ値になり、一覧表で逆引きされる',bad:true},
    {v:'bcrypt',l:'bcrypt（標準の重さ）',code:'save(bcrypt(password, cost=12))',note:'一人ずつ違う値になり、わざと時間がかかる'}
  ]}],
  app:[{key:'forceChange',l:'90日ごとにパスワード強制変更',note:'今は推奨されていない。かえって弱いパスワードを招く',type:'sw'}],
  tasks:[{id:'resetGuide',l:'会員にパスワード再設定を案内する',kind:'notice'}],
  success:()=>[{who:SHIRO,t:'保存方法も案内もこれで安心だ。5日目クリア！'}],
  check(c){
    const f=code(c,'hash');
    if(!f||f==='plain'||f==='encrypt'||f==='md5'||f==='sha'){
      const why=f==='encrypt'?'暗号化は鍵があれば元に戻せる。鍵も一緒に漏れることが多い。元に戻せないハッシュにしよう'
        :f==='md5'?'MD5は速すぎて総当たりに弱い。わざと時間のかかる方式にしよう'
        :f==='sha'?'ソルトなしのSHA-256は、同じパスワードが同じ値になり一覧表で逆引きされる。bcryptなどを使おう'
        :'読める形のままだと、流出した瞬間に全員分がバレる。元に戻せない形にしよう';
      return {ok:false,why,lines:[{k:'info',t:'流出したパスワードの保存データを調べる'},{k:'bad',t:'短時間で中身を復元された'}]};
    }
    if(app(c,'forceChange'))return {ok:false,blocked:true,why:'90日ごとの強制変更は、かえって「Password1→Password2」のような弱い変更を招く。今は推奨されていない。オフにしよう',
      voices:[{who:'やまだ',t:'3か月ごとに変更を求められて、もう思い出せません……'}],
      lines:[{k:'ok',t:'保存方法は安全になった'},{k:'bad',t:'頻繁な変更で、お客さんが弱いパスワードや使い回しに走る'}]};
    if(!task(c,'resetGuide'))return {ok:false,todo:true,why:'保存方法は直った。でも、すでに漏れたパスワードは変えてもらう必要がある。再設定の案内を出そう',lines:[
      {k:'ok',t:'これからの保存は安全'},{k:'bad',t:'古いパスワードのままの会員が残っている'}]};
    return {ok:true,lines:[{k:'info',t:'万一また流出しても'},{k:'ok',t:'一人ずつ違う重い値で、簡単には戻せない'},{k:'ok',t:'会員の再設定も案内済み'}]};
  },
  learn:{title:'パスワードの保存とハッシュ',
    points:['パスワードは暗号化ではなくハッシュで保存する。暗号化は鍵で元に戻せてしまう','bcrypt・scrypt・Argon2 など、わざと計算に時間がかかる方式を使う','一人ずつ違う値（ソルト）を混ぜ、同じパスワードでも違う保存値にする','定期的な強制変更はもう推奨されない。流出時や不審時にだけ変更を求める'],
    real:'多くのフレームワークに bcrypt や Argon2 の関数があります。二段階認証を足すと、パスワードが漏れても侵入を防ぎやすくなります。'}
},
/* ===== 6日目 価格改ざん ===== */
6:{
  title:'6日目　1円の買いもの',attacker:'ichien',svc:'hub',
  start:[{who:SHIRO,t:'売上の記録を見て。1円で売れてる注文が並んでる……'}],
  voices:[
    {who:'たなか',t:'あの高い家具、1円で買えたって友だちが自慢してました。え、ずるくないですか？'},
    {who:'経理担当',mail:true,t:'数量がマイナスの注文があり、残高がおかしくなっています。'}
  ],
  alert:[
    {who:SHIRO,t:'買うときに送られてくる「値段」を、お客さん側で書き換えられてる'},
    {who:SHIRO,t:'画面から送られた金額をそのまま信じているのが原因だ'},
    {who:SHIRO,t:'ピクセルハブで、金額はサーバー側で計算し直すように直そう'}
  ],
  fixes:[{key:'price',file:'checkout.js',title:'会計の処理',opts:[
    {v:'trust',l:'送られた金額を使う',code:'total = req.price * req.qty',note:'画面から来た金額をそのまま使う',bad:true},
    {v:'noedit',l:'画面で金額を編集できなくする',code:'input.readOnly = true',note:'画面上の対策だけ。送信データは書き換えられる',bad:true},
    {v:'jscheck',l:'画面側(JS)で検算する',code:'if (price !== shown) alert()',note:'お客さんの端末の中の確認なので回避できる',bad:true},
    {v:'server',l:'サーバーで計算し直す',code:'total = DB.price(id) * clamp(qty,1,99)',note:'値段は商品台帳から取り、数量も範囲を確認'}
  ]}],
  tasks:[{id:'cancel',l:'1円注文・マイナス注文を取り消して連絡',kind:'notice'}],
  success:()=>[{who:SHIRO,t:'金額も数量もお店側で決められるようになった。6日目クリア！'}],
  check(c){
    const f=code(c,'price');
    if(!f||f==='trust'||f==='noedit'||f==='jscheck'){
      const why=f==='noedit'?'画面で編集できなくしても、送信データは書き換えられる。金額はサーバーで計算し直そう'
        :f==='jscheck'?'画面側(JS)の確認は、お客さんの端末の中なので回避できる。サーバーで計算し直そう'
        :'画面から送られた金額をそのまま信じている。サーバーで計算し直そう';
      return {ok:false,pkt:'price=1',why,lines:[{k:'info',t:'送信データの金額を書き換えて注文'},{k:'bad',t:'1円で注文が通った'},{k:'bad',t:'数量をマイナスにした注文も通った'}]};
    }
    if(!task(c,'cancel'))return {ok:false,todo:true,why:'これからの注文は正しくなった。すでに通った1円注文とマイナス注文を、取り消してお客さんに連絡しよう',lines:[
      {k:'ok',t:'新しい注文は正しい金額になった'},{k:'bad',t:'通ってしまった不正な注文が残っている'}]};
    return {ok:true,lines:[{k:'info',t:'金額を書き換えて注文'},{k:'ok',t:'サーバーが商品台帳の値段で計算し直した'},{k:'ok',t:'数量も範囲内かを確認した'}]};
  },
  learn:{title:'値段はサーバーで決める',
    points:['画面から送られてくる値（金額・数量・割引）は、お客さん側で書き換えられる','金額は必ずサーバー側で、商品台帳の値段から計算し直す','数量やポイントなどは、上限・下限の範囲を確認する','画面(JS)での確認は使い勝手のためで、安全の根拠にはしない'],
    real:'「クライアントから来た値は信用しない」が原則です。クーポンや送料も同じで、サーバー側で再計算・再確認します。'}
},
/* ===== 7日目 XSS ===== */
7:{
  title:'7日目　レビュー欄の落書き',attacker:'xss',svc:'hub',
  start:[{who:SHIRO,t:'レビュー欄を開いたお客さんから、変な動きがするって声が来てる'}],
  voices:[
    {who:'すずき',t:'レビューを見たら、知らないサイトに飛ばされました。'},
    {who:'たなか',t:'レビュー欄を開いただけで、ログインし直しになりました。怖いです。'}
  ],
  alert:[
    {who:SHIRO,t:'レビューに書かれた文字が、そのまま画面の部品として動いてる'},
    {who:SHIRO,t:'投稿の中身を「表示する文字」ではなく「画面の命令」として扱ってるんだ。XSSっていう'},
    {who:SHIRO,t:'ピクセルハブで、表示するときに文字を無害化しよう'}
  ],
  fixes:[{key:'review',file:'review.js',title:'レビューの表示',opts:[
    {v:'raw',l:'そのまま表示',code:'el.innerHTML = review',note:'投稿が画面の部品として動いてしまう',bad:true},
    {v:'stripscript',l:'script だけ取り除く',code:'review.replace(/<script>/,"")',note:'他の書き方でいくらでも動かせる',bad:true},
    {v:'remove',l:'レビュー機能をやめる',code:'// レビュー欄を削除',note:'攻撃は消えるが、お店の魅力も消える',bad:true},
    {v:'escape',l:'表示時に無害化する',code:'el.textContent = review',note:'記号を「ただの文字」として表示する'}
  ]}],
  tasks:[
    {id:'delete',l:'悪意のあるレビューを削除する',kind:'notice'},
    {id:'resetGuide',l:'影響を受けた会員に再設定を案内',kind:'notice'}
  ],
  success:()=>[{who:SHIRO,t:'投稿はただの文字として表示されるようになった。7日目クリア！'}],
  check(c){
    const f=code(c,'review');
    if(!f||f==='raw'||f==='stripscript'){
      const why=f==='stripscript'?'script を消しても、画像やリンクなど別の書き方で動かせる。表示時に全体を無害化しよう':'投稿が画面の部品として動いている。表示するときに無害化しよう';
      return {ok:false,pkt:'<img …>',why,lines:[{k:'info',t:'画面を動かす文字をレビューに投稿'},{k:'bad',t:'開いた人の画面で勝手に動いた'},{k:'bad',t:'別サイトへ飛ばされ、ログイン状態を盗まれた'}]};
    }
    if(f==='remove')return {ok:false,blocked:true,why:'レビューをやめれば落書きは消えるが、お客さんが選ぶ手がかりも消える。表示時の無害化で両立させよう',
      voices:[{who:'やまだ',t:'レビューを見て買うか決めてたのに、なくなって困ります。'}],
      lines:[{k:'ok',t:'落書きは表示されなくなった'},{k:'bad',t:'お客さんがレビューを読めなくなった'}]};
    if(!task(c,'delete')||!task(c,'resetGuide'))return {ok:false,todo:true,why:'これからの表示は安全。すでに投稿された落書きを消して、影響を受けた会員に再設定を案内しよう',lines:[
      {k:'ok',t:'新しい投稿はただの文字として表示'},{k:'bad',t:'残っている落書きと、盗まれたログインへの対応が必要'}]};
    return {ok:true,lines:[{k:'info',t:'画面を動かす文字を投稿'},{k:'ok',t:'記号はただの文字として表示された'},{k:'ok',t:'落書き削除と再設定案内も済んだ'}]};
  },
  learn:{title:'XSSと出力の無害化',
    points:['投稿された文字をそのまま画面に入れると、画面の命令として動いてしまう','表示するときに記号を「ただの文字」に置き換える（エスケープ）','script を消すだけ、は抜け道だらけ。全体を無害化する','リンク先の javascript: なども危ない。許すURLの形を決める'],
    real:'多くのテンプレートエンジンは既定でエスケープします。どうしてもHTMLを許す場合は、安全なものだけ通すサニタイザを使い、CSP（コンテンツの読み込み元の制限）も重ねます。'}
},
/* ===== 8日目 セッション ===== */
8:{
  title:'8日目　ログイン状態の持ち方',attacker:'session',svc:'cloud',sub:'app',
  start:[{who:SHIRO,t:'ログインの仕組みそのものを見てみよう。今は状態をどう持ってる？'}],
  voices:[
    {who:'たなか',t:'共用パソコンで買い物したら、次の人に私のアカウントが使われてました。'},
    {who:'すずき',t:'URLを友だちに送っただけで、私としてログインされちゃいました。'}
  ],
  alert:[
    {who:SHIRO,t:'ログイン状態の合言葉が、URLに入って持ち歩かれてる'},
    {who:SHIRO,t:'URLは共有や履歴に残る。合言葉はCookieにしてURLから外そう'},
    {who:SHIRO,t:'ピクセルクラウドの「アプリ設定」で、Cookieの持ち方を整えよう'}
  ],
  app:[
    {key:'store',l:'ログイン状態の保存先',type:'sel',opts:[['url','URLに付ける'],['cookie','Cookie']]},
    {key:'secure',l:'Secure（HTTPSのときだけ送る）',type:'sw'},
    {key:'httponly',l:'HttpOnly（スクリプトから読めない）',type:'sw'},
    {key:'samesite',l:'SameSite',type:'sel',opts:[['none','なし'],['lax','Lax'],['strict','Strict']]},
    {key:'expiry',l:'有効期限',type:'sel',opts:[['never','無期限'],['10min','10分'],['2weeks','2週間']]},
    {key:'logout',l:'パスワード変更時に他の端末からログアウト',type:'sw'}
  ],
  tasks:[{id:'invalidate',l:'全員のログインをいったん無効化する',kind:'notice'}],
  success:()=>[{who:SHIRO,t:'合言葉はCookieに入り、正しく守られるようになった。8日目クリア！'}],
  check(c){
    const a=c.app||{};
    if(a.store!=='cookie')return {ok:false,pkt:'sid=…（URL内）',why:'合言葉がURLに入っている。URLは共有や履歴に残る。Cookieに移そう',lines:[
      {k:'info',t:'URLをコピーして別の人に渡す'},{k:'bad',t:'URL内の合言葉でそのままログインできた'}]};
    if(!a.secure||!a.httponly||!a.samesite||a.samesite==='none'||!a.expiry||a.expiry==='never'){
      const why=!a.secure?'Secure がないと、HTTPの隙に合言葉が漏れる。オンにしよう'
        :!a.httponly?'HttpOnly がないと、スクリプトから合言葉を読まれる。オンにしよう'
        :(!a.samesite||a.samesite==='none')?'SameSite がないと、別サイトからの操作で合言葉が付いて送られる。Lax にしよう'
        :'有効期限がないと、盗まれた合言葉がいつまでも使える。期限を決めよう';
      return {ok:false,pkt:'session=…',why,lines:[{k:'info',t:'Cookieの合言葉を狙う'},{k:'bad',t:'守りが足りず、合言葉を使われた'}]};
    }
    if(a.samesite==='strict'||a.expiry==='10min'){
      const why=a.samesite==='strict'?'SameSite=Strict だと、他サイトのリンクから来たお客さんが毎回ログアウト状態になる。Lax にしよう':'10分で切れると、少し席を外しただけでログインし直しになる。2週間くらいにしよう';
      return {ok:false,blocked:true,why,voices:[{who:'やまだ',t:a.samesite==='strict'?'メールのリンクから開くと、毎回ログインし直しです。':'少し離れただけでログアウトされて、買い物が進みません。'}],
        lines:[{k:'ok',t:'乗っ取りは防げた'},{k:'bad',t:'お客さんが頻繁にログインし直しになった'}]};
    }
    if(!c.app.logout||!task(c,'invalidate'))return {ok:false,todo:true,why:'持ち方は整った。すでに出回った合言葉を断つため、全員のログインを一度無効化し、変更時のログアウトも入れよう',lines:[
      {k:'ok',t:'これからのCookieは安全'},{k:'bad',t:'すでに盗まれた合言葉がまだ生きている'}]};
    return {ok:true,lines:[{k:'info',t:'URLやスクリプトから合言葉を狙う'},{k:'ok',t:'合言葉はCookie内で保護され、取り出せない'},{k:'ok',t:'古い合言葉も無効化済み'}]};
  },
  learn:{title:'セッションCookieの属性',
    points:['ログイン状態の合言葉はURLに載せない。URLは共有・履歴・紹介元に残る','Cookieに Secure（HTTPS限定）・HttpOnly（スクリプト不可）を付ける','SameSite=Lax で、他サイトからの勝手な送信を防ぐ。Strict は使い勝手が落ちる','有効期限を決め、パスワード変更時は他端末からログアウトさせる'],
    real:'多くのフレームワークは、設定ひとつでこれらの属性を付けられます。重要操作の前に再認証を求める方法もあります。'}
},
/* ===== 9日目 CSRF ===== */
9:{
  title:'9日目　気づかぬうちの注文',attacker:'csrf',svc:'hub',
  start:[{who:SHIRO,t:'ログインは守れた。でも今日は「ログインしている人に、勝手に操作させる」話だ'}],
  voices:[
    {who:'たなか',t:'別のサイトを見ていただけなのに、こちらのお店で注文が入っていました。'},
    {who:'すずき',t:'届け先が知らない住所に変わっていました。注文した覚えがないのに……'}
  ],
  alert:[
    {who:SHIRO,t:'ログイン中のお客さんが別サイトを開いた瞬間、裏でこのお店に注文が送られてる'},
    {who:SHIRO,t:'お店は「ログイン済みの人からの操作」だと信じて受けてしまう。CSRFっていう手口だ'},
    {who:SHIRO,t:'ピクセルハブで、その操作がこのお店の画面から来たかを確かめよう'}
  ],
  fixes:[{key:'csrf',file:'order.js',title:'注文の受け付け',opts:[
    {v:'raw',l:'今のまま受ける',code:'createOrder(req)',note:'ログイン済みなら無条件で受ける',bad:true},
    {v:'referer',l:'参照元を見る（なければ通す）',code:'if (ref && ref!==us) reject()',note:'参照元は隠せる・空にできるので抜けられる',bad:true},
    {v:'post',l:'GETをやめてPOSTにする',code:'router.post("/order", …)',note:'リンクでは起きにくくなるが、フォーム送信では起きる',bad:true},
    {v:'token',l:'CSRFトークンを使う',code:'if (req.token !== session.token) reject()',note:'お店の画面にだけ渡す合言葉を確認する'}
  ]}],
  tasks:[
    {id:'cancel',l:'身に覚えのない注文を取り消す',kind:'notice'},
    {id:'restore',l:'変更された届け先を元に戻す',kind:'notice'}
  ],
  success:()=>[{who:SHIRO,t:'このお店の画面から来た操作だけを受けるようになった。9日目クリア！'}],
  check(c){
    const f=code(c,'csrf');
    if(!f||f==='raw'||f==='referer'||f==='post'){
      const why=f==='referer'?'参照元は空にもできるし偽れる。「なければ通す」だと素通りする。トークンで確かめよう'
        :f==='post'?'POSTにしても、別サイトの隠しフォームから送れる。トークンで確かめよう'
        :'ログイン済みなら無条件で受けている。お店の画面から来たかをトークンで確かめよう';
      return {ok:false,pkt:'裏からの注文',why,lines:[{k:'info',t:'別サイトから、ログイン中の人の名前で注文を送る'},{k:'bad',t:'本人の操作として受理された'},{k:'bad',t:'届け先も書き換えられた'}]};
    }
    if(!task(c,'cancel')||!task(c,'restore'))return {ok:false,todo:true,why:'これからは防げる。すでに入った不正な注文を取り消し、変えられた届け先を戻そう',lines:[
      {k:'ok',t:'新しい注文はトークンで確認される'},{k:'bad',t:'すでに入った不正注文と、変更された届け先が残っている'}]};
    return {ok:true,lines:[{k:'info',t:'別サイトから勝手な注文を送る'},{k:'ok',t:'お店の合言葉(トークン)がないので拒否'},{k:'ok',t:'不正注文の取り消しと住所の復旧も済んだ'}]};
  },
  learn:{title:'CSRFとトークン',
    points:['ログイン中の人は、別サイトからでも「本人の操作」として送られてしまう','お店の画面にだけ渡す合言葉(CSRFトークン)を、操作のたびに確認する','参照元チェックだけ、POST化だけでは抜け道が残る','SameSite=Lax のCookieも合わせると守りが厚くなる'],
    real:'多くのフレームワークにCSRF対策が組み込まれています。SameSite Cookie と、重要操作での再認証も有効です。'}
},
/* ===== 10日目 IDOR ===== */
10:{
  title:'10日目　他人の注文がのぞける',attacker:'idor',svc:'hub',
  start:[{who:SHIRO,t:'注文の確認ページ、URLの番号を変えると何が出る？'}],
  voices:[
    {who:'すずき',t:'注文番号を1つ増やしたら、他の人の注文と住所が見えました。'},
    {who:'匿名の通報',mail:true,t:'番号を変えるだけで、他人の購入履歴が丸見えです。'}
  ],
  alert:[
    {who:SHIRO,t:'注文ページが、番号さえ合えば誰のものでも見せてしまってる'},
    {who:SHIRO,t:'ログインの確認はしても、「その人のものか」を確かめていないんだ。IDORっていう'},
    {who:SHIRO,t:'ピクセルハブで、本人の注文かをサーバーで確認しよう'}
  ],
  fixes:[{key:'access',file:'order.js',title:'注文ページの表示',opts:[
    {v:'raw',l:'番号で表示',code:'show(Order.find(id))',note:'番号が合えば誰のでも見せる',bad:true},
    {v:'random',l:'番号を推測しにくくする',code:'id = randomUUID()',note:'当てにくくなるだけ。漏れたURLからは見える',bad:true},
    {v:'login',l:'ログイン済みかだけ確認',code:'if (!user) reject()',note:'ログインしていれば他人のも見える',bad:true},
    {v:'owner',l:'本人の注文か確認',code:'if (order.userId !== user.id) reject()',note:'持ち主とログイン中の人が一致するか'}
  ]}],
  tasks:[
    {id:'api',l:'裏側のAPIにも同じ確認を入れる',kind:'report'},
    {id:'notice',l:'のぞかれた可能性をお知らせする',kind:'notice'}
  ],
  success:()=>[{who:SHIRO,t:'自分の注文しか見えなくなった。10日目クリア！'}],
  check(c){
    const f=code(c,'access');
    if(!f||f==='raw'||f==='random'||f==='login'){
      const why=f==='random'?'推測しにくくしても、URLが漏れれば見える。本人の注文かを確認しよう'
        :f==='login'?'ログイン確認だけだと、ログインした別人から他人の注文が見える。持ち主かを確認しよう'
        :'番号が合えば誰のでも見せている。本人の注文かをサーバーで確認しよう';
      return {ok:false,pkt:'order=1002',why,lines:[{k:'info',t:'注文番号を1ずつ変えて開く'},{k:'bad',t:'他人の注文と住所が表示された'}]};
    }
    if(!task(c,'api')||!task(c,'notice'))return {ok:false,todo:true,why:'画面は直った。でも裏側のAPIにも同じ穴がある。そちらにも確認を入れて、のぞかれた可能性をお知らせしよう',lines:[
      {k:'ok',t:'画面は本人の注文だけ表示'},{k:'bad',t:'裏のAPIがまだ番号だけで答えている'}]};
    return {ok:true,lines:[{k:'info',t:'番号を変えて他人の注文を開こうとする'},{k:'ok',t:'持ち主でないので拒否された'},{k:'ok',t:'裏のAPIも同じ確認。お知らせも済んだ'}]};
  },
  learn:{title:'IDOR（他人のデータへのアクセス）',
    points:['番号やIDを変えるだけで他人のデータが見える、よくある穴','ログインの確認と、「そのデータの持ち主か」の確認は別物','番号を推測しにくくするのは補助。持ち主確認が本筋','画面だけでなく、裏側のAPIにも同じ確認を入れる'],
    real:'アクセス制御は一覧・詳細・編集・削除・APIのすべてで確認します。「誰が」「何に」アクセスしてよいかを一か所にまとめると漏れにくくなります。'}
},
/* ===== 11日目 クーポン多重利用 ===== */
11:{
  title:'11日目　クーポン、何度でも',attacker:'coupon',svc:'hub',
  start:[{who:SHIRO,t:'クーポンの利用記録、同じ番号が何回も使われてるよ'}],
  voices:[
    {who:'経理担当',mail:true,t:'1回限りのクーポンが、同一番号で何十回も使われています。'},
    {who:'たなか',t:'クーポン、連打したら何回も効いちゃいました。いいんですか…？'}
  ],
  alert:[
    {who:SHIRO,t:'「使ったか確認」と「使用済みにする」の間に、連打で割り込まれてる'},
    {who:SHIRO,t:'確認と記録が別々だと、ほぼ同時の注文がすり抜ける。この隙を狙われてるんだ'},
    {who:SHIRO,t:'ピクセルハブで、確認と記録を1回の更新にまとめよう'}
  ],
  fixes:[{key:'coupon',file:'coupon.js',title:'クーポンの適用',opts:[
    {v:'raw',l:'確認してから記録',code:'if (unused(id)) { use(); mark(id) }',note:'確認と記録の間に連打で割り込まれる',bad:true},
    {v:'button',l:'ボタンの連打を止める',code:'button.disabled = true',note:'画面だけの対策。直接送られたら無力',bad:true},
    {v:'confirm',l:'確認を2回に増やす',code:'if (unused(id) && unused(id))',note:'回数を増やしても、隙間は残る',bad:true},
    {v:'atomic',l:'1回の更新で確認と記録',code:'UPDATE coupon SET used=1 WHERE id=? AND used=0',note:'更新できた1件だけが成功。同時でも1回'}
  ]}],
  tasks:[{id:'cancel',l:'多重利用の注文を取り消す',kind:'notice'}],
  success:()=>[{who:SHIRO,t:'同時に来ても、クーポンは1回しか効かなくなった。11日目クリア！'},{who:SHIRO,t:'……ところで、やけに新しいアカウントが増えてるね。1000個近い。明日、見てみよう'}],
  check(c){
    const f=code(c,'coupon');
    if(!f||f==='raw'||f==='button'||f==='confirm'){
      const why=f==='button'?'ボタンの連打防止は画面だけの対策。注文を直接送られたらすり抜ける。1回の更新にまとめよう'
        :f==='confirm'?'確認を増やしても、確認と記録の間の隙間は残る。1回の更新にまとめよう'
        :'確認と記録が別々なので、ほぼ同時の注文がすり抜ける。1回の更新にまとめよう';
      return {ok:false,pkt:'同時に大量送信',why,lines:[{k:'info',t:'同じクーポンで、ほぼ同時に大量注文'},{k:'bad',t:'確認と記録の隙間で何回も適用された'}]};
    }
    if(!task(c,'cancel'))return {ok:false,todo:true,why:'これからは1回だけ。すでに多重利用された注文を取り消そう',lines:[
      {k:'ok',t:'新しい適用は1回だけ'},{k:'bad',t:'多重利用された注文が残っている'}]};
    return {ok:true,lines:[{k:'info',t:'同じクーポンで同時に大量注文'},{k:'ok',t:'更新できたのは1件だけ。残りは失敗'},{k:'ok',t:'多重利用の取り消しも済んだ'}]};
  },
  learn:{title:'競合状態とアトミックな更新',
    points:['「確認してから記録」の二段構えは、ほぼ同時の処理に割り込まれる','確認と記録を1回の更新にまとめると、成功するのは1件だけになる','画面側の連打防止は使い勝手のためで、安全の根拠にはしない','在庫・残高・ポイントなど、数を扱う処理は同じ注意が要る'],
    real:'データベースの条件つき更新や一意制約、トランザクションを使います。1回しか起きてはいけない処理は、重複を記録側で弾く設計にします。'}
}
};
Object.assign(G.days,D);
G.lastDay=11;
G.chapters=G.chapters||[{from:0,to:3,n:'第1章 通信編'},{from:4,to:11,n:'第2章 アプリ編'},{from:12,to:15,n:'第3章 防壁編'},{from:16,to:21,n:'第4章 運用編'}];
})();
