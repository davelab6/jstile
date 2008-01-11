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


// some reflective stuff

Object.prototype.delegated = function() {
  var constr = function() { }
  constr.prototype = this
  return new constr()
}

Object.prototype.ownPropertyNames = function() {
  var r = []
  for (name in this)
    if (this.hasOwnProperty(name))
      r.push(name)
  return r
}

Object.prototype.hasProperty = function(p) { return this[p] != undefined }


// some functional programming stuff

Array.prototype.map = function(f) {
  var r = []
  for (var idx = 0; idx < this.length; idx++)
    r[idx] = f(this[idx])
  return r
}

Array.prototype.reduce = function(f, z) {
  var r = z
  for (var idx = 0; idx < this.length; idx++)
    r = f(r, this[idx])
  return r
}

Array.prototype.delimWith = function(d) {
  return this.reduce(
    function(xs, x) {
      if (xs.length > 0)
        xs.push(d)
      xs.push(x)
      return xs
    },
   [])
}


// some smalltalk stuff

Object.prototype.at = function(idx) { return this[idx] }
String.prototype.at = function(idx) { return this.charAt(idx) }

Object.prototype.atput  = function(idx, val) { return this[idx] = val }

Object.prototype.isNumber    = function() { return false }
Number.prototype.isNumber    = function() { return true }

Object.prototype.isCharacter = function() { return false }

String.prototype.isCharacter = function() { return this.length == 1 }
String.prototype.isDigit     = function() { return this.isCharacter() && this >= "0" && this <= "9" }
String.prototype.isLower     = function() { return this.isCharacter() && this >= "a" && this <= "z" }
String.prototype.isUpper     = function() { return this.isCharacter() && this >= "A" && this <= "Z" }

String.prototype.digitValue  = function() { return this.charCodeAt(0) - "0".charCodeAt(0) }

Object.prototype.isSequenceable = false
Array.prototype.isSequenceable  = true
String.prototype.isSequenceable = true

function ReadStream(anArrayOrString) {
  this.src = anArrayOrString
  this.pos = 0
}
ReadStream.prototype.atEnd = function() { return this.pos >= this.src.length }
ReadStream.prototype.next  = function() { return this.src.at(this.pos++) }


// use this instead of string concatenation to improve performance

function StringBuffer() {
  this.strings = []
  for (var idx = 0; idx < arguments.length; idx++)
    this.nextPutAll(arguments[idx])
}
StringBuffer.prototype.nextPutAll = function(s) { this.strings.push(s) }
StringBuffer.prototype.contents   = function()  { return this.strings.join("") }
String.prototype.writeStream = function() { return new StringBuffer(this) }


// should be called "flatten" but isn't in order to prevent conflicts w/ the popular prototoype library
Object.prototype.squish = function(dest) {
  if (dest == undefined)
    dest = []
  dest.push(this)
  return dest
}
Array.prototype.squish  = function(dest) {
  if (dest == undefined)
    dest = []
  for (var idx = 0; idx < this.length; idx++)
    this[idx].squish(dest)
  return dest
}


// to fetch text from other pages

function fetch(url, callback) {
  var xmlHttp = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP")
  xmlHttp.onreadystatechange = function() { fetchCallback(xmlHttp, callback) }
  xmlHttp.open('GET', url, true);
  xmlHttp.send(null);
}

function fetchCallback(xmlHttp, callback) {
  if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
    callback(xmlHttp.responseText)
}

