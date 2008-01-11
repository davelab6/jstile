// ---------- Configuration ----------

StorageUrl = "data"; // Set WebDAV directory

if (window.console == undefined) { console = {log: function () {}}; }

// ---------- Initialize ----------

UseDAV = false;
SyncTimer = null;
IsDirty = false;

function initializeDocument() {
  UseDAV = document.location.protocol == "http:";
  DocPosition.startSync();
  $("transcript").hide();
  Event.observe(window, "keydown", onShortCutKey); // For Firefox
  Event.observe(document.body, "keydown", onShortCutKey); // For IE
  Editor.initialize();

  window.onbeforeunload = function(event) {
    event = event || window.event; 
    if (IsDirty) {
      event.returnValue = 'This page is modified.';
    }
  }
  Viewer.startSync();
}

// ---------- Page Navigation ----------

DocPosition = Class.create();
DocPosition.prototype = {
  title: "",
  division: 0,

  initialize: function(newTitle, newDivition) {
    this.title = newTitle;
    this.division = newDivition || 0;
  },
  hash: function() {
    if (this.division) {
      return "#" + this.title + "#" + this.division;
    } else {
      return "#" + this.title;
    }
  },
  next: function() {
    return new DocPosition(this.title, this.division + 1);
  }
}

DocPosition.fromName =  function(name) {
  var array = name.match(/^([^#]*)#?(.*)$/);
  return new this(array[1], array[2]);
}

DocPosition.current = new DocPosition("", 0);

DocPosition.go = function(newPosition) {
  if (this.current.title != newPosition.title) {
    if (IsDirty) {
      if (!confirm("The page was modified, do you want to discard it?")) {
        return;
      }
    }
    document.location.hash = newPosition.hash(); // duplicate, fix it later
    load(newPosition);
    setIsDirty(false);
  }
  document.location.hash = newPosition.hash();

  if (newPosition.division) {
    if ($("rows").childNodes[newPosition.division - 1]) {
      $($("rows").childNodes[newPosition.division - 1]).visualEffect("ScrollTo", {duration: 0.5});
    }
  }
  this.current = newPosition;
}
DocPosition.sync = function() {
  if ((!document.location.hash) || (document.location.hash.length < 2)) {
    this.go(this.fromName("Home", 0));
  } else if (document.location.hash != this.current.hash()) {
    this.go(this.fromName(document.location.hash.slice(1)));
  }
}
DocPosition.startSync = function() {
  this.sync();
  setInterval(function() {DocPosition.sync()}, 500);
}

// ---------- User Interface ----------

function go(name) {
  DocPosition.go(DocPosition.fromName(name));
  return false;
}

function onShortCutKey(evt) {
  if (!["HTML", "BODY"].include(Event.element(evt).tagName)) {
    return;
  }
  if (evt.keyCode != 32) return;
  DocPosition.go(DocPosition.current.next());
  Event.stop(evt);
}

function setIsDirty(aBoolean) {
  IsDirty = aBoolean;
  var dirtyMark = IsDirty ? " * modified * " : ""
  document.title = dirtyMark + DocPosition.current.title + " - TileScript";
}

function save() {
  var rows = $("rows");
  var text = "";
  $("loading").show();

  text += "[\"tilescript\",\n";
  var children = rows.childNodes;
  for (var i = 0; i < children.length; i++) {
    var nodeType = children[i].viewMode;
    var nodeValue = children[i].sourceCode(false);
    text += ([nodeType, nodeValue]).toJSON();
    if (i != children.length - 1) {
      text +=  ",\n";
    } else {
      text += "\n";
    }
  }
  text += "]\n";

  var result = saveFile(StorageUrl + "/" + DocPosition.current.title + ".txt", text);
  if (result) setIsDirty(false);
  $("loading").hide();
  return false;
}

function printIt(row) {
  var source = row.sourceCode(true);
  var transcript = $("transcript");
  var result = eval(source);
  println(result);
  if (result != undefined) {
    var newRow = addRow(Object.inspect(result), "result", row);
    $(newRow).visualEffect("BlindDown", {duration: 0.4});
  }
}

function println(string) {
  $("transcript").value += string + "\n";
}

function removeRow(row) {
  $(row).visualEffect("BlindUp", {
    duration: 0.3,
    afterFinish: function() {row.parentNode.removeChild(row)}
  });
  setIsDirty(true);
}

Row = {
  className: "row",

  rowNode: function() {
    return document.getElementsByClassName("tile", this.valueParent)[0];
  },
  printItButton: function() {
    return document.getElementsByClassName("printIt", this.rowTool)[0];
  },
  sourceCode: function(delMacros) {
    var rowNode = this.rowNode();
    if (rowNode.viewMode == "source") {
      return this.rowNode().value;
    } else if (rowNode.viewMode == "html") {
      return this.rowNode().value;
    } else {
      return delMacros ?
               this.rowNode().value.makeCodeNoMacros() :
               this.rowNode().value.makeCode();
    }
  },
  newExprElement: {
    source: function(source) {
      var newNode = document.createElement("textarea");
      newNode.viewMode = "source";
      newNode.className = "tile";
      newNode.rows = source.split("\n").length;
      newNode.value = source;
      newNode.onchange = function() {
        newNode.rows = newNode.value.split("\n").length;
        setIsDirty(true)
      };
      return newNode;
    },
    result: function(source) {
      var newNode = document.createElement("textarea");
      newNode.viewMode = "result";
      newNode.className = "tile";
      newNode.rows = source.split("\n").length;
      newNode.value = source;
      return newNode;
    },
    html: function(source) {
      var newNode = document.createElement("div");
      newNode.viewMode = "html";
      newNode.className = "tile";
      $(newNode).update(source);
      newNode.value = source;
      return newNode;
    },
    tile: function(source) {
      var tree = source.makeTree();
      var newNode = tree.makeTile();
      println(tree.inspect());
      newNode.viewMode = "tile";
      newNode.className = "tile";
      return newNode;
    }
  },
  setViewMode: function(mode) {
    var old = this.rowNode();
    this.viewMode = mode;
    var newNode = this.newExprElement[mode](this.sourceCode(false));
    this.valueParent.replaceChild(newNode, old);
    this.printItButton().setOpacity(["html", "result"].include(mode) ? 0.1 : 1);
  },
  toggleTile: function() {
    var mode;
    if (this.viewMode != "source") {
      mode = "source";
    } else if (this.sourceCode(false).charAt(0) == "<") {
      mode = "html";
    } else {
      mode = "tile";
    }
    this.setViewMode(mode);
  }
}

NewLineBar = {
  className: "newLine",
  title: "Add a new row here",

  // Constructor
  newElement: function() {
    var element = Object.extend(document.createElement("div"), NewLineBar);
    Droppables.add(element, {
      accept: ["tile", "watcher"],
      hoverclass: "hoverclass",
      onDrop: function(droppee, target) {
        //        element.addNewLine(droppee.value.makeCode(), "tile");
        target.acceptDrop(droppee);
      }
    });
    return element;
  },

  acceptDrop: function(droppee) {
    if (droppee.className == "tile") {
      this.addNewLine(droppee.value.makeCode(), "tile");
    } else if (droppee.className == "watcher") {
      this.addNewLine("<div class='watcher' key='" + droppee.model.key +
                      "'></div>", "html");
    }
  },
  onmouseover: function() { this.className = "newLineEnter" },
  onmouseout: function() { this.className = "newLine" },
  onclick: function() { this.addNewLine("", "source") },
  addNewLine: function(source, mode) {
    var row = addRow(source, mode, this.parentNode);
    $(row).visualEffect("BlindDown", {duration: 0.3});
  }
}

function newRow(source, viewMode) {
  var checked = viewMode == "source" ?" checked" : ""; 

  var rowTool = Object.extend(document.createElement("div"), {
    className: "rowTool",
    innerHTML:
    "<input type='image' title='Print it' src='exclamation.gif' value='print it' onclick='printIt(this.parentNode.parentNode)' class='printIt'/>" +
    "<input type='image' title='Remove it' src='x.gif' value='remove' onclick='removeRow(this.parentNode.parentNode)' class='printIt'/>" +
    "<input type='checkbox' class='checkbox' class='checkbox' onclick='this.parentNode.parentNode.toggleTile()' " + checked + "/>" +
    "</div>"
  });
    
  var valueParent = Object.extend(document.createElement("div"), {
    className: "valueParent"
  });
  valueParent.appendChild(Row.newExprElement.source(source));

  var newLine = NewLineBar.newElement();

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
  return p;
}

// ---------- Tiles ----------

String.prototype.makeTree = function () {
  return MJSParser.frontEndParse(this);
}

TileElement = {
  make: function(value) {
    var element = Object.extend(document.createElement("table"), this);
    element.tbody = document.createElement("tbody"),
    element.tr = document.createElement("tr"),
    element.tbody.appendChild(element.tr);
    element.appendChild(element.tbody);
    element.value = value;

    element.draggable = new Draggable(element, { ghosting: false, revert: true });
    Droppables.add(element, {
      onDrop: function(droppee, target) {
        element.acceptDrop(droppee);
      },
       accept: "tile",
       hoverclass: "hoverclass"}
    );

    // Strange, this event handler doesn't work
    // Event.observe(this, "dblclick", function(evt) { alert(); Editor.edit(this) });
    this.ondblclick =  function(evt) {
      var evt = evt ? evt : window.event;
      if (["string", "number"].include(this.value[0])) {
        Editor.edit(this);
      }
      Event.stop(evt);
    };
    return element;
  },

  className: "tile",
  parentTile: null,
  acceptDrop: function(droppee) {
    if (this.include(droppee)) return;
    setIsDirty(true);
    var parent = this.parentTile;
    var elementCopy = droppee.value.dup().makeTile();
    if (!parent) {
      // If the tile is topmost, replace it.
      return this.parentNode.replaceChild(elementCopy, this);
    }
    elementCopy.modelIdx = this.modelIdx;
    parent.value[this.modelIdx] = elementCopy.value;
    elementCopy.parentTile = this.parentTile;
    this.parentNode.replaceChild(elementCopy, this);
  },
  include: function(element) {
    return this.getElementsByClassName("tile").include(element);
  },
  addColumn: function(element, colSpan, rowSpan) {
    if (element.parentTile !== undefined) {
      element.parentTile = this;
    }
    var td = document.createElement("td");
    if (colSpan) td.colSpan = colSpan;
    if (rowSpan) td.rowSpan = rowSpan;
    td.appendChild(element);
    this.tr.appendChild(td);
    return td;
  },
  addLabel: function(string) {
    var td = document.createElement("td");
    td.appendChild(document.createTextNode(string));
    this.tr.appendChild(td);
  },
  addRow: function() {
    this.tr = document.createElement("tr"),
    this.tbody.appendChild(this.tr);
  }
}

Array.prototype.dup = function() { return this.map(function(value) { return value instanceof Array ? value.dup() : value; }); }

Array.prototype.makeCode = function() {
  return MJSTranslator.matchwith(this, "trans");
}
Array.prototype.makeCodeNoMacros = function() {
  var ast = MacroExpander.matchwith(this, "trans");
  return MJSTranslator.matchwith(ast, "transWithoutMacros");
}
Array.prototype.makeTile = function(modelIdx) {
  var tile;
  if (modelIdx != undefined) {
    tile = this[modelIdx].makeTile()
    tile.modelIdx = modelIdx
    return tile
  }
  tile = TileElement.make(this)
  if (this.makeTiles[this[0]] != undefined) {
    this.makeTiles[this[0]].call(this, tile)
    return tile
  }
  var type = document.createTextNode(this[0]);
  tile.addColumn(type);
  for (var idx = 1; idx < this.length; idx++) {
    var arg = this.makeTile(idx)
    tile.addColumn(arg);
  }
  return tile
}
Array.prototype.makeTiles = new Object()

Array.prototype.makeTiles["number"] = function(tile) {
  tile.addLabel("" + tile.value[1]);
  $(tile).addClassName("numberTile");
}

Array.prototype.makeTiles["string"] = function(tile) {
  var i = document.createElement("i");
  i.appendChild(document.createTextNode(tile.value[1]));
  tile.addColumn(i);
  $(tile).addClassName("stringTile");
}

Array.prototype.makeTiles["arr"] = function(tile) {
  tile.addLabel("[")
  for (var idx = 1; idx < this.length; idx++) {
    if (idx > 1)
      tile.addLabel(", ")
    tile.addColumn(this.makeTile(idx))
  }
  tile.addLabel("]")
}

Array.prototype.makeTiles["unop"] = function(tile) {
  tile.addLabel(this[1])
  tile.addColumn(this.makeTile(2))
}

Array.prototype.makeTiles["set"] = function(tile) {
  tile.addColumn(this.makeTile(1))
  tile.addLabel(" = ")
  tile.addColumn(this.makeTile(2))
}

Array.prototype.makeTiles["mset"] = function(tile) {
  tile.addColumn(this.makeTile(1))
  tile.addLabel(" " + this[2] + "= ")
  tile.addColumn(this.makeTile(3))
}

Array.prototype.makeTiles["binop"] = function(tile) {
  tile.addColumn(this.makeTile(2))
  tile.addLabel(this[1])
  tile.addColumn(this.makeTile(3))
}

Array.prototype.makeTiles["preop"] = function(tile) {
  tile.addLabel(this[1])
  tile.addColumn(this.makeTile(2))
}

Array.prototype.makeTiles["postop"] = function(tile) {
  tile.addColumn(this.makeTile(2))
  tile.addLabel(this[1])
}

Array.prototype.makeTiles["if"] = function(tile) {
  tile.addLabel("if (")
  tile.addColumn(this.makeTile(1))
  tile.addLabel(")")
  tile.addColumn(this.makeTile(2))
  tile.addRow();
  tile.addColumn(document.createTextNode("else"), 3)
  tile.addColumn(this.makeTile(3))
}

Array.prototype.makeTiles["condExpr"] = function(tile) {
  tile.addColumn(this.makeTile(1))
  tile.addLabel(" ? ")
  tile.addColumn(this.makeTile(2))
  tile.addLabel(" : ")
  tile.addColumn(this.makeTile(3))
}

Array.prototype.makeTiles["while"] = function(tile) {
  tile.addLabel("while (")
  tile.addColumn(this.makeTile(1))
  tile.addLabel(") ")
  tile.addRow()
  tile.addColumn(this.makeTile(2), 3)
}

Array.prototype.makeTiles["doWhile"] = function(tile) {
  tile.addLabel("do", 3)
  tile.addRow()
  tile.addColumn(this.makeTile(1), 3)
  tile.addRow()
  tile.addLabel(" while (")
  tile.addColumn(this.makeTile(2))
  tile.addLabel(")")
}

Array.prototype.makeTiles["for"] = function(tile) {
  tile.addLabel("for (")
  tile.addColumn(this.makeTile(1)); tile.addLabel("; ")
  tile.addColumn(this.makeTile(2)); tile.addLabel("; ")
  tile.addColumn(this.makeTile(3)); tile.addLabel(") ")
  tile.addRow()
  tile.addColumn(this.makeTile(4), 7)
}

Array.prototype.makeTiles["forIn"] = function(tile) {
  tile.addLabel("for (")
  tile.addColumn(this.makeTile(1)); tile.addLabel(" in ")
  tile.addColumn(this.makeTile(2)); tile.addLabel(") ")
  tile.addColumn(this.makeTile(3))
}

Array.prototype.makeTiles["begin"] = function(tile) {
  for (var idx = 1; idx < this.length; idx++) {
    tile.addColumn(this.makeTile(idx));
    if (idx < this.length - 1) tile.addRow();
  }
}

Array.prototype.makeTiles["func"] = function(tile) {
  tile.addLabel("function(" + this[1].join(", ") + ")")
  tile.addRow()
  tile.addColumn(this.makeTile(2))
}


Array.prototype.makeTiles["get"] = function(tile) {
  if (this.length == 3) {
    tile.addColumn(this.makeTile(2))
    tile.addLabel("[")
    tile.addColumn(this.makeTile(1))
    tile.addLabel("]")
  }
  else
    tile.addLabel(this[1])
}

Array.prototype.makeTiles["call"] = function(tile) {
  //  tile.addColumn(this.makeTile(1))
  tile.addLabel(this[1].makeCode())
  tile.addLabel("(")
  for (var idx = 2; idx < this.length; idx++) {
    tile.addColumn(this.makeTile(idx))
    if (idx != this.length - 1)
      tile.addLabel(", ")
  }
  tile.addLabel(")")
}

Array.prototype.makeTiles["send"] = function(tile) {
  tile.addColumn(this.makeTile(2))
  tile.addLabel("." + this[1] + "(")
  for (var idx = 3; idx < this.length; idx++) {
    tile.addColumn(this.makeTile(idx))
    if (idx != this.length - 1)
      tile.addLabel(", ")
  }
  tile.addLabel(")")
}

Array.prototype.makeTiles["new"] = function(tile) {
  tile.addLabel("new " + this[1] + "(")
  for (var idx = 2; idx < this.length; idx++) {
    if (idx > 2)
      tile.addLabel(", ")
    tile.addColumn(this.makeTile(idx))
  }
  tile.addLabel(")")
}

Array.prototype.makeTiles["expand"] = function(tile) {
  var b = document.createElement("b");
  b.appendChild(document.createTextNode(this[1]));
  tile.addColumn(b);
  tile.addLabel("(");
  for (var idx = 2; idx < this.length; idx++) {
    if (idx > 2)
      tile.addLabel(", ")
    tile.addColumn(this.makeTile(idx))
  }
  tile.addLabel(")");
}

Array.prototype.makeTiles["macro"] = function(tile) {
  tile.addLabel("macro ");
  var b = document.createElement("b");
  b.appendChild(document.createTextNode(this[1]));
  tile.addColumn(b);
  tile.addLabel("(" + this[2].join(", ") + ")");
  tile.addRow();
  tile.addColumn(this.makeTile(3), 2);
}

Array.prototype.makeTiles["var"] = function(tile) {
  tile.addLabel("var " + this[1] + " = ")
  tile.addColumn(this.makeTile(2))
}

Array.prototype.makeTiles["try"] = function(tile) {
  tile.addLabel("try ")
  tile.addColumn(this.makeTile(1))
  tile.addLabel(" catch (" + this[2] + ") ")
  tile.addColumn(this.makeTile(3))
  tile.addLabel(" finally ")
  tile.addColumn(this.makeTile(4))
}

Array.prototype.makeTiles["json"] = Array.prototype.makeTiles["begin"];

Array.prototype.makeTiles["binding"] = function(tile) {
  tile.addLabel(this[1] + ": ")
  tile.addColumn(this.makeTile(2))
}

Array.prototype.makeTiles["switch"] = function(tile) {
  tile.addLabel("switch (")
  tile.addColumn(this.makeTile(1))
  tile.addLabel(")")
  tile.addRow();
  //tile.addColumn(document.createTextNode("{"), null, this.length - 2);
  for (var idx = 2; idx < this.length; idx++) {
    if (idx > 2) {
      tile.addRow();
    }
    tile.addColumn(this.makeTile(idx), 3);
/*
    if (idx == 2) {
      tile.addColumn(document.createTextNode("}"), null, this.length - 2);
    }
*/
  }
}

Array.prototype.makeTiles["case"] = function(tile) {
  tile.addLabel("case ")
  tile.addColumn(this.makeTile(1))
  tile.addLabel(": ")
  tile.addColumn(this.makeTile(2))
}

Array.prototype.makeTiles["default"] = function(tile) {
  tile.addLabel("default: ")
  tile.addColumn(this.makeTile(1))
}

// ---------- Editor ----------

Editor = Object.extend(document.createElement("input"), {
  className: "editor",
  valueType: "string",
  object: null,
  initialize: function() {
    document.body.appendChild(this);
    $(this).hide();
    Event.observe(this, "keydown", function(evt) {
      if (evt.keyCode != 13) return;
      Editor.acceptValue();
      Event.stop(evt);
    });
  },
  acceptValue: function() {
    this.hide();
    var object = this.object;
    this.object = null; // this.object is reset before evaluate to handle error.
    var newValue = this.valueType == "number" ?
        parseFloat(this.value) : this.value.toString()
    var newTile = [this.valueType, newValue].makeTile();

    object.acceptDrop(newTile);
  },
  onblur: function() {
    this.acceptValue();
  },
  edit: function(element) {
    if (this.object) {
      this.acceptValue();
    }
    this.object = element;
    this.show();
    Position.clone(element, this);
    this.valueType = element.value[0];
    this.value = element.value[1];
    this.select();
  }
});

// ---------- Viewer ----------

Viewer = {
  systemVars: {}, // Keys of the dictionary are used in the system.
  watchers: {}, // A dictionary of { key: Watcher }
  isShow: function() {
    return !($("viewer").classNames().include("viewerHide"));
  },
  hide: function() {
    $("viewer").addClassName("viewerHide");
    $("body").addClassName("viewerHide");
  },
  show: function() {
    $("viewer").removeClassName("viewerHide");
    $("body").removeClassName("viewerHide");
  },
  toggle: function() {
    if (this.isShow()) { this.hide() } else { this.show() }
  },
  startSync: function() {
    this.viewer = $("viewer");
    var vars = Object.keys(window);
    vars = vars.concat(["effect_class", "s", "tag_name", "deepest"]);
    for (var i = 0; i < vars.length; i++) {
      this.systemVars[vars[i]] = true;
    }

    this.sync();
    setInterval(function() { Viewer.sync()}, 200);
  },
  sync: function() {
    var newWatchers = {};

    var userVars = Object.keys(window).select(function(each) {
      return !Viewer.systemVars[each]
    })

    for (var i = 0; i < userVars.length; i++) {
      var key = userVars[i];
      if (this.watchers[key]) {
        newWatchers[key] = this.watchers[key];
        delete this.watchers[key];
      } else {
        newWatchers[key] = new Watcher(key);
        this.viewer.appendChild(newWatchers[key].element());
      }
    }
    var unused = this.watchers;
    this.watchers = newWatchers;
    
    for (var i = 0; i < this.viewer.childNodes.length; i++) {
      var child = this.viewer.childNodes[i];
      if (child.model) {
        if (unused[child.model.key]) {
          this.viewer.removeChild(child);
        }
      }
    }
    Watcher.update();
  }
}

Watcher = Class.create();
Watcher.update = function() {
  var watchers = document.getElementsByClassName("watcher");
  for (var i = 0; i < watchers.length; i++) {
    if (watchers[i].model) {
      watchers[i].model.update();
    } else {
      var model = Watcher.adoptModel(watchers[i]);
      if (model) model.update();
    }
  }
}
Watcher.adoptModel = function(element) {
  var key = element.getAttribute("key");
  if (!key) return;
  var watcher = new Watcher(key);
  watcher.buildElement(element);
  return element.model;
}

Watcher.prototype = {
  lastValue: null,
  _element: null,
  initialize: function(key) {
    this.key = key;
  },
  element: function() {
    if (this._element) return this._element;
    this.buildElement(document.createElement("div"));
    return this._element;
  },
  buildElement: function(element) {
    var self = this;
    element.className = "watcher";
    element.appendChild(document.createTextNode(this.key + ":"));
    this.input = document.createElement("input");
    this.input.onblur = function() { self.accept() }
    element.appendChild(this.input);
    element.model = this;
    this._element = element;
    new Draggable(element, { ghosting: false, revert: true });
    return element;
  },
  update: function() {
    var newValue = window[this.key];
    var editable = isEditable(newValue);
    this.input.disabled = !editable;
    if (this.lastValue != newValue) {
      this.input.value = Object.inspect(newValue);
      this.lastValue = newValue;
      return;
    }
    if (editable &&
        Object.inspect(this.lastValue) != Object.inspect(newValue)) {
          this.input.value = Object.inspect(newValue);
          this.lastValue = newValue;
        }
  },
  accept: function() {
    window[this.key] = eval(this.input.value);
  }
}

// ---------- Data Storage ----------

function load(position) {

  $("loading").show();
  var rows = $("rows");
  while (rows.childNodes.length > 0) {
    rows.removeChild(rows.firstChild);
  }
  
  $("control").action = document.location.href;
  $("title").innerHTML = "<a href='#"+ position.title +"'>" + position.title + "</a>";

  var json = getfile(StorageUrl + "/" + position.title + ".txt");
  var tree = eval(json);
  if (!tree) {
    addRow("\"This is an empty page.\"", "tile");
    $("loading").hide();
    return;
  }

  for (var i = 1; i < tree.length; i++) {
    var viewMode = tree[i][0];
    var source = tree[i][1];
    addRow(source, viewMode);
  }
  $("loading").hide();
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
      onFailure: function (e) {/* alert(e.printString());*/}
     });
  if (!ajax.success()) {
    alert(ajax.transport.statusText);
  }
  return ajax.success()
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

// ---------- Utilities ----------

function isEditable(object) {
  switch(typeof object) {
  case "number": return true;
  case "string": return true;
  case "boolean": return true;
  case "function": return false;
  case "undefined": return false;
  }
  if (object instanceof Array) {
    for (var i = 0; i < object.length; i++) {
      if (!isEditable(object[i])) return false;
    }
    return true;
  } else if (object instanceof Date) {
    return true;
  }
  for (var key in object) {
    if (!isEditable(object[key])) return false;
  }
  return true;
}
