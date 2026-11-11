/* Getting Secure It — ステージ定義（第1章 通信編）
   days[n]: title, attacker(cast id), start/voices/alert/success(セリフ), check(cfg)→{ok,lines,why,blocked,voices,pkt}, learn
   lines[] は「攻撃者の画面」に1行ずつ出る。各行は通信図のパケットの動きも決める：
     k   … info=攻撃の手口 / bad=被害 / ok=防いだ（色と、既定の動き）
     m   … 既定と違う動きだけ指定。c=お客さん s=ショップ n=インターネット a=攻撃者
            'a>s'（攻撃者→ショップ）、'a>c,c>s'（順番に）、'c>s+c>a'（同時＝盗み見）、'a>s!'（盾で止まる）、'a>s*3'（3連）、'-'（動きなし）
     p   … お客さんの通信の見た目を固定。'open'=暗号化なしの手紙 / 'seal'=鍵のかかった箱
   既定の動きは index.html の NET_MOVE（攻撃の種類ごと）。 */
(function(){
const SHIRO='シロ', YOU='店長（あなた）';
const DAYS={
1:{
  title:'1日目　筒抜けの通信',attacker:'tochou',sub:'cert',
  start:[{who:SHIRO,t:'おはよう。……ちょっと待って、お客さんから問い合わせが来てるみたいだ'}],
  voices:[
    {who:'たなか',t:'カフェのWi-Fiで買い物したあと、パスワードが勝手に変えられてました。'},
    {who:'すずき',t:'身に覚えのない注文確認メールが届いたんですけど……？'},
    {who:'やまだ',t:'このお店、使っても大丈夫ですか？'}
  ],
  alert:[
    {who:SHIRO,t:'やばい！ 通信が暗号化されていないから、情報が筒抜けになってる！'},
    {who:SHIRO,t:'同じWi-Fiにいるだけで、パスワードもログイン状態も丸見えなんだ'},
    {who:SHIRO,t:'「管理」タブのピクセルクラウド「証明書」で認証局（CA）を選んで、証明書を発行してもらおう。HTTPSの導入だ！'}
  ],
  success:()=>[{who:SHIRO,t:'攻撃者には、意味のないデータしか見えなくなった！'},{who:SHIRO,t:'1日目クリアだ'}],
  check(c){
    if(!c.https) return {ok:false,pkt:'password=neko1234',why:'まだHTTPのままだ。証明書を発行して、HTTPSを有効にしよう',lines:[
      {k:'info',t:'お客さん → POST http://pixeldo.example/login'},
      {k:'bad',t:'email=tanaka@example.jp'},
      {k:'bad',t:'password=neko1234'},
      {k:'bad',t:'Cookie: session=7f3a9c21e0'},
      {k:'bad',t:'パスワードとログイン状態を入手した',m:'-'}]};
    if(c.ca==='self') return {ok:false,pkt:'password=neko1234',voices:[{who:'やまだ',t:'お店を開いたら「この接続ではプライバシーが保護されません」と出ました。怖くて買えません。'}],why:'自分で署名した証明書は、ブラウザが信頼しない。警告に慣れたお客さんは、攻撃者の偽の証明書でもそのまま進んでしまう。認証局（CA）に発行してもらおう',lines:[
      {k:'info',t:'お客さんのブラウザ：「この接続ではプライバシーが保護されません」',m:'s>c'},
      {k:'bad',t:'警告を見て帰ってしまうお客さんが続出',m:'-'},
      {k:'bad',t:'攻撃者が自作の偽証明書で割り込む',m:'a>c'},
      {k:'bad',t:'警告に慣れたお客さんが「詳細設定 → 進む」を押した',m:'c>a'},
      {k:'bad',t:'password=neko1234'}]};
    if(c.installed==='cert') return {ok:false,blocked:true,voices:[{who:'すずき',t:'スマホだと証明書のエラーが出て開けません。パソコンだと大丈夫なのに……'}],why:'中間証明書がないと、端末によっては「発行元を確認できない」とエラーになる。中間証明書つきの fullchain.crt を設置しよう',lines:[
      {k:'ok',t:'パソコンのお客さん：暗号化されていて読めない'},
      {k:'bad',t:'一部のスマホ：証明書エラー（発行元を確認できません）'},
      {k:'bad',t:'お店を開けないお客さんがいる'}]};
    if(!c.redirect) return {ok:false,pkt:'password=sakura77',why:'https:// で来たお客さんは守れたけど、http:// で来たお客さんはまだ平文だ。http:// から https:// への転送も設定しよう',lines:[
      {k:'ok',t:'https:// のお客さん：暗号化されていて読めない'},
      {k:'info',t:'http:// のお客さん → POST /login',p:'open'},
      {k:'bad',t:'password=sakura77',p:'open'},
      {k:'bad',t:'http:// のままでも使えるので、まだ盗める',m:'-'}]};
    return {ok:true,lines:[
      {k:'info',t:'お客さん → https://pixeldo.example/login'},
      {k:'ok',t:'17 03 03 00 4a 9c e1 07 5b d2 ……'},
      {k:'ok',t:'http:// で来ても https:// に転送された',m:'s>c'},
      {k:'ok',t:'中身を読めない',m:'-'}]};
  },
  learn:{
    title:'HTTPSと証明書',
    points:['HTTPの通信は平文。同じWi-Fiや経路上の機器から中身を読める','HTTPSの証明書は、認証局（CA）が「申請者がそのドメインの持ち主か」を確かめてから発行する。自分で署名した証明書はブラウザに信頼されない','秘密鍵はサーバーの外に出さない。認証局に送るのはCSR（申請書）だけ','証明書は中間証明書といっしょに設置し、http:// で来た人は https:// に転送する'],
    real:'実際には Let’s Encrypt などの無料の認証局と certbot などのツールで、鍵の作成・申請・所有確認・設置・更新までを自動化するのが一般的です。クラウドのロードバランサやCDNに任せる方法もあります。証明書の最長有効期間は2026年3月から200日、2029年には47日と短くなっていくので、自動更新は必須です。'
  }
},
2:{
  title:'2日目　古い暗号のすき',attacker:'downgrade',sub:'net',
  start:[{who:SHIRO,t:'鍵マークも付いたし、これで安心……と思ったんだけど'}],
  voices:[
    {who:'たなか',t:'鍵マークが付いてたのに、またログインできなくなりました……'},
    {who:'セキュリティ研究者',mail:true,t:'貴店のサイトが古い暗号方式（TLS 1.0、RC4）での接続を受け付けています。早めの対応をおすすめします。'}
  ],
  alert:[
    {who:SHIRO,t:'攻撃者が通信に割り込んで、わざと古い暗号方式を選ばせてる！'},
    {who:SHIRO,t:'古い方式なら解読できてしまう。これを「ダウングレード攻撃」っていうんだ'},
    {who:SHIRO,t:'「管理」タブのピクセルクラウド「通信設定」で、古いバージョンと弱い暗号を止めよう'}
  ],
  success:(c)=>{const m=[{who:SHIRO,t:'古い方式での接続を断れるようになった。2日目クリア！'}];if(c.tlsMin==='1.3')m.push({who:SHIRO,t:'ちなみにTLS 1.3だけにすると、古い端末のお客さんは入れないこともある。実際はお客さんの環境と相談だね'});return m;},
  check(c){
    const on=c.ciph, any=on.aes||on.chacha||on.rc4||on.des3;
    if(!any) return {ok:false,why:'暗号の方式を全部止めると、お客さんも接続できなくなる。今の標準の方式は残そう',lines:[
      {k:'info',t:'お客さん → https://pixeldo.example',p:'open'},
      {k:'bad',t:'接続エラー：使える暗号の方式がありません',m:'s>c'},
      {k:'bad',t:'お客さんがお店を開けなくなった',m:'-'}]};
    const oldV=c.tlsMin==='1.0'||c.tlsMin==='1.1', weakC=on.rc4||on.des3;
    if(oldV||weakC){
      const lines=[{k:'info',t:'通信に割り込み、古い方式を要求する',m:'a>s'}];
      lines.push(oldV?{k:'bad',t:`サーバーが TLS ${c.tlsMin} での接続を受け入れた`,m:'s>a'}:{k:'ok',t:'TLS 1.0／1.1 は断られた',m:'s>a'});
      if(weakC) lines.push({k:'bad',t:`弱い暗号（${[on.rc4&&'RC4',on.des3&&'3DES'].filter(Boolean).join('・')}）を選ばせた`,m:'s>a'});
      lines.push({k:'bad',t:'session=b81e44f0a2'},{k:'bad',t:'ログイン状態を乗っ取れた',m:'-'});
      const why=oldV&&weakC?'古いTLSと弱い暗号の両方が残っている。最低バージョンを上げて、古い暗号を止めよう':oldV?'暗号は良くなったけど、TLS 1.0／1.1 での接続がまだ受け入れられている。最低バージョンを上げよう':'バージョンは良くなったけど、古い暗号がまだ選べてしまう。RC4 や 3DES を止めよう';
      return {ok:false,pkt:'session=b81e…',why,lines};
    }
    if(c.tlsMin==='1.3') return {ok:false,blocked:true,why:'TLS 1.3 だけにすると、まだ対応していない古いスマホや会社のネットワークから入れなくなる。TLS 1.2 も残して、暗号を安全なものに絞ろう',
      voices:[{who:'たなか',t:'お気に入りのお店なのに、スマホで開けなくなりました……。機種変しないとダメですか？'},{who:'法人のお客さま',mail:true,t:'社内のパソコンから貴店のサイトに接続できなくなりました。まとめ買いの発注ができず困っています。'}],
      lines:[{k:'info',t:'通信に割り込み、TLS 1.0 を要求する',m:'a>s'},{k:'ok',t:'サーバーが拒否：攻撃は失敗',m:'s>a'},{k:'bad',t:'古いスマホのお客さん：接続エラー（TLS 1.3 に未対応）'},{k:'bad',t:'会社のネットワークのお客さん：接続エラー'},{k:'bad',t:'攻撃は防げたけど、お客さんも入れなくなった',m:'-'}]};
    if(!on.aes) return {ok:false,blocked:true,why:'AES-GCM は、いちばん多くの端末が使える安全な暗号。止めてしまうと入れないお客さんが出る。安全な暗号は残そう',
      voices:[{who:'すずき',t:'パソコンからだと「安全な接続を確立できません」と出て開けません。'}],
      lines:[{k:'info',t:'通信に割り込み、TLS 1.0 を要求する',m:'a>s'},{k:'ok',t:'サーバーが拒否：攻撃は失敗',m:'s>a'},{k:'bad',t:'一部のお客さん：共通の暗号が見つからず接続エラー'},{k:'bad',t:'攻撃は防げたけど、お客さんも入れなくなった',m:'-'}]};
    return {ok:true,lines:[
      {k:'info',t:'通信に割り込み、TLS 1.0 を要求する',m:'a>s'},
      {k:'ok',t:'サーバーが拒否：protocol_version',m:'s>a'},
      {k:'ok',t:'RC4・3DES での接続も拒否された',m:'s>a'},
      {k:'ok',t:'解読できない'}]};
  },
  learn:{
    title:'TLSのバージョンと暗号の方式',
    points:['TLS 1.0／1.1 は古く、2021年に正式に非推奨になった','RC4 や 3DES は弱い暗号。残しておくと、わざとそれを選ばされる','最低 TLS 1.2 が現実的な落としどころ。TLS 1.3 だけにすると、古い端末や会社のネットワークから入れなくなることがある'],
    real:'クラウドのロードバランサやCDNでは「セキュリティポリシー」を選ぶ形が多く、暗号を一つずつ並べることは少なめです。ゲーム内の解読の演出は簡略化しています。'
  }
},
3:{
  title:'3日目　最初の一回を狙え',attacker:'sslstrip',sub:'net',
  start:[{who:SHIRO,t:'暗号も強くなった。今度こそ大丈夫……だよね？'}],
  voices:[
    {who:'すずき',t:'お気に入りから開いたとき、鍵マークが出ていなかった気がします。'},
    {who:'たなか',t:'また乗っ取られました！ もう使うのやめようかな……'}
  ],
  alert:[
    {who:SHIRO,t:'お客さんが最初に http:// で来た瞬間を狙われてる！'},
    {who:SHIRO,t:'https:// への転送を攻撃者が握りつぶして、HTTPのまま中継してるんだ。「SSLストリップ」っていう手口だよ'},
    {who:SHIRO,t:'ピクセルクラウドの「通信設定」で、ブラウザに「このお店はHTTPSだけ」と覚えさせるHSTSを設定しよう'}
  ],
  success:()=>[{who:SHIRO,t:'お客さんのブラウザが、最初からHTTPSで来てくれるようになった。3日目クリア！'}],
  check(c){
    if(!c.hsts) return {ok:false,pkt:'password=neko1234',why:'転送だけだと、最初の http:// の一回を狙われる。HSTSを有効にしよう',lines:[
      {k:'info',t:'お客さんが「pixeldo.example」と入力（http://）',p:'open'},
      {k:'bad',t:'https:// への転送を握りつぶした',m:'s>a'},
      {k:'bad',t:'お客さんとはHTTP、お店とはHTTPSで中継中',p:'open'},
      {k:'bad',t:'password=neko1234',p:'open'},
      {k:'bad',t:'また盗めた',m:'-'}]};
    if(c.hstsAge!=='31536000'){const short=c.hstsAge==='300';return {ok:false,pkt:'password=sakura77',
      why:short?'max-age が5分だと、5分たてばブラウザは忘れてしまう。もっと長くしよう':'max-age が1日だと、2日ぶりに来たお客さんは守れない。もっと長くしよう',
      lines:[
      {k:'info',t:'HSTSの記憶が切れたお客さんを待つ……',m:'-'},
      {k:'ok',t:short?'さっき来たお客さん：最初からHTTPS（守られた）':'今日来たお客さん：最初からHTTPS（守られた）'},
      {k:'bad',t:short?'1時間ぶりのお客さん：記憶が切れて http:// で接続':'3日ぶりのお客さん：記憶が切れて http:// で接続',m:'c>s',p:'open'},
      {k:'bad',t:'password=sakura77',p:'open'}]};}
    return {ok:true,lines:[
      {k:'info',t:'お客さんが「pixeldo.example」と入力'},
      {k:'ok',t:'ブラウザがHSTSを記憶：最初から https:// で接続'},
      {k:'ok',t:'握りつぶせるHTTPの通信がない',m:'-'},
      {k:'ok',t:'割り込めない',m:'-'}]};
  },
  learn:{
    title:'HSTS',
    points:['HSTSは「このサイトは今後HTTPSだけで開く」とブラウザに覚えさせる仕組み','max-age は1年（31536000秒）以上が目安','初めて来た人は守れない。ブラウザにあらかじめ登録しておく「HSTSプリロード」という仕組みもある'],
    real:'includeSubDomains は、すべてのサブドメインがHTTPSに対応してから付けます。先に付けると、HTTPのままのサブドメインが開けなくなります。'
  }
}
};
const CHAPTERS=[
  {from:0,to:3,n:'第1章 通信編'},
  {from:4,to:11,n:'第2章 アプリ編'},
  {from:12,to:17,n:'第3章 防壁編'},
  {from:18,to:24,n:'第4章 運用編'}
];
const CAS={
  free:{n:'フリーSSL認証局',p:'無料',v:'90日',d:'ドメインの持ち主かを自動で確認して発行。90日ごとの更新が前提',ica:'FreeSSL R1'},
  self:{n:'自分で署名する（自己署名）',p:'無料',v:'自由に決められる',d:'認証局を通さず、自分で証明書を作る'}
};
window.GSI_DAYS={SHIRO,YOU,days:DAYS,chapters:CHAPTERS,cas:CAS,lastDay:3};
})();
