tilescript �̎���

(find-file "~/doc/presentation/c5-2008/")

todo: Gabriel Fahrenheit �ƁAAnders Celsius �̎ʐ^
todo: ���f���ʂ��l�����l�̎ʐ^
todo: �[���������l�����l�Ɛ���
todo: Numerical Recipes in C �̍��


todo: begin �ɑ}���ł���
todo: �^�[�g���O���t�B�b�N�X
todo: enter �� watcher ����
todo: �����x

todo done: toggle ���Y��ɁB
todo done: �폜
todo done: HTML �L�@
todo done: �g�����X�N���v�g���B��
todo done: ���ʕ\��
todo done: �c�\��
todo done: dirty �t���O
todo done: �y�[�W���W�����v
todo done: textarea �Ńy�[�W���W�����v�𖳌��ɂ���B
todo done: position �I�u�W�F�N�g���N���X�ɂ���B(title ����)
todo done: HTML �� ! ���B���B
todo done: �V�����s�Ƀh���b�O�o����悤�ɁB
todo done: ��ԍ����̃^�C���̑���ŃG���[���o��B
todo done: ���l�̕����Ƀh���b�O���F���ς��悤��
todo done: ���l�ƕ����ʁX�̃G�f�B�^
todo done: watcher �����Ɛ����ȊO�͕ҏW�s�\��
todo done: textarea blur ���ɑ傫���`�F�b�N
todo done: ���f���̊|���Z�B
todo done: �o�͂� inspect ���g���B
todo done: �֐������h���b�O�ł��Ȃ��悤�ɂ���B
todo done: scrable
todo done: �h���b�O��� watcher �L��
todo pending: �p�[�c�r��
todo done: ����������v���b�g����B
todo done: ��܂��Ȏg�����̃y�[�W
todo done: �u���E�U�Ŗ��܂�����ʂ̗�B

note: ���[�J���œ��{��ۑ��s�\�B

== �K�v�� DAV �̐ݒ�

<Directory "/var/www/html/jstile/data">
    Header add MS-Author-Via "DAV"
    DAV On
    AuthName "a WebDAV folder for jstile"
    AuthType Basic
    AuthUserFile /etc/httpd/conf/.dav
    <LimitExcept GET OPTIONS REPORT>
      Require valid-user
    </LimitExcept>
    Options Indexes
</Directory>

[takashi@localhost conf]$ cat /etc/httpd/conf/.dav
tinlizzie:$apr1$oX/lL/..$rbmvpF13HUAAYx.Mr.q4c/
user/pass: tinlizzie/everyday

== �t�H���g
http://home.tiscali.nl/developerscorner/fdc-varia/font-embedding.htm
== ���C�A�E�g

== �����\��

Alex �`���Ƃ���
["binop", "+", ["number", 3], ["number", 4]]

["init", ["binop", "+", ["number", 3], ["number", 4]]] �������R�[�h
["source", ["binop", "+", ["number", 3], ["number", 4]]] �Ń\�[�X�R�[�h�\��
["tile", ["binop", "+", ["number", 3], ["number", 4]]] �Ń^�C���R�[�h�\��
["dom", object] object �ɂ͎��ۂ̃I�u�W�F�N�g�B�ۑ��ł��Ȃ��B
["inspector", object] object �ɂ͎��ۂ̃I�u�W�F�N�g�B�ۑ��ł��Ȃ��B

http://localhost:8080/js/jstile/
http://www.tiddlywiki.com/
http://ask.metafilter.com/34651/Saving-files-with-Javascript
WYSIWIG editor http://a-h.parfe.jp/einfach/archives/2006/1213124637.html

css �Q�l
- ADP: float���C�A�E�g�ł܂Â��Ȃ����߂�Tips http://adp.daa.jp/archives/000250.html
- <script> �^�O�̓ǂݕ� http://d.hatena.ne.jp/jknaoya/20071116
== * �͂ĂȂ� Google �K�W�F�b�g�Ƃ��ă^�[�g���O���t�B�b�N�X��\��t���Ă݂�B

http://d.hatena.ne.jp/propella/20071227/p1 �ō���� javascript �Ń^�[�g���O���t�B�b�N�X�����̂܂܂͂ĂȂɓ\��Ȃ��������Ă݂��Bgoogle �K�W�F�b�g���o�R����ƊȒP�ł����B�ނ����A�A�C�f�A�Ƃ��Ė��� etoys �ŃC���^���N�e�B�u���L�������Ƃ����̂�����܂������A�������������\�ɂȂ肻���ł��B

<script src="http://gmodules.com/ig/ifr?url=http://yamamiya.takashi.googlepages.com/worm.xml&amp;synd=open&amp;w=260&amp;h=300&amp;title=Worm&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>

�Q�l
- http://igooglecon.jp/chapter03/index.html
- http://nyanjiro.no-blog.jp/web20/2007/08/igoogle__6ad8.html
- http://www.itmedia.co.jp/news/articles/0610/04/news033.html

** �ǋL1 ���̃u���O�p�[�c(�� ��\��ɂ͈ȉ����N���b�N���Ă��������B

http://gmodules.com/ig/creator?synd=open&url=http://yamamiya.takashi.googlepages.com/worm.xml

** �ǋL2

�ꉞ IE �� Windows �� safari �Ŋm�F���Ă݂܂����B

==

�Q�l:
- http://www.tohoho-web.com/wwwvml.htm
- SVG + createElementNS : http://blogs.dion.ne.jp/kit/archives/5767781.html

goal: Lively Kernel �Ń��P�b�g��\�����Ajs ���瑀�삷��B

Smalltalk-72 �ŏo���鎖�����B


todo: prototype 1.5.2 �� scriptaculous �̑g�ݍ��킹�������B

goal: sort �̐}��
goal: Active Essay
goal: ���y�H

r6621

== prototype.js 1.5.2pre0 �̃_�E�����[�h���@

$ svn co -r6621 http://svn.rubyonrails.org/rails/spinoffs/prototype/trunk/ prototype
$ cd src
$ rake (../dist �� prototype.js ���o����)

svg & vml?

==

goal done: 0 ���� 9 �܂ł� DnD �o����^�C����\������B
goal done: OMeta �ŁA�e�L�X�g�ƃ^�C���̐؂�ւ����o����󋵂��쐬����B

OMeta �ŊȒP�ȓd��̃p�[�T�[

1 -> 1
1 + 1 -> ['+', 1, 1]

�g�p���C�u����
http://script.aculo.us/dist/scriptaculous-js-1.7.1_beta3.tar.gz

Lively Kernel
- http://research.sun.com/projects/lively/
- http://research.sun.com/projects/lively/LivelyKernel-SourceCode-0.7.zip

�Q�l
- http://www.openspc2.org/JavaScript/Ajax/ref/script.aculo.us/ver1.7.1b3/index.html

- http://diaspar.jp/node/43
- http://wiki.script.aculo.us/scriptaculous/show/Draggable
- http://developer.mozilla.org/ja/docs/Gecko_DOM_Reference
- http://developer.mozilla.org/en/docs/DOM
