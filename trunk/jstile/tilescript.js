// ---------- Configuration ----------
storageUrl = "./data"; // Set WebDAV directory

// ---------- Initialization ----------

window.onload = function() {
  autoexec();
  loadDocument();
}

// ---------- Data Store ----------
function loadDocument() {
  var documentName = document.location.search.slice(1) || "Home";
  document.title = documentName + " - TileScript";
  var url = "tilescript.html?" + documentName;
  $("header").innerHTML = "<a href='"+ url +"'>" + documentName + "</a>";

  var json = getfile(storageUrl + "/" + documentName + ".txt");
  var tree = eval(json);
  if (!tree) return;

  for (var i = 1; i < tree.length; i++) {
    var isTile = tree[i][0] == "tile";
    var source = tree[i][1];
    addExpression(source, isTile);
  }
}

// ---------- User Interface ----------

function toggleVisible(element) {
  var style = element.style
  if (style.display == "none") {
    style.display = "block"
    return "hide"
  }
  else {
    style.display = "none"
    return "show"
  }
}

function printIt(parent) {
  var isSource = parent.getElementsByTagName("input")[0].checked;
  var node = expressionNode(parent);
  if (isSource) {
    var tree = node.value.makeTree();
  } else {
    var tree = node.value;
  }
  var transcript = $("transcript");
  transcript.value += "tree: " + tree.printString() + "\n";
  transcript.value += "code: " + tree.makeCode() + "\n";
  transcript.value += tree.eval() + "\n";
  //  console.log(tree);
}

function toggleTile(parent) {
  var isSource = parent.getElementsByTagName("input")[0].checked;
  old = expressionNode(parent);
  if (isSource) {
    var input = document.createElement("input");
    input.className = "tile";
    input.value = old.value.makeCode();
    parent.replaceChild(input, old);
  } else {
    var newNode = old.value.makeTree().makeTile();
    adjustPadding(newNode);
    parent.replaceChild(newNode, old)
  }
}

function expressionNode(parent) {
  return document.getElementsByClassName("tile", parent)[0];
  return parent.lastChild;
}

function addExpression(source, isTile) {
  var place = $("addExpression");
  var p = document.createElement("p");
  var checked = isTile ? "" : " checked"
  if (!source) source = "3 + 4";
  p.className = "expression";
  p.innerHTML = "<img src='exclamation.gif'  onclick='printIt(this.parentNode)'/> \
<input type='checkbox' onclick='toggleTile(this.parentNode)'" + checked + "> \
<input class='tile' id='queryPlace' value='" + source + "'/>";
  place.parentNode.insertBefore(p, place);
  if (isTile) {
    toggleTile(p);
  }
}

// ---------- Tiles ----------

String.prototype.makeTree = function () {
  return JSParser.parse(this);
}

function makeSpan() {
  var span = document.createElement("span")
  span.className = "tile";
  span.draggable = new Draggable(span, { ghosting: false, revert: true });
  Droppables.add(span, { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});
  return span;
}

Array.prototype.dup = function() { return this.map(function(value) { return value instanceof Array ? value.dup() : value; }); }

Array.prototype.makeCode = function() {
  return this.makeCodes[this[0]] == undefined ? this.printString() : this.makeCodes[this[0]].apply(this)
}
Array.prototype.makeCodes = new Object()

Array.prototype.makeTile = function(modelIdx) {
  var span;
  if (modelIdx != undefined) {
    span = this[modelIdx].makeTile()
    span.modelIdx = modelIdx
    return span
  }
  span = makeSpan()
  span.value = this
  if (this.makeTiles[this[0]] != undefined) {
    this.makeTiles[this[0]].call(this, span)
    return span
  }
  var type = document.createTextNode(this[0]);
  span.appendChild(type);
  for (var idx = 1; idx < this.length; idx++) {
    var arg = this.makeTile(idx)
    span.appendChild(arg);
  }
  return span
}
Array.prototype.makeTiles = new Object()

Array.prototype.makeCodes["this"]      = function()     { return "this" }
Array.prototype.makeCodes["break"]     = function()     { return "break" }
Array.prototype.makeCodes["continue"]  = function()     { return "continue" }

Array.prototype.makeCodes["number"] = function()     { return "" + this[1] }
Array.prototype.makeTiles["number"] = function(span) { span.innerHTML = "" + span.value[1] }

Array.prototype.makeCodes["string"] = function()     { return this[1].printString() }
Array.prototype.makeTiles["string"] = function(span) { span.innerHTML = "<i>" + span.value[1] + "</i>"; }

Array.prototype.makeCodes["arr"] = function() {
  return "[" + this.clone().splice(1).map(function(x) { return x.makeCode() }).join(", ") + "]"
}
Array.prototype.makeTiles["arr"] = function(span) {
  span.appendChild(document.createTextNode("["))
  for (var idx = 1; idx < this.length; idx++) {
    if (idx > 1)
      span.appendChild(document.createTextNode(", "))
    span.appendChild(this.makeTile(idx))
  }
  span.appendChild(document.createTextNode("]"))
}

Array.prototype.makeCodes["unop"] = function() { return "(" + this[1] + this[2].makeCode() + ")" }
Array.prototype.makeTiles["unop"] = function(span) {
  span.appendChild(document.createTextNode(this[1]))
  span.appendChild(this.makeTile(2))
}

Array.prototype.makeCodes["set"] = function() { return "(" + this[1].makeCode() + " = " + this[2].makeCode() + ")" }
Array.prototype.makeTiles["set"] = function(span) {
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(" = "))
  span.appendChild(this.makeTile(2))
}

Array.prototype.makeCodes["mset"] = function() { return "(" + this[1].makeCode() + " " + this[2] + "= " + this[3].makeCode() + ")" }
Array.prototype.makeTiles["mset"] = function(span) {
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(" " + this[2] + "= "))
  span.appendChild(this.makeTile(3))
}

Array.prototype.makeCodes["binop"] = function() { return "(" + this[2].makeCode() + this[1] + this[3].makeCode() + ")" }
Array.prototype.makeTiles["binop"] = function(span) {
  span.appendChild(this.makeTile(2))
  span.appendChild(document.createTextNode(this[1]))
  span.appendChild(this.makeTile(3))
}

Array.prototype.makeCodes["preOp"] = function() { return "(" + this[1] + this[2].makeCode() + ")" }
Array.prototype.makeTiles["preOp"] = function(span) {
  span.appendChild(document.createTextNode(this[1]))
  span.appendChild(this.makeTile(2))
}

Array.prototype.makeCodes["postOp"] = function() { return "(" + this[2].makeCode() + this[1] + ")" }
Array.prototype.makeTiles["postOp"] = function(span) {
  span.appendChild(this.makeTile(2))
  span.appendChild(document.createTextNode(this[1]))
}

Array.prototype.makeCodes["return"] = function() { return "return " + this[1].makeCode() }

Array.prototype.makeCodes["if"] = function() { return "if (" + this[1].makeCode() + ")  " + this[2].makeCode() + "\n" +
                                                      "else  " + this[3].makeCode() }
Array.prototype.makeTiles["if"] = function(span) {
  span.appendChild(document.createTextNode("if ("))
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(")"))
  span.appendChild(this.makeTile(2))
  span.appendChild(document.createTextNode(" else "))
  span.appendChild(this.makeTile(3))
}

Array.prototype.makeCodes["condExpr"] = function() { return "(" + this[1].makeCode() + " ? " + this[2].makeCode() + " : " +
                                                                                               this[3].makeCode() + ")" }
Array.prototype.makeTiles["condExpr"] = function(span) {
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(" ? "))
  span.appendChild(this.makeTile(2))
  span.appendChild(document.createTextNode(" : "))
  span.appendChild(this.makeTile(3))
}

Array.prototype.makeCodes["while"] = function() { return "while (" + this[1].makeCode() + ") " + this[2].makeCode() }
Array.prototype.makeTiles["while"] = function(span) {
  span.appendChild(document.createTextNode("while ("))
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(") "))
  span.appendChild(this.makeTile(2))
}

Array.prototype.makeCodes["doWhile"] = function() { return "do {" + this[1].makeCode() + "} while (" + this[2].makeCode() + ")" }
Array.prototype.makeTiles["doWhile"] = function(span) {
  span.appendChild(document.createTextNode("do "))
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(" while ("))
  span.appendChild(this.makeTile(2))
  span.appendChild(document.createTextNode(")"))
}

Array.prototype.makeCodes["for"] = function() { return "for (" + this[1].makeCode() + "; " +
                                                                 this[2].makeCode() + "; " +
                                                                 this[3].makeCode() + ") " + this[4].makeCode() }
Array.prototype.makeTiles["for"] = function(span) {
  span.appendChild(document.createTextNode("for ("))
  span.appendChild(this.makeTile(1)); span.appendChild(document.createTextNode("; "))
  span.appendChild(this.makeTile(2)); span.appendChild(document.createTextNode("; "))
  span.appendChild(this.makeTile(3)); span.appendChild(document.createTextNode(") "))
  span.appendChild(this.makeTile(4))
}

Array.prototype.makeCodes["forIn"] = function() { return "for (" + this[1].makeCode() + " in " +
                                                                   this[2].makeCode() + ") " + this[3].makeCode() }
Array.prototype.makeTiles["forIn"] = function(span) {
  span.appendChild(document.createTextNode("for ("))
  span.appendChild(this.makeTile(1)); span.appendChild(document.createTextNode(" in "))
  span.appendChild(this.makeTile(2)); span.appendChild(document.createTextNode(") "))
  span.appendChild(this.makeTile(3))
}

Array.prototype.makeCodes["begin"] = function() {
  return "{ " + this.clone().splice(1).map(function(s) { return s.makeCode() }).join("; ") + " }"
}
Array.prototype.makeTiles["begin"] = function(span) {
  span.appendChild(document.createTextNode("{ "))
  for (var idx = 1; idx < this.length; idx++) {
    span.appendChild(this.makeTile(idx))
    span.appendChild(document.createTextNode("; "))
  }
  span.appendChild(document.createTextNode("}"))
}

Array.prototype.makeCodes["func"] = function() {
  return "(function(" + this[1].clone().splice(1).join(", ") + ") " + this[2].makeCode() + ")"
}
Array.prototype.makeTiles["func"] = function(span) {
  span.appendChild(document.createTextNode("function(" + this[1].clone().splice(1).join(", ") + ")"))
  span.appendChild(this.makeTile(2))
}


Array.prototype.makeCodes["get"] = function() {
  return this.length == 3 ?  this[2].makeCode() + "[" + this[1].makeCode() + "]" : this[1]
}
Array.prototype.makeTiles["get"] = function(span) {
  if (this.length == 3) {
    span.appendChild(this.makeTile(2))
    span.appendChild(document.createTextNode("["))
    span.appendChild(this.makeTile(1))
    span.appendChild(document.createTextNode("]"))
  }
  else
    span.appendChild(document.createTextNode(this[1]))
}

Array.prototype.makeCodes["call"] = function() {
  return this[1].makeCode() + "(" + this.clone().splice(2).map(function(a) { return a.makeCode() }).join(", ") + ")"
}
Array.prototype.makeTiles["call"] = function(span) {
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode("("))
  for (var idx = 2; idx < this.length; idx++) {
    span.appendChild(this.makeTile(idx))
    if (idx != this.length - 1)
      span.appendChild(document.createTextNode(", "))
  }
  span.appendChild(document.createTextNode(")"))
}

Array.prototype.makeCodes["send"] = function() {
  return this[2].makeCode() + "." + this[1] + "(" + this.clone().splice(3).map(function(a) { return a.makeCode() }).join(", ") + ")"
}
Array.prototype.makeTiles["send"] = function(span) {
  span.appendChild(this.makeTile(2))
  span.appendChild(document.createTextNode("." + this[1] + "("))
  for (var idx = 3; idx < this.length; idx++) {
    span.appendChild(this.makeTile(idx))
    if (idx != this.length - 1)
      span.appendChild(document.createTextNode(", "))
  }
  span.appendChild(document.createTextNode(")"))
}

Array.prototype.makeCodes["new"] = function() {
  return "new " + this[1] + "(" + this.clone().splice(2).map(function(x) { return x.makeCode() }).join(", ") + ")"
}
Array.prototype.makeTiles["new"] = function(span) {
  span.appendChild(document.createTextNode("new " + this[1] + "("))
  for (var idx = 2; idx < this.length; idx++) {
    if (idx > 2)
      span.appendChild(document.createTextNode(", "))
    span.appendChild(this.makeTile(idx))
  }
  span.appendChild(document.createTextNode(")"))
}

Array.prototype.makeCodes["var"] = function() {
  return "var " + this[1] + " = " + this[2].makeCode()
}
Array.prototype.makeTiles["var"] = function(span) {
  span.appendChild(document.createTextNode("var " + this[1] + " = "))
  span.appendChild(this.makeTile(2))
}

Array.prototype.makeCodes["throw"]  = function() { return "throw "  + this[1].makeCode() }

Array.prototype.makeCodes["try"] = function() {
  return "try {" + this[1].makeCode() + "} " +
         "catch (" + this[2] + ") { " + this[3].makeCode() + " } " +
         "finally { " + this[4].makeCode() + "}"
}
Array.prototype.makeTiles["try"] = function(span) {
  span.appendChild(document.createTextNode("try "))
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(" catch (" + this[2] + ") "))
  span.appendChild(this.makeTile(3))
  span.appendChild(document.createTextNode(" finally "))
  span.appendChild(this.makeTile(4))
}

Array.prototype.makeCodes["json"] = function() {
  return "({" + this.clone().splice(1).map(function(b) { return b.makeCode() }).join(", ") + "})"
}
Array.prototype.makeTiles["json"] = function(span) {
  span.appendChild(document.createTextNode("{"))
  for (var idx = 1; idx < this.length; idx++) {
    if (idx > 1)
      span.appendChild(document.createTextNode(", "))
    span.appendChild(this.makeTile(idx))
  }
  span.appendChild(document.createTextNode("}"))
}

Array.prototype.makeCodes["binding"] = function() { return this[1].printString() + ": " + this[2].makeCode() }
Array.prototype.makeTiles["binding"] = function(span) {
  span.appendChild(document.createTextNode(this[1] + ": "))
  span.appendChild(this.makeTile(2))
}

Array.prototype.makeCodes["switch"] = function() {
  return "switch (" + this[1].makeCode() + ") {" + this.clone().splice(2).map(function(c) { return c.makeCode() }).join("; ") + "}"
}
Array.prototype.makeTiles["switch"] = function(span) {
  span.appendChild(document.createTextNode("switch ("))
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(") { "))
  for (var idx = 2; idx < this.length; idx++)
    span.appendChild(this.makeTile(idx))
  span.appendChild(document.createTextNode(" }"))
}

Array.prototype.makeCodes["case"] = function() { return "case " + this[1].makeCode() + ": " + this[2].makeCode() }
Array.prototype.makeTiles["case"] = function(span) {
  span.appendChild(document.createTextNode("case "))
  span.appendChild(this.makeTile(1))
  span.appendChild(document.createTextNode(": "))
  span.appendChild(this.makeTile(2))
}

Array.prototype.makeCodes["default"] = function() { return "default: " + this[1].makeCode() }
Array.prototype.makeTiles["default"] = function(span) {
  span.appendChild(document.createTextNode("default: "))
  span.appendChild(this.makeTile(1))
}

function acceptDrop(element, target) {
  var parent      = target.parentNode,
      elementCopy = element.value.dup().makeTile()
  if (target.modelIdx != undefined) {
    elementCopy.modelIdx = target.modelIdx
    parent.value[target.modelIdx] = elementCopy.value
  }
  parent.replaceChild(elementCopy, target)
  adjustPadding(findTop(elementCopy))
}

/* adjust the tile's padding based on the depth */
function adjustPadding(tile) {
  var max = 0
  for (var idx = 0; idx < tile.childNodes.length; idx++) {
    var padding = adjustPadding(tile.childNodes[idx])
    if (padding > max) 
      max = padding
  }
  max += 2
  if (tile.style != undefined)
    tile.style.padding = max + "px"
  return max
}

function findTop(tile) { return tile.parentNode.className == "tile" ? findTop(tile.parentNode) : tile }

// ---------- Evaluation ----------

Array.prototype.eval = function() { return eval(this.makeCode()) }

// ---------- Utilities ----------

function getfile(url) {
  ajax = new Ajax.Request(
    url,
    {
      method: "get",
      asynchronous: false,
      parameters: ""
      //      onException: function(req, e) { alert(e) }
    });
  return ajax.transport.responseText;
}