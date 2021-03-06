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


Parser = OMeta.delegated()
Parser.listOf = function() {
  var $elf  = this,
      rule  = this._apply("anything"),
      delim = this._apply("anything")
  return this._or(function() {
                    var r = $elf._apply(rule)
                    return $elf._many(function() {
                                        $elf._applyWithArgs("token", delim)
                                        return $elf._apply(rule)
                                      },
                                      r)
                  },
                  function() { return [] })
}
Parser.token = function() {
  var cs = this._apply("anything")
  this._apply("spaces")
  return this._applyWithArgs("seq", cs)
}
Parser.parse = function() {
  var rule = this._apply("anything"),
      ans  = this._apply(rule)
  this._apply("end")
  return ans
}
Parser.parsewith = function(text, rule) {
  try { return this.matchAllwith(text, rule) }
  catch (e) {
    if (e instanceof Fail)
      e.failPos = e.matcher.input.realPos() - 1
    throw e
  }
}

