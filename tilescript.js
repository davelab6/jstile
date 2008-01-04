// ---------- Configuration ----------

StorageUrl = "data"; // Set WebDAV directory

if (window.console == undefined) {
  console = {log: function () {}};
}

// ---------- Initialize ----------

UseDAV = false;
DocumentTitle = "";
SyncTimer = null;

function initializeDocument() {
  UseDAV = document.location.protocol == "http:";
  syncTitle();
  setInterval(syncTitle, 500);
  $("transcript").hide();
}

function syncTitle() {
  if (!getTitle()) {
    go("Home");
  } else if (DocumentTitle != getTitle()) {
    go(getTitle());
  }
}

function go(name) {
  if (!name) return;
  DocumentTitle = name;
  document.location.hash = "#" + name;
  reload();
}

function getTitle() {
    if ((!document.location.hash) ||
        (document.location.hash.length < 2)) return undefined;
  return document.location.hash.slice(1)
}

// ---------- User Interface ----------

function _getTitle() {
  if ((!document.location.hash) ||
      (document.location.hash.length < 2)) return "Home";
  return document.location.hash.slice(1)
}

function reload() {
  var rows = $("rows");
  while (rows.childNodes.length > 0) {
    rows.removeChild(rows.firstChild);
  }
  loadDocument();
}

function save() {
  var rows = $("rows");
  var values = [];
  values.push("tilescript");
  var children = rows.childNodes;
  for (var i = 0; i < children.length; i++) {
    var nodeType = children[i].viewMode;
    var nodeValue = children[i].sourceCode();
    values.push([nodeType, nodeValue]);
  }
  saveFile(StorageUrl + "/" + getTitle() + ".txt", values.toJSON());
}

function printIt(row) {
  var source = row.sourceCode();
  var transcript = $("transcript");
  //  transcript.value += "tree: " + source.makeTree().printString() + "\n";
  //  transcript.value += "code: " + source + "\n";
  var result = eval(source);
  transcript.value += result + "\n";
  if (result != undefined) {
    var newRow = addRow(result.printString(), "source", row);
    $(newRow).visualEffect("BlindDown", {duration: 0.4});

  }
}

function removeRow(row) {
  $(row).visualEffect("BlindUp", {
    duration: 0.3,
    afterFinish: function() {row.parentNode.removeChild(row)}
  });

}

Row = {
  className: "row",

  rowNode: function() {
    return document.getElementsByClassName("tile", this.valueParent)[0];
  },
  printItButton: function() {
    return document.getElementsByClassName("printIt", this.rowTool)[0];
  },
  sourceCode: function() {
    var rowNode = this.rowNode();
    if (rowNode.viewMode == "source") {
      return this.rowNode().value;
    } else if (rowNode.viewMode == "html") {
      return this.rowNode().value;
    } else {
      return this.rowNode().value.makeCode();
    }
  },
  newNodeBuild: {
    source: function(source) {
      var newNode = document.createElement("textarea");
      newNode.viewMode = "source";
      newNode.className = "tile";
      newNode.layoutChanged = function() {};
      newNode.rows = source.split("\n").length;
      newNode.value = source;
      return newNode;
    },
    html: function(source) {
      var newNode = document.createElement("div");
      newNode.viewMode = "html";
      newNode.className = "tile";
      newNode.layoutChanged = function() {};
      $(newNode).update(source);
      newNode.value = source;
      return newNode;
    },
    tile: function(source) {
      var newNode = source.makeTree().makeTile();
      newNode.viewMode = "tile";
      newNode.className = "tile";
      return newNode;
    }
  },
  setViewMode: function(mode) {
    var old = this.rowNode();
    this.viewMode = mode;
    var newNode = this.newNodeBuild[mode](this.sourceCode());
    this.valueParent.replaceChild(newNode, old);
    window.row = this;
  },
  toggleTile: function() {
    var mode;
    if (this.viewMode != "source") {
      mode = "source";
    } else if (this.sourceCode().charAt(0) == "<") {
      mode = "html";
    } else {
      mode = "tile";
    }
    this.setViewMode(mode);
    if (mode == "tile") {
      this.valueParent.layoutChanged();
    }
  }
}

function newRow(source, viewMode) {
  var checked = viewMode == "source" ?" checked" : ""; 

  var rowTool = Object.extend(document.createElement("div"), {
    className: "rowTool",
    innerHTML:
    "<img src='exclamation.gif' onclick='printIt(this.parentNode.parentNode)' class='printIt'/>" +
    "<img src='x.gif' onclick='removeRow(this.parentNode.parentNode)' class='printIt'/>" +
    "<input type='checkbox' class='checkbox' class='checkbox' onclick='this.parentNode.parentNode.toggleTile()' " + checked + "/>" +
    "</div>"
  });
    
  var valueParent = Object.extend(document.createElement("div"), {
    className: "valueParent",
    layoutChanged: function() {
      this.firstChild.layoutChanged();
      this.style.lineHeight = $(this.firstChild).getHeight() + "px";
    }
  });
  valueParent.appendChild(Row.newNodeBuild.source(source));

  var newLine = Object.extend(document.createElement("div"), {
    className: "newLine",
    onmouseover: function() { this.className = "newLineEnter" },
    onmouseout: function() { this.className = "newLine" },
    onclick: function() {
      var row = addRow('', "source", this.parentNode);
      $(row).visualEffect("BlindDown", {duration: 0.3});
    },
    title: "Add a new row here"
  });

  var p = Object.extend(document.createElement("p"), Row);
  p.rowTool = rowTool;
  p.valueParent = valueParent;
  p.appendChild(rowTool);
  p.appendChild(valueParent);
  p.appendChild(newLine);
  p.setViewMode(viewMode);
  return p;
}

function addRow(source, viewMode, after) {
  var p = newRow(source, viewMode);
  var rowNodes = $("rows").childNodes;

  var i;
  for (i = 0; i < rowNodes.length; i++) {
    if (rowNodes[i] == after) break;
  }
  if (rowNodes[i + 1]) {
    $("rows").insertBefore(p, rowNodes[i + 1]);
  } else {
    $("rows").appendChild(p);
  }
  if (viewMode == "tile") {
    p.valueParent.layoutChanged();
  }
  return p;
}

// ---------- Tiles ----------

String.prototype.makeTree = function () {
  return JSParser.parse(this);
}

function makeSpan() {
  var span = document.createElement("span")
  span.className = "tile";
  span.layoutChanged = spanLayoutChanged;
  span.draggable = new Draggable(span, { ghosting: false, revert: true });
  Droppables.add(span, { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});
  return span;
}

/* adjust the tile's padding based on the depth */
function spanLayoutChanged() {
  var max = 0
  for (var idx = 0; idx < this.childNodes.length; idx++) {
    var child = this.childNodes[idx];
    if (child.layoutChanged) {
      var padding = child.layoutChanged();
      if (padding > max) max = padding;
    }
  }
  max += 2
  if (this.style != undefined)
    this.style.padding = max + "px"
  return max
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
  parent.replaceChild(elementCopy, target);
  findTop(elementCopy).layoutChanged()
}

function findTop(tile) { return (tile.parentNode.className == "tile" || tile.parentNode.className == "valueParent") ? findTop(tile.parentNode) : tile }

// ---------- Evaluation ----------

Array.prototype.eval = function() { return eval(this.makeCode()) }

// ---------- Data Storage ----------

function loadDocument() {
  var title = getTitle();

  document.title = title + " - TileScript";
  $("control").action = document.location.href;
  $("title").innerHTML = "<a href='"+ location.href +"'>" + title + "</a>";

  var json = getfile(StorageUrl + "/" + title + ".txt");
  var tree = eval(json);
  if (!tree) {
    addRow("\"This is an empty page.\"", "tile");
    return;
  }

  for (var i = 1; i < tree.length; i++) {
    var viewMode = tree[i][0];
    var source = tree[i][1];
    addRow(source, viewMode);
  }
}

function getfile(url) {
  ajax = new Ajax.Request(
    url,
    {
      method: "get",
      asynchronous: false,
      requestHeaders: ["If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT"],
      parameters: ""
      //      onException: function(req, e) { alert(e) }
    });
  if (ajax.transport.status.toString().charAt(0) == "4") return "";
  return ajax.transport.responseText;
}

function saveFile(url, contents) {
  if (UseDAV) {
    return saveFileWithDAV(url, contents);
  } else if (Prototype.Browser.Gecko) {
    return saveFileWithMozilla(url, contents);
  }
}

function saveFileWithDAV(url, contents) {
  var ajax = new Ajax.Request(
    url,
    {
      method: "put", 
      asynchronous: false,
      postBody: contents,
      onFailure: function (e) {alert(e)}
     });
  //  alert(ajax.transport.status);
}

// http://ask.metafilter.com/34651/Saving-files-with-Javascript
function saveFileWithMozilla(url, content)
{
  // very naive path conversion
  var filePath;
  var pathname = location.pathname;
  if(pathname.charAt(2) == ":") {
	var directory = pathname.replace(/[^/]*$/, "").slice(1);
	filePath = (directory + url).replace(new RegExp("/","g"),"\\");
  } else {
	var directory = location.pathname.replace(/[^/]*$/, "");
	filePath = (directory + url);
  }

    if(window.Components)
        try
            {
            netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            file.initWithPath(filePath);
            if (!file.exists())
                file.create(0, 0664);
            var out = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
            out.init(file, 0x20 | 0x02, 00004,null);
            out.write(content, content.length);
            out.flush();
            out.close();
            return(true);
            }
        catch(e)
            {
            alert("Exception while attempting to save\n\n" + e);
            return(false);
            }
    return(null);
}
