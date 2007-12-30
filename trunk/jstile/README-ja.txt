tilescript の実験

goal: world の中を worm が動く
goal: worm が タートルグラフィックの動きが出来る。
goal: ビューワ

== ガジェット

http://igooglecon.jp/chapter03/index.html
http://gmodules.com/ig/creator?synd=open&url=http://yamamiya.takashi.googlepages.com/gadget.xml



== * はてなに Google ガジェットとしてタートルグラフィックスを貼り付けてみる。

http://d.hatena.ne.jp/propella/20071227/p1 で作った javascript 版ター
トルグラフィックスをそのままはてなに貼れないか試してみた。google ガジェッ
トを経由すると簡単でした。むかし、アイデアとして毎日 etoys でインタラ
クティブ日記を書くというのがありましたが、そういう事も可能になりそうで
す。

<script src="http://gmodules.com/ig/ifr?url=http://yamamiya.takashi.googlepages.com/worm.xml&amp;synd=open&amp;w=260&amp;h=300&amp;title=Worm&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>

参考
- http://igooglecon.jp/chapter03/index.html
- http://nyanjiro.no-blog.jp/web20/2007/08/igoogle__6ad8.html
- http://www.itmedia.co.jp/news/articles/0610/04/news033.html

** 追記1 このブログパーツ(笑 を貼るには以下をクリックしてください。

http://gmodules.com/ig/creator?synd=open&url=http://yamamiya.takashi.googlepages.com/worm.xml

** 追記2

一応 IE と Windows 版 safari で確認してみました。

==

参考:
- http://www.tohoho-web.com/wwwvml.htm
- SVG + createElementNS : http://blogs.dion.ne.jp/kit/archives/5767781.html

goal: Lively Kernel でロケットを表示し、js から操作する。

Smalltalk-72 で出来る事をやる。


todo: prototype 1.5.2 と scriptaculous の組み合わせを試す。

goal: sort の図示
goal: Active Essay
goal: 音楽？

r6621

== prototype.js 1.5.2pre0 のダウンロード方法

$ svn co -r6621 http://svn.rubyonrails.org/rails/spinoffs/prototype/trunk/ prototype
$ cd src
$ rake (../dist に prototype.js が出来る)

svg & vml?

==

goal done: 0 から 9 までの DnD 出来るタイルを表示する。
goal done: OMeta で、テキストとタイルの切り替えが出来る状況を作成する。

OMeta で簡単な電卓のパーサー

1 -> 1
1 + 1 -> ['+', 1, 1]

使用ライブラリ
http://script.aculo.us/dist/scriptaculous-js-1.7.1_beta3.tar.gz

Lively Kernel
- http://research.sun.com/projects/lively/
- http://research.sun.com/projects/lively/LivelyKernel-SourceCode-0.7.zip

参考
- http://www.openspc2.org/JavaScript/Ajax/ref/script.aculo.us/ver1.7.1b3/index.html

- http://diaspar.jp/node/43
- http://wiki.script.aculo.us/scriptaculous/show/Draggable
- http://developer.mozilla.org/ja/docs/Gecko_DOM_Reference
- http://developer.mozilla.org/en/docs/DOM
