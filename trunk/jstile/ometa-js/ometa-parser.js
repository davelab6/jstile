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


OMetaParser = Parser.delegated()
OMetaParser.SqueakParser = SqueakParser // poor man's virtual class
OMetaParser.application = function() {
  var $elf = this
  this._applyWithArgs("token", "<")
  this._apply("spaces")
  var rule = this._apply("name").squish().join(''),
      r    = this._or(function() {
                        $elf._pred(rule == "super")
                        var srule = $elf._applyWithArgs("foreign", $elf.SqueakParser, "unit"),
                            args  = $elf._many(function() { return $elf._applyWithArgs("foreign", $elf.SqueakParser, "unit") })
                        args = args.delimWith(", ")
                        if (args.length > 0)
                          args = [", ", args]
                        return [$elf._super, "._superApplyWithArgs($elf, ", srule, args, ")"]
                      },
                      function() {
                        var args = $elf._many1(function() { return $elf._applyWithArgs("foreign", $elf.SqueakParser, "unit") })
                        return ["$elf._applyWithArgs('", rule, "', ", args.delimWith(", "), ")"]
                      },
                      function() {
                        return ["$elf._apply('", rule, "')"]
                      })
  this._applyWithArgs("token", ">")
  return r
}
OMetaParser.character = function() {
  this._applyWithArgs("token", "$")
  var r = this._apply("char")
  return printString(r)
}
OMetaParser.expr = function() {
  var $elf = this,
      x    = this._apply("expr4"),
      xs   = this._many(function() {
                          $elf._applyWithArgs("token", "|")
                          return $elf._apply("expr4")
                        })
  xs.splice(0, 0, x)
  xs = xs.map(function(x) {
                if (x.length > 0)
                  x[x.length - 1] = ["return ", x[x.length - 1]]
                return ["function() { ", x, " }"]
              })
  return ["$elf._or(", xs.delimWith(", "), ")"]
}
OMetaParser.expr1 = function() {
  var $elf = this
  return this._or(function() { return $elf._apply("application") },
                  function() { return $elf._apply("semanticAction") },
                  function() { return $elf._apply("semanticPredicate") },
                  function() {
                    var x = $elf._or(function() { return $elf._applyWithArgs("keyword", "nil") },
                                    function() { return $elf._applyWithArgs("keyword", "true") },
                                    function() { return $elf._applyWithArgs("keyword", "false") },
                                    function() { return $elf._applyWithArgs("keyword", "undefined") },
                                    function() { return $elf._apply("number") },
                                    function() { return $elf._apply("string") },
                                    function() { return $elf._apply("character") })
                    return ["$elf._applyWithArgs('exactly', ", x, ")"]
                  },
                  function() {
                    $elf._applyWithArgs("token", '"')
                    var cs = $elf._many(function() {
                                          $elf._not(function() { return $elf._applyWithArgs("exactly", '"') })
                                          return $elf._apply("char")
                                        })
                    $elf._applyWithArgs("exactly", '"')
                    var r = ["'", cs.map(function(c) { return escapeChar(c) }), "'"]
                    cs = cs.map(function(c) { return ["$elf._applyWithArgs('exactly', '", escapeChar(c), "')"] }).delimWith(";")
                    if (cs.length > 0)
                      cs[cs.length - 1] = [cs[cs.length - 1], "; "]
                    return ["(function() { ", cs, " return ", r, " })()"]
                  },
                  function() {
                    $elf._applyWithArgs("token", "(")
                    var r = $elf._apply("expr")
                    $elf._applyWithArgs("token", ")")
                    return r
                  },
                  function() {
                    $elf._applyWithArgs("token", "{")
                    $elf._applyWithArgs("token", "}")
                    return "$elf._form(function() { return true })"
                  },
                  function() {
                    $elf._applyWithArgs("token", "{")
                    var x = $elf._apply("expr")
                    $elf._applyWithArgs("token", "}")
                    return ["$elf._form(function() { return ", x, " })"]
                  })
}
OMetaParser.expr2 = function() {
  var $elf = this
  return $elf._or(function() {
                    $elf._applyWithArgs("token", "~")
                    var x = $elf._apply("expr2")
                    return ["$elf._not(function() { return ", x, " })"]
                  },
                  function() {
                    $elf._applyWithArgs("token", "&")
                    var x = $elf._apply("expr1")
                    return ["$elf._lookahead(function() { return ", x, " })"]
                  },
                  function() { return $elf._apply("expr1") })
}
OMetaParser.expr3 = function() {
  var $elf = this
  return this._or(function() {
                    var r = $elf._apply("expr2")
                    $elf._or(function() {
                               $elf._applyWithArgs("token", "*")
                               r = ["$elf._many(function() { return ", r, " })"]
                               return true
                             },
                             function() {
                               $elf._applyWithArgs("token", "+")
                               r = ["$elf._many1(function() { return ", r, " })"]
                               return true
                             },
                             function() { return true })
                    return $elf._or(function() {
                                      $elf._applyWithArgs("exactly", ":")
                                      var n = $elf._apply("name").squish().join('')
                                      $elf.ruleLocals[n] = true
                                      return [n, " = ", r]
                                    },
                                    function() { return r })
                  },
                  function() {
                    $elf._applyWithArgs("token", ":")
                    var n = $elf._apply("name").squish().join('')
                    $elf.ruleLocals[n] = true
                    return [n, " = $elf._apply('anything')"]
                  })
}
OMetaParser.expr4 = function() {
  var $elf = this,
      xs   = $elf._many(function() { return $elf._apply("expr3") })
  return xs.delimWith("; ")
}
OMetaParser.hostLanguageExpression = function() {
  var $elf = this,
      r    = $elf._applyWithArgs("foreign", this.SqueakParser, "listOf", "expr", ".")
  if (r.length > 0)
    r[r.length - 1] = ["return ", r[r.length - 1]]
  else
    r = ["return null"]
  return ["(function() { ", r.delimWith("; "), " })()"]
}
OMetaParser.keyword = function() {
  var $elf = this,
      xs   = this._apply("anything")
  this._applyWithArgs("token", xs)
  this._not(function() { return $elf._apply("letterOrDigit") })
  return xs
}
OMetaParser.name = function() { return this._applyWithArgs("firstAndRest", "letter", "letterOrDigit") },
OMetaParser.number = function() {
  var $elf = this
  this._apply("spaces")
  var sign = this._or(function() { return $elf._applyWithArgs("exactly", "-") },
                      function() { return "" }),
      n    = this._many1(function() { return $elf._apply("digit") })
  return [sign, n]
}
OMetaParser.rule = function() {
  var $elf = this
  this.ruleLocals = new Object()
  this._apply("spaces")
  var name = this._lookahead(function() { return $elf._apply("name") })
  if (this.rules[name] != undefined) {
    alert("error: multiple versions of rule " + name.squish().join(''))
    throw new Fail()
  }
  this.rules[name] = true
  var x    = this._applyWithArgs("rulePart", name),
      xs   = this._many(function() {
                          $elf._applyWithArgs("token", ";")
                          return $elf._applyWithArgs("rulePart", name)
                        })
  this._applyWithArgs("token", ".")
  xs.splice(0, 0, x)
  xs = ["this._or(", xs.delimWith(", "), ")"]
  this.ruleLocals = this.ruleLocals.ownPropertyNames()
  this.ruleLocals = this.ruleLocals.length > 0 ? ["var ", this.ruleLocals.delimWith(", "), "; "] : ""
  return [this.grammarName, "['", name, "'] = function() { var $elf = this; ", this.ruleLocals, " return ", xs, " }"]
}
OMetaParser.rulePart = function() {
  var $elf         = this,
      requiredName = this._apply("anything")
  this._apply("spaces")
  var name         = this._apply("name")
  this._pred(name.squish().join('') == requiredName.squish().join(''))
  var body = this._apply("expr4")
  body = this._or(function() {
                   $elf._applyWithArgs("token", "::=")
                   var body2 = $elf._apply("expr")
                   body2 = ["return ", body2]
                   return body.length > 0 ? [body, "; ", body2] : body2
                 },
                 function() {
                   if (body.length > 0)
                     body[body.length - 1] = ["return ", body[body.length - 1]]
                   return body
                 })
  return ["function() { ", body, " }"]
}
OMetaParser.semanticAction = function() {
  var $elf = this
  return this._or(function() {
                    $elf._applyWithArgs("token", "![")
                    var r = $elf._apply("hostLanguageExpression")
                    $elf._applyWithArgs("token", "]")
                    return r
                  },
                  function() {
                    $elf._applyWithArgs("token", "=>")
                    $elf._applyWithArgs("token", "[")
                    var r = $elf._apply("hostLanguageExpression")
                    $elf._applyWithArgs("token", "]")
                    return r
                  })
}
OMetaParser.semanticPredicate = function() {
  this._applyWithArgs("token", "?[")
  var r = this._apply("hostLanguageExpression")
  this._applyWithArgs("token", "]")
  return ["$elf._pred(", r, ")"]
}
OMetaParser.string = function() {
  var $elf = this
  return this._or(function() {
                    $elf._or(function() { return $elf._applyWithArgs("token", "#") },
                             function() { return $elf._apply("spaces") })
                    return $elf._applyWithArgs("foreign", $elf.SqueakParser, "tsString")
                 },
                 function() {
                   $elf._applyWithArgs("token", "#")
                   var r = $elf._apply("name")
                   return ["'", r, "'"]
                 })
}
OMetaParser.grammar = function() {
  var $elf = this
  this.rules = new Object()
  this._applyWithArgs("foreign", this.SqueakParser, "spaces")
  this._applyWithArgs("keyword", "ometa")
  this._applyWithArgs("foreign", this.SqueakParser, "spaces")
  this.grammarName = this._apply("name").squish().join('')
  this._super = this._or(function() {
                           $elf._applyWithArgs("token", ":");
                           $elf._apply("spaces");
                           var r = $elf._apply("name")
                           return r
                         },
                         function() { return "OMeta" })
  this._applyWithArgs("token", "{")
  var rules = this._many(function() { return $elf._apply("rule") })
  rules = rules.delimWith("; ")
  if (rules.length > 0)
    rules = [rules, "; "]
  this._applyWithArgs("token", "}")
  return [this.grammarName, " = ", this._super, ".delegated(); ", rules, this.grammarName, "; ",
          this.grammarName, ".prototype = ", this.grammarName, "; "]
}

OMeta._pred = function(b) {
  if (b.asBoolean())
    return true
  throw new Fail()
}

