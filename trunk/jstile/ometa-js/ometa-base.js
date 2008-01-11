/*
  Copyright (c) 2007 Alessandro Warth <awarth@cs.ucla.edu>

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
*/


// lazy input streams

function makeOMInputStream(hd, tl, stream) {
  var r = stream != null && stream.atEnd() ? new OMInputStreamEnd(stream) : new OMInputStream(hd, tl, stream)
  r.memo = new Object()
  return r
}

function OMInputStream(hd, tl, stream) {
  this.hd = hd
  this.tl = tl
  this.stream = stream
}
OMInputStream.prototype.head = function() {
  if (this.hd == undefined)
    this.hd = this.stream.next()
  return this.hd
}
OMInputStream.prototype.tail = function() {
  if (this.tl == undefined)
    this.tl = makeOMInputStream(undefined, undefined, this.stream)
  return this.tl
}
OMInputStream.prototype.realPos = function() { return this.stream.pos }

function OMInputStreamEnd(stream) { this.stream = stream }
OMInputStreamEnd.prototype.head = function() { throw new Fail() }
OMInputStreamEnd.prototype.realPos = function() { return this.stream.pos }

function FakeOMInputStream(input) {
  this.realInputStream = input
  this.memo = new Object()
}
FakeOMInputStream.prototype.head = function() { return this.realInputStream.head() }
FakeOMInputStream.prototype.tail = function() { return new FakeOMInputStream(this.realInputStream.tail()) }
FakeOMInputStream.prototype.realPos = function() { return this.realInputStream.realPos() }


// the failure exceptions

function Fail() { }
Fail.prototype.toString = function() { return "match failed" }


// left recursion detection

function LeftRecursion() { }
Object.prototype.isLeftRecursion = false
LeftRecursion.prototype.isLeftRecursion = true
LeftRecursion.prototype.detected = false


// the OMeta "class" and basic functionality
// TODO: make apply support indirect left recursion

OMeta = {
  _apply: function(rule) {
    var memoRec = this.input.memo[rule]
    if (memoRec == undefined) {
      var oldInput = this.input,
          lr       = new LeftRecursion()
      this.input.memo[rule] = memoRec = lr
      this.input.memo[rule] = memoRec = {ans: this[rule].apply(this), nextInput: this.input}
      if (lr.detected) {
        var sentinel = this.input
        while (true) {
          try {
            this.input = oldInput
            var ans = this[rule].apply(this)
            if (this.input == sentinel)
              throw new Fail()
            oldInput.memo[rule] = memoRec = {ans: ans, nextInput: this.input}
          }
          catch (fail) {
            if (!(fail instanceof Fail))
              throw fail
            break
          }
        }
      }
    }
    else if (memoRec.isLeftRecursion) {
      memoRec.detected = true
      throw new Fail()
    }
    this.input = memoRec.nextInput
    return memoRec.ans
  },
  _applyWithArgs: function(rule) {
    for (var idx = arguments.length - 1; idx > 0; idx--)
      this.input = makeOMInputStream(arguments[idx], this.input, null)
    return this[rule].apply(this)
  },
  _superApplyWithArgs: function($elf, rule) {
    for (var idx = arguments.length - 1; idx > 1; idx--)
      $elf.input = makeOMInputStream(arguments[idx], $elf.input, null)
    return this[rule].apply($elf)
  },
  _pred: function(b) {
    if (b)
      return true
    throw new Fail()
  },
  _not: function(x) {
    var oldInput = this.input
    try { x() }
    catch (fail) {
      if (!(fail instanceof Fail))
        throw fail
      this.input = oldInput
      return true
    }
    throw new Fail()
  },
  _lookahead: function(x) {
    var oldInput = this.input,
        r        = x()
    this.input = oldInput
    return r
  },
  _or: function() {
    var oldInput = this.input
    for (var idx = 0; idx < arguments.length; idx++)
      try { this.input = oldInput; return arguments[idx]() }
      catch (fail) {
        if (!(fail instanceof Fail))
          throw fail
      }
    throw new Fail()
  },
  _many: function(x) {
    var ans = arguments[1] != undefined ? [arguments[1]] : []
    while (true) {
      var oldInput = this.input
      try { ans.push(x()) }
      catch (fail) {
        if (!(fail instanceof Fail))
          throw fail
        this.input = oldInput
        break
      }
    }
    return ans
  },
  _many1: function(x) { return this._many(x, x()) },
  _form: function(x) {
    var v = this._apply("anything")
    if (!v.isSequenceable)
      throw new Fail()
    var oldInput = this.input
    this.input = makeOMInputStream(undefined, undefined, new ReadStream(v))
    var r = x()
    this._apply("end")
    this.input = oldInput
    return v
  },

  // some basic rules
  anything: function() {
    var r = this.input.head()
    this.input = this.input.tail()
    return r
  },
  end: function() {
    var $elf = this
    return this._not(function() { return $elf._apply("anything") })
  },
  empty: function() { return true },
  apply: function() {
    var r = this._apply("anything")
    return this._apply(r)
  },
  foreign: function() {
    var g   = this._apply("anything"),
        r   = this._apply("anything"),
        fis = new FakeOMInputStream(this.input),
        gi  = g.delegated()
    gi.input = fis
    var ans = gi._apply(r)
    this.input = gi.input.realInputStream
    return ans
  },

  //  some useful "derived" rules
  exactly: function() {
    var wanted = this._apply("anything")
    if (wanted == this._apply("anything"))
      return wanted
    throw new Fail()
  },
  char: function() {
    var r = this._apply("anything")
    this._pred(r.isCharacter())
    return r
  },
  space: function() {
    var r = this._apply("char")
    this._pred(r.charCodeAt(0) <= 32)
    return r
  },
  spaces: function() {
    var $elf = this
    return this._many(function() { return $elf._apply("space") })
  },
  digit: function() {
    var r = this._apply("char")
    this._pred(r.isDigit())
    return r
  },
  lower: function() {
    var r = this._apply("char")
    this._pred(r.isLower())
    return r
  },
  upper: function() {
    var r = this._apply("char")
    this._pred(r.isUpper())
    return r
  },
  letter: function() {
    var $elf = this
    return this._or(function() { return $elf._apply("lower") },
                    function() { return $elf._apply("upper") })
  },
  letterOrDigit: function() {
    var $elf = this
    return this._or(function() { return $elf._apply("letter") },
                    function() { return $elf._apply("digit")  })
  },
  firstAndRest: function()  {
    var $elf  = this,
        first = this._apply("anything"),
        rest  = this._apply("anything")
     return this._many(function() { return $elf._apply(rest) }, this._apply(first))
  },
  seq: function() {
    var xs = this._apply("anything")
    for (var idx = 0; idx < xs.length; idx++)
      this._applyWithArgs("exactly", xs.at(idx))
    return xs
  },
  notLast: function() {
    var $elf = this,
        rule = this._apply("anything"),
        r    = this._apply(rule)
    this._lookahead(function() { return $elf._apply(rule) })
    return r
  },

  initialize: function() { },
  // #match:with: and #matchAll:with: are a grammar's "public interface"
  genericMatch: function(input, rule, fnArgs) {
    var args = [rule]
    for (var idx = 2; idx < fnArgs.length; idx++)
      args.push(fnArgs[idx])
    var m =  this.delegated()
    m.initialize()
    m.input = input
    var r
    try { r = (args.length == 1) ? m._apply.call(m, args[0]) : m._applyWithArgs.apply(m, args) }
    catch (e) {
      if (e instanceof Fail)
        e.matcher = m
      throw e
    }
    return r
  },
  matchwith: function(obj, rule) {
    return this.genericMatch(makeOMInputStream(undefined, undefined, new ReadStream([obj])), rule, arguments)
  },
  matchAllwith: function(listyObj, rule) {
    return this.genericMatch(makeOMInputStream(undefined, undefined, new ReadStream(listyObj)), rule, arguments)
  }
}

