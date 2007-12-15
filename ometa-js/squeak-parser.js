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


SqueakParser = Parser.delegated()
SqueakParser.space = function() {
  var $elf = this
  return this._or(function() { return OMeta.space.call($elf) },
                  function() { 
                    $elf._applyWithArgs("exactly", "\"")
                    $elf._many(function() {
                                 $elf._not(function() { return $elf._applyWithArgs("exactly", "\"") })
                                 $elf._apply("char")
                               })
                    return $elf._applyWithArgs("exactly", "\"")
                  })
}
SqueakParser.arrayConstr = function() {
  this._applyWithArgs("token", "{")
  var r = this._applyWithArgs("listOf", "expr", ".")
  this._applyWithArgs("token", "}")
  return ["[", r.delimWith(", "), "]"]
}
SqueakParser.arrayLit = function() {
  var $elf = this
  this._applyWithArgs("token", "#")
  this._applyWithArgs("token", "(")
  var r = this._many(function() { return $elf._or(function() { return $elf._apply("literal") },
                                                  function() { return $elf._apply("arrayLit") },
                                                  function() {
                                                    $elf._apply("spaces")
                                                    return $elf._apply("tsArraySymbol")
                                                  })
                     })
  this._applyWithArgs("token", ")")
  return ["[", r.delimWith(", ") , "]"]
}
SqueakParser.binary = function() {
  this._apply("spaces")
  return this._apply("tsBinary")
}
SqueakParser.binaryExpr = function() {
  var $elf = this
  return this._or(function() {
                    var r = $elf._apply("binaryExpr"), m = $elf._apply("binaryMsg")
                    return [r, m]
                  },
                  function() {
                    var r = $elf._apply("unaryExpr")
                    return r
                  })
}
SqueakParser.binaryMsg = function() {
  var s = this._apply("binary"),
      a = this._apply("unaryExpr")
  return [".sendBinaryMessage(", s, ", ", a, ")"]
}
SqueakParser.block = function() {
  var $elf   = this
      argsOk = this._apply("anything")
  this._applyWithArgs("token", "[")
  var args = this._or(function() {
                        $elf._pred(argsOk)
                        var r = $elf._many1(function() {
                                              $elf._applyWithArgs("token", ":")
                                              return $elf._apply("identifier")
                                            })
                        $elf._applyWithArgs("token", "|")
                        return r.delimWith(", ")
                      },
                      function() { return "" }),
      tmps = this._or(function() {
                        $elf._applyWithArgs("token", "|")
                        var r = $elf._many1(function() { return $elf._apply("identifier") })
                        $elf._applyWithArgs("token", "|")
                        return ["var ", r.delimWith(", "), "; "]
                      },
                      function() { return "" }),
      body = this._or(function() {
                        var r = $elf._applyWithArgs("listOf", "expr", ".")
                        return r.delimWith("; ")
                      },
                      function() { return ["null"] }),
      ret  = this._or(function() {
                        $elf._or(function() {
                                   $elf._pred(body.length > 0)
                                   return $elf._applyWithArgs("token", ".")
                                 },
                                 function() { return true })
                        $elf._applyWithArgs("token", "^")
                        var r = $elf._apply("expr")
                        return ["throw new Return(", r, ")"]
                      },
                      function() {
                        if (argsOk)
                          body[body.length - 1] = ["return ", body[body.length - 1]]
                        return ""
                      })
  this._or(function() { return $elf._applyWithArgs("token", ".") },
           function() { return true })
  this._applyWithArgs("token", "]")
  return ["(function (", args, ") { ", tmps, body, "; ", ret, " })"]
}
SqueakParser.cascade = function() {
  var $elf = this
  return this._or(function() { return $elf._apply("unaryMsg") },
                  function() { return $elf._apply("binaryMsg") },
                  function() { return $elf._apply("keywordMsg") })
}
SqueakParser.expr = function() {
  var $elf = this
  return this._or(function() {
                    var v = $elf._apply("identifier")
                    $elf._or(function() { return $elf._applyWithArgs("token", ":=") },
                             function() { return $elf._applyWithArgs("token", "_") })
                    var e = $elf._apply("expr")
                    return [v, " = ", e]
                  },
                  function() { return $elf._apply("msgExpr") })
}
SqueakParser.identifier = function() {
  this._apply("spaces")
  var $elf = this,
      i    = this._apply("tsIdentifier")
  this._not(function() { return $elf._applyWithArgs("exactly", ":") })
  i = i.squish().join('')
  return i == "self" ? "$elf" : i
}
SqueakParser.keyword = function() {
  this._apply("spaces")
  return this._apply("tsKeyword")
}
SqueakParser.keywordExpr = function() {
  var recv = this._apply("binaryExpr"),
      msg  = this._apply("keywordMsg")
  return [["(", recv, ")"], msg]
}
SqueakParser.keywordMsg = function() {
  var $elf  = this,
      parts = this._many1(function() { return $elf._apply("keywordMsgPart") }),
      ks = [], as = [], ok = false
  for (var idx = 0; idx < parts.length; idx++) {
    if (parts[idx][0].length > 0)
      ok = true
    ks.push(parts[idx][0])
    as.push(parts[idx][1])
  }
  this._pred(ok)
  ks = ks.squish().join('')
  if ($elf.isJSKeyword[ks] >= 0)
    return [".performwithArguments('", ks, "', [", as.delimWith(", "), "])"]
  else
    return [".", ks, "(", as.delimWith(", "), ")"]
}
SqueakParser.keywordMsgPart = function() {
  var k = this._apply("keyword"),
      x = this._apply("binaryExpr")
  return [k, x]
}
SqueakParser.literal = function() {
  this._apply("spaces")
  var $elf = this
  return this._or(function() {
                    var n = $elf._apply("tsNumber")
                    return ["(", n, ")"]
                  },
                  function() { return $elf._apply("tsCharacter") },
                  function() { return $elf._apply("tsString") },
                  function() { return $elf._apply("tsSymbol") })
}
SqueakParser.msgExpr = function() {
  var $elf = this
  var e    = this._or(function() { return $elf._apply("keywordExpr") },
                      function() { return $elf._apply("binaryExpr") })
  return this._or(function() {
                    var cs = $elf._many1(function() {
                                           $elf._applyWithArgs("token", ";")
                                           return $elf._apply("cascade")
                                         })
                    if (e.length > 1)
                      cs.splice(0, 0, e[1])
                    cs = cs.map(function(c) { return ["_recv", c, "; "] })
                    cs[cs.length - 1] = ["return ", cs[cs.length - 1]]
                    return ["(function (_recv) { ", cs, " })(", e[0], ")"]
                  },
                  function() { return e })
}
SqueakParser.tcBinaryChar = function() {
  var $elf = this,
      x    = this._apply("char")
  this._pred($elf.typeTable[x.charCodeAt(0)] == "xBinary")
  return x
}
SqueakParser.tsArraySymbol = function() {
  var $elf = this
  return $elf._or(function() {
                    var ks = $elf._many1(function() { return $elf._apply("tsKeyword") }),
                        i  = $elf._or(function() { return $elf._apply("tsIdentifier") },
                                     function() { return "" })
                    return ["'", ks, i, "'"]
                  },
                  function() {
                    var r = $elf._apply("tsIdentifier")
                    return ["'", r, "'"]
                  },
                  function() { return $elf._apply("tsBinary") })
}
SqueakParser.tsBinary = function() {
  var $elf = this,
      x    = this._or(function() { return $elf._applyWithArgs("exactly", "|") },
                      function() { return $elf._apply("tcBinaryChar") }),
      xs   = this._many(function() { return $elf._apply("tcBinaryChar") })
  return ["'", x, xs, "'"]
}
SqueakParser.tsCharacter = function() {
  this._applyWithArgs("exactly", "$")
  var c = this._apply("char")
  return ["'", escapeChar(c), "'"]
}
SqueakParser.tsIdentifier = function() { return this._applyWithArgs("firstAndRest", "letter", "letterOrDigit") },
SqueakParser.tsKeyword = function() {
  var $elf = this,
      i    = this._or(function() { return $elf._apply("tsIdentifier") },
                      function() { return "" })
  this._applyWithArgs("exactly", ":")
  return i
}
SqueakParser.tsNatural = function() {
  var $elf = this
  return this._many1(function() { return $elf._apply("digit") })
}
SqueakParser.tsNumber = function() {
  var $elf = this
  return this._or(function() {
                    $elf._or(function() { return $elf._applyWithArgs("exactly", "+") },
                             function() { return $elf._apply("empty") })
                    return $elf._apply("tsNatural")
                  },
                  function() {
                    $elf._applyWithArgs("exactly", "-")
                    var n = $elf._apply("tsNatural")
                    return ["-", n]
                  })
}
SqueakParser.tsString = function() {
  var $elf = this
  this._applyWithArgs("exactly", "'")
  var cs = this._many(function() {
                        var c = $elf._or(function() {
                                           $elf._applyWithArgs("exactly", "'")
                                           return $elf._applyWithArgs("exactly", "'")
                                         },
                                         function() {
                                           $elf._not(function() { return $elf._applyWithArgs("exactly", "'") })
                                           return $elf._apply("char")
                                         })
                        return escapeChar(c)
                      })
  this._applyWithArgs("exactly", "'")
  return ["'", cs, "'"]
}
SqueakParser.tsSymbol = function() {
  var $elf = this
  this._applyWithArgs("exactly", "#")
  this._apply("spaces")
  return $elf._or(function() { return $elf._apply("tsString") },
                  function() { return $elf._apply("tsArraySymbol") })
}
SqueakParser.unaryMsg = function() {
  var $elf = this,
      sel  = this._apply("identifier")
  return [".sendUnaryMessage('", sel, "')"]
}
SqueakParser.unaryExpr = function() {
  var $elf = this
  return this._or(function() {
                    var e = $elf._apply("unaryExpr"),
                        m = $elf._apply("unaryMsg")
                    return [e, m]
                  },
                  function() {
                    var e = $elf._apply("unit")
                    return [e]
                  })
}
SqueakParser.unit = function() {
  var $elf = this
  return this._or(function() { return $elf._apply("literal") },
                  function() { return $elf._apply("identifier") },
                  function() { return $elf._apply("arrayLit") },
                  function() { return $elf._apply("arrayConstr") },
                  function() { return $elf._applyWithArgs("block", true) },
                  function() {
                    $elf._applyWithArgs("token", "(")
                    var r = $elf._apply("expr")
                    $elf._applyWithArgs("token", ")")
                    return ["(", r, ")"]
                  })
}

SqueakParser.typeTable =
  ["xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xDelimiter", "xDelimiter",
   "xBinary", "xDelimiter", "xDelimiter", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary",
   "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "doIt", "xBinary", "xDelimiter",
   "xBinary", "xDoubleQuote", "xLitQuote", "xDollar", "xBinary", "xBinary", "xSingleQuote", "leftParenthesis", "rightParenthesis",
   "xBinary", "xBinary", "xBinary", "xBinary", "period", "xBinary", "xDigit", "xDigit", "xDigit", "xDigit", "xDigit", "xDigit",
   "xDigit", "xDigit", "xDigit", "xDigit", "xColon", "semicolon", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "leftBracket", "xBinary", "rightBracket", "upArrow", "leftArrow", "xBinary", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "leftBrace", "verticalBar", "rightBrace", "xBinary", "xBinary", "xBinary", "xBinary",
   "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary",
   "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary",
   "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary",
   "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xLetter", "xBinary", "xBinary", "xBinary",
   "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xLetter", "xBinary", "xBinary", "xBinary",
   "xBinary", "xLetter", "xBinary", "xBinary", "xBinary", "xBinary", "xBinary", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xBinary", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xLetter", "xBinary", "xLetter", "xLetter", "xLetter",
   "xLetter", "xLetter", "xLetter", "xLetter", "xLetter"]

SqueakParser.isJSKeyword = {}
keywords =
  ["break", "case", "catch", "continue", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof",
   "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"]
for (var idx = 0; idx < keywords.length; idx++)
  SqueakParser.isJSKeyword[keywords[idx]] = true

escapeStringFor = new Object()
for (var c = 0; c < 256; c++)
  escapeStringFor[c] = String.fromCharCode(c)
escapeStringFor["'".charCodeAt(0)]  = "\\'"
escapeStringFor["\r".charCodeAt(0)] = "\\r"
escapeStringFor["\n".charCodeAt(0)] = "\\n"
escapeStringFor["\t".charCodeAt(0)] = "\\t"
escapeChar = function(c) { return escapeStringFor[c.charCodeAt(0)] }

String.prototype.escape = function() {
  var r = []
  for (var idx = 0; idx < this.length; idx++)
    r.push(escapeChar(this.charAt(idx)))
  return r.squish().join('')
}

