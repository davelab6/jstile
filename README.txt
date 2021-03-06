Tilescript Manual

This document is described for http://tinlizzie.org/svn/trunk/jstile/ revision 309.

* Summary

Tilescript is a programming environment for educational purpose which
has good features in both graphical and textual languages.

* How to use

- Only Firefox3 and Safari are supported.
- To use on a local machine.
-- Download or check out with subversion client at
   http://tinlizzie.org/svn/trunk/jstile/.
- To use the live environment for evaluation.
-- Visit http://tinlizzie.org/jstile/

* Terminology

- Document : Tilescript shows a document each time. A document has the title.

- Paragraph : A document consists paragraphs. A paragraph has a "mode".
-- source : A source code of Javascript or HTML which is shown on a textarea.
-- tile : A program represented as a tile.
-- html : A html element.
-- result : The result of a program which is shown on a textarea.

- Javascript namaspace : All programs share same namespace. In other
  word, variables defined in a program can be seen all other documents
  in a session. If you want to clear the namespace, reload Tilescript
  with the browser button.

- Viewer and Watcher : The Viewer is a rectangle area of right hand
  side on the screen. The viewer includes watchers. watchers show all
  global variable names and values in the session.
-- Global variables are elements in the window object.
-- Variables which are used in Tilescript are not shown in watchers. A
   variable which is defined by a user is not shown either if its name
   has been already used by Tilescript.

* Operation

** Buttons on above screen

- Viewer button (eye icon) : toggles show/hide of the Viewer.
- Home button (house icon) : goes to the home page.
- Save button (disk icon) : saves the document.

** Making a new paragraph

A new paragraph is made if you click a gap between paragraphs, or drop
a tile into the gap.

** Functions of a paragraph

- Execute button (Exclamation icon) : executes a program described in
  the paragraph.

-- The result is shown in a new paragraph made under the
   paragraph. Object.inspect() in prototype.js is used to show the
   result.

- Remove button (X icon) : removes the paragraph.
- checkbox : toggles the "mode" of source, tile, source code.
-- on : the source code is shown.
-- off when the top character is < : HTML element is shown.
-- off when the top character is not < : a tile is shown.

* Transcript

You can toggle show / hide of the Transcript with a tab shown on the
screen. Transcript shows the result of a program, a syntax tree, or
anything.

* Document

A Tilescript document has a title. You can use alpha-numeric
characters as a title. A title is used as a URL. A URL is configured
as this form.

{base url}#{title}#{paragraph number}

For example, A document titled "Fibonacci" on the evaluation
environment would be http://tinlizzie.org/jstile/#Fibonacci. You can
also designate the paragraph number like
http://tinlizzie.org/jstile/#Fibonacci#3

To make a new document is the same way as Wiki. Just to access
uncreated URL. For example, if http://tinlizzie.org/jstile/#NewPage is
not exists, and you visit the page, and save it, and then a new
document named NewPage will be created.

To represent the title of a document as a hash element in URL is
useful especially for Firefox. Browser doesn't reload a Javascript
program even if you change the hash element because hash is usually
used to designate a reference in a same document. Besides, the hash is
handled by history function in the browser properly, You would feel a
Tilescript document just as a normal html. Tilescript periodically
checks the hash and show designated document.

You can proceed next paragraph in a document with space bar, which is
useful feature for a presentation.

If you modify a document. The title bar shows a warning as "* modified
*" to denote the fact that the document is modified.

* File Format of Tilescript

This is an example of Tilescript file format. The format is JSON
expression.

["tilescript",
  ["source", "3 + 4"],
  ["tile", "(3+4)"],
  ["html", "<p>3 + 4</p>"]
]

The first element should be "tilescript". aftetwards, [tag, source
code] array are saved. "tag" is one of source, tile, html, result,
which shows the type of paragraph.

* Macro

You can define a macro for making a new control structure. A
definition of macro looks like a function definition. Keyword "macro"
is used instead of "function", @ mark is prefixed to show it is an
identifier of macro. This is an example.

macro @repeat(k, s) {
  var n = k;
  while (n-- > 0) {s}
}

It is an example of using macro.

@repeat(4, ++x)

* Organization

Tilescript environment consists those files.

- index.html : is the entry point.
- tilescript.css : controls look.
- js files
- data directory : includes document data.

You need Firefox2 to try this environment. It works both on the
internet or local environment. WebDAV is used as the storage when it
is working on the internet. Mozilla API is used to save a document in
a local environment.

Because Tilescript directly talks WebDAV protocol, any other server
process like CGI is not used. If you use in local, you see a special
dialog to confirm local file access.

* Libraries used by the system

- OMeta
- prototype.js 1.6.0.1
- scriptaculous 1.8.1

* Motivation

** Motivatino of the language

The goal of Tilescript is to make a new programming language which is
easy enough for beginner but supports wide range of application. The
idea came from Squeak eToys.

EToys is a great programming language for kids. And you can extend the
feature with Smalltalk language. However, there are large gaps between
etoys (tile language) and Smalltalk (text language).

- Gap #1 : EToys can be converted to Smalltalk, but Smalltalk can not
  be converted to eToys.

- Gap #2 : EToys is an instance base language, but Smalltalk is a
  class base language.

To fill these gaps, those ways are chosen.

- Implementation of converter between tile language and text language
  both ways.
- Using instance based (prototype based) language Javascript as the
  basis.

Besides, macro is implemented to expand the language itself by a user.

** Motivation of the environment

Tilescript development environment is implemented to support to write
Active Essays by end-users. There is a related work SophieScript.

Active Essays are mixed media of essay and program. Reader tries a
computer simulation while reading an essay, which is suitable to learn
scientific topic like mathematic and physics. For example, there is a
typical example "The Evolution Essay" by Ted Kaehler to learn
evolution with variation, selection and randomness.

Tilescript emphasis writing Active Essays by end-user, not only
reading them. Because "Learing by Explaining" is a good way as a
curriculum of edication with computer. To write a good active essay,
the best way is to read a source code written by other
authers. However, it is difficult in current etoys. Because the screen
layout of etoys is heavily depend on the screen size, so it is hard to
see source codes and the document same time. To solve the issue, flow
layout is better because the layout is dynamically changed by the
screen size.

To implement flow layout easyly, Tilescrip simply uses HTML DOM.

* Examples

** Fahrenheit Centigrade converter http://tinlizzie.org/jstile/#FCConverter

This is an example of using variables. First, variables C and F are
defined. And then, their watchers are gotten from the Viewer. If you
invoke javascript program which convert Fahrenheit and Centigrade, you
can convert among them. For example, to get 10 degree in centigrade,
you might set 10 as a C, and then invoke F = C * 1.8 * 32, finally,
you can get Fahrenheit number of the 10 centigrade.

And an example of a simple converter with watchers is provided.

** Pseudo random number http://tinlizzie.org/jstile/#Random

A linear congruential generator is introduced as an algorithm of
pseudo random number. Constants A, B, M are defined, X's initial value
is defined to zero. And when you invoke X = ( (A * X) + B) % M a
couple of times, pseudo random numbers are shown. Besides, if you
store the sequence into an array, you can esasily see how these
numbers circulate.

You can also plot the random number sequence as a graph on Canvas. It
is good way to understand the behavior of random number depend on
constatns. In this case, a combination of constants introduced in
Numerical Recipes in C is tested.

** Multiplication of complex number  http://tinlizzie.org/jstile/#ComplexNumber

This is an example of calculate multiplication of complex number.

At first, a complex number is represented as an array of
javascript. For example, 1 + 2i is shown as [1, 2]. With this
expression, multiplication is defined as function mul, and we try
simple cases like 1 * 1, and i * i.

For more complicated example, a point is plotted in the complex plain
to know the behavior of complex numbers. And using javascript event to
implement a dynamic simulation, you can get an intuition of how
complex number is related with geometry scale and rotation.

* History

The basic concept of Tilescript is discussed in Apple Hill Lerning
Camp at 2007 summer by A Warth, T. Yamamiya, Y. Ohshima,
S. Wallace. It had been developed on Squeak Javascript and Morphic for
a while though, it was switched on simple browser DOM because we had
succeeded to implement OMeta/JS and tile expression in 2007
December. All browser among IE, Firefox, Opera, and Safari had been
supported at first though, now only Firefox2 is supported temporality.

* Bugs

Because the primary goal of Tilescript was the presentation of C5
conference, there are a lot of bugs for real situation.

- You can not make a tile program from the beginning because there are
  no parts bin yet.

- Drag Drop is hard to use because there are no syntax nor type
  checking.

- Any security concerns are ignored.

** References

- A. Warth, T. Yamamiya, Y. Ohshima, S. Wallace: Toward A More Scalable End-User Scripting Language.  Proceedings of the Sixth Intenational Conference on Creating, Connecting and Collaborating through Computing.
- prototype.js http://prototypejs.org/
- scriptaculous http://script.aculo.us/
- Lively Kernel http://research.sun.com/projects/lively/
- OMeta http://www.cs.ucla.edu/~awarth/ometa/
- A. Kay: Active Essays. http://www.squeakland.org/whatis/a_essays.html
- T. Kaehler: The Evolution Essay. http://www.squeakland.org/projects/Weasel%20Essay1.023.pr
- J. Licke, R. Hirscfeld, M. Ruger, M. Masuch: SophieScript - Active Content in Multimedia Documents. Proceedings of the Sixth Intenational Conference on Creating, Connecting and Collaborating through Computing.
