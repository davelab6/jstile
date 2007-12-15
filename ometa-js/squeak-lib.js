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


// in IE, the global object is not really an object
// IE also doesn't like it when you use "self" as a variable name
function ___IE_global_fix___() { }
___IE_global_fix___.prototype = this
global = $elf = new ___IE_global_fix___()

nil = null

function Return(value) { this.value = value }

// JS SUCKS: It's really stupid that null and undefined have no properties - they are not 1st class objects
// this means you can't send them #yourself, and is also the reason why I had to implement printString and
// asString functions for use by the system

// TODO: There must be a better way to write "new". The undefined check is there so that things like "Array new: 1 : 2 : 3"
// will work, but it's definitely not kosher.
Function.prototype["new"] = function() {
  var r = this.prototype.delegated(),
      s = this.apply(r, arguments)
  return s == undefined ? r : s
}

function SqueakObject() { }
SqueakObject.fields = []
SqueakObject.subclassWithFields = function(aString) {
  var r = this.delegated()
  r.prototype = this.prototype.delegated()
  r.fields = []
  this.fields.map(function(f) { r.fields.push(f) })
  aString.split(" ").map(function(f) {
                           r.prototype[f] = function() {
                             if (arguments.length > 0)
                               this._state[f] = arguments[0]
                             return this._state[f]
                           }
                           r.fields.push(f)
                         })
  return r
}
SqueakObject["new"] = function() {
  var r = this.prototype.delegated()
  r._state = new Object()
  for (var idx = 0; idx < this.fields.length; idx++)
    r._state[this.fields[idx]] = null
  r.initialize()
  return r
}
SqueakObject.prototype.initialize = function() { }

Object.prototype.signal = function() { throw this }
Function.prototype.ondo = function(exceptionType, catchBlock) {
  try { this.call(this) }
  catch (e) {
    if (e instanceof exceptionType)
      return catchBlock.call(this, e)
    throw e
  }
}

Object.prototype.yourself = function() { return this }

Object.prototype.asBoolean          = function()     { return this != false && this != undefined }
Object.prototype.not                = function()     { return !this.asBoolean() }
Object.prototype.and                = function(x)    { return this.asBoolean() && x().asBoolean() }
Object.prototype.or                 = function(x)    { return this.asBoolean() || x().asBoolean() }
Object.prototype.ifTrueifFalse      = function(t, f) { return this.asBoolean() ? t() : f() }
Object.prototype.ifFalseifTrue      = function(f, t) { return this.asBoolean() ? t() : f() }
Object.prototype.ifTrue             = function(t)    { return this.asBoolean() ? t() : null }
Object.prototype.ifFalse            = function(t)    { return this.asBoolean() ? null : f() }
Function.prototype.whileTrue        = function(f)    { while (this().asBoolean())  f(); return null }
Function.prototype.whileFalse       = function(f)    { while (this().not()) f(); return null }

/*
  Some "unit tests":
    alert((true).not() ? "bad" : "good")
    alert((false).not() ? "good" : "bad")
    alert( (true).ifTrueifFalse(function() { return "good" }, function() { return "bad" }))
    alert((false).ifTrueifFalse(function() { return "bad" }, function() { return "good" }))
*/

Function.prototype.value             = function()    { return this.apply(global, arguments) }
var sel = "value"
for (var n = 0; n < 10; n++)
  Function.prototype[sel += "value"] = Function.prototype.value

Array.prototype.addLast     = function(x) { return this.push(x) }
Array.prototype.addFirst    = function(x) { return this.splice(0, 0, x) }
Array.prototype.add         = Array.prototype.addLast
Array.prototype.empty       = function()  { return this.length == 0 }
Array.prototype.notEmpty    = function()  { return this.length > 0 }
Array.prototype.removeFirst = function()  { return this.shift() }
Array.prototype.removeLast  = function()  { return this.pop() }

Array.prototype.size = String.prototype.size = function() { return this.length }

Array.prototype["do"] = function(f) {
  for (var idx = 0; idx < this.length; idx++)
    f(this[idx])
  return this
}
Array.prototype.withIndexDo = function(f) {
  for (var idx = 0; idx < this.length; idx++)
    f(this[idx], idx)
  return this
}

Array.prototype.collect = function(f) { return this.map(f) }
String.prototype.collect = function(f) {
  var r = []
  for (var idx = 0; idx < this.length; idx++)
    r.push(this.charAt(idx))
  return r
}

Number.prototype.timesRepeat = function(block) {
  var n = this
  while (n-- > 0)
    block.value()
  return null
}
Number.prototype.todo = function(lim, f) {
  for (var idx = this; idx <= lim; idx++)
    f(idx)
  return null
}

Number.prototype["+"]    = function(that) { return this +   that }
Number.prototype["-"]    = function(that) { return this -   that }
Number.prototype["*"]    = function(that) { return this *   that }
Number.prototype["/"]    = function(that) { return this /   that }
Number.prototype["//"]   = function(that) { return Math.floor(this / that) }
Number.prototype["\\"]   = function(that) { return this %   that }
Number.prototype.negated = function()     { return -this }

String.prototype[","]  = function(that) { return this +   that }
Object.prototype["<"]  = function(that) { return this <   that }
Object.prototype["<="] = function(that) { return this <=  that }
Object.prototype["="]  = function(that) { return this ==  that }
Object.prototype[">="] = function(that) { return this >=  that }
Object.prototype[">"]  = function(that) { return this >   that }
Object.prototype["~="] = function(that) { return this !=  that }
Object.prototype["=="] = function(that) { return this === that }

Object.prototype.sendUnaryMessage  = function(m) { return this[m].call(this) }
Object.prototype.sendBinaryMessage = function(m) { return this[m].call(this, arguments[1]) }

Object.prototype.perform              = function(sel)       { return this[sel].call(this) }
Object.prototype.performwithArguments = function(sel, args) { return this[sel].apply(this, args) }

function printOrAsString(obj, sel) {
  if (obj == null)
    return "nil"
  else if (obj == undefined)
    return "undefined"
  else
    return obj.sendUnaryMessage(sel)
}
function printString(obj) { return printOrAsString(obj, "printString") }
function asString(obj)    { return printOrAsString(obj, "asString") }

Object.prototype.printString = function() { return this.toString() }
String.prototype.printString = function() {
  var r = []
  for (var idx = 0; idx < this.length; idx++)
    r.push(escapeChar(this.charAt(idx)))
  return ["'", r, "'"].squish().join('')
}
Array.prototype.printString = function() {
  return ["{", this.map(printString).delimWith(". "), "}"].squish().join('')
}

Object.prototype.asString = function() { return this.toString() }
Array.prototype.asString  = function() { return this.printString() }

Object.prototype.inform = function(x) {
  alert(asString(x))
  return null
}

Object.prototype[",,"] = function(that) { return [this, that] }

