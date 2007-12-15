// ---------- Initialization ----------

window.onload = function(){
  autoexec()
  //addTiles();

  acceptDrop(["number", 0].makeTile(), $("queryPlace"));

/*
  var p1 = document.createElement("p");
  var plus = ["+", ["number", 3], ["number", 4]].makeTile();
  p1.appendChild(plus);
  adjustPadding(p1.firstChild);
*/

  updateAnswer();
}

function addTiles() {
  for (var i = 0; i < 10; i++) {
    var span = (i).makeTile();
    document.body.appendChild(span);
    Droppables.remove(span);
  }
  //  Droppables.add("queryPlace", { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});

  var p2 = document.createElement("p");
  var minus = ["-", 5, 6].makeTile();
  p2.appendChild(minus);
  adjustPadding(p2.firstChild);

  var p3 = document.createElement("p");
  var multi = ["*", 1, 2].makeTile();
  p3.appendChild(multi);
  adjustPadding(p3.firstChild);

  Droppables.remove(plus);
  Droppables.remove(minus);
  document.body.appendChild(p1);
  document.body.appendChild(p2);
  document.body.appendChild(p3);
}

// ---------- Tiles ----------

function makeSpan() {
  var span = document.createElement("span")
  span.className = "tile";
  span.draggable = new Draggable(span, { ghosting: false, revert: true });
  Droppables.add(span, { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});
  return span;
}

Array.prototype.makeCode = function() {
  return this.makeCodes[this[0]] == undefined ? this.printString() : this.makeCodes[this[0]].apply(this)
}
Array.prototype.makeCodes = new Object()
Array.prototype.makeCodes["number"] = function() { return "" + this[1] }
Array.prototype.makeCodes["string"] = function() { return this[1].printString() }
Array.prototype.makeCodes["binop"]  = function() { return "(" + this[2].makeCode() + this[1] + this[3].makeCode() + ")" }
Array.prototype.makeCodes["return"] = function() { return "return " + this[1].makeCode() }
Array.prototype.makeCodes["func"] = function() {
  return "(function(" + this[1].clone().splice(1).join(", ") + ") " + this[2].makeCode() + ")"
}
Array.prototype.makeCodes["begin"] = function() {
  return "{ " + this.clone().splice(1).map(function(s) { return s.makeCode() }).join("; ") + " }"
}
Array.prototype.makeCodes["get"] = function() {
  return this.length == 3 ?  this[2].makeCode() + "[" + this[1].makeCode() + "]" : this[1]
}
Array.prototype.makeCodes["call"] = function() {
  return this[1].makeCode() + "(" + this.clone().splice(2).map(function(a) { return a.makeCode() }).join(", ") + ")"
}
Array.prototype.makeCodes["send"] = function() {
  return this[2].makeCode() + "." + this[1] + "(" + this.clone().splice(3).map(function(a) { return a.makeCode() }).join(", ") + ")"
}
Array.prototype.makeCodes["var"] = function() {
  return "var " + this[1] + " = " + this[2].makeCode()
}

Array.prototype.makeTile = function() {
  var span = makeSpan()
  span.value = this
  if (this.makeTiles[this[0]] != undefined) {
    this.makeTiles[this[0]](this, span)
    return span
  }
  var symbolTile = document.createTextNode(this[0]);
  span.appendChild(symbolTile);
  var childrenNodes = [symbolTile]
  for (var idx = 1; idx < this.length; idx++) {
    var arg = this[idx].makeTile()
    span.appendChild(arg);
    childrenNodes.push(arg)
  }
  span.value = this;
  span.nodes = childrenNodes
  return span;
}
Array.prototype.makeTiles = new Object()
Array.prototype.makeTiles["number"] = function(arr, span) {
  span.innerHTML = "" + span.value[1]
}
Array.prototype.makeTiles["string"] = function(arr, span) {
  span.innerHTML = "<i>" + span.value[1] + "</i>";
}
Array.prototype.makeTiles["func"] = function(arr, span) {
  span.appendChild(document.createTextNode("function(" + arr[1].clone().splice(1).join(", ") + ")"))
  var body = arr[2].makeTile()
  span.appendChild(body)
  span.nodes = [body]
}
Array.prototype.makeTiles["binop"] = function(arr, span) {
  var x = arr[2].makeTile(), op = document.createTextNode(arr[1]), y = arr[3].makeTile()
  span.nodes = [x, op, y]
  span.nodes.map(function(n) { span.appendChild(n) })
}
Array.prototype.makeTiles["get"] = function(arr, span) {
  if (arr.length == 3) {
    var prop = arr[1].makeTile(), recv = arr[2].makeTile(), open = document.createTextNode("["), close = document.createTextNode("]")
    span.nodes = [recv, open, prop, close]
  }
  else {
    span.nodes = [document.createTextNode(arr[1])]
  }
  span.nodes.map(function(n) { span.appendChild(n) })
}
Array.prototype.makeTiles["call"] = function(arr, span) {
  span.nodes = [arr[1].makeTile()]
  span.nodes.push(document.createTextNode("("))
  for (var idx = 2; idx < arr.length; idx++) {
    span.nodes.push(arr[idx].makeTile())
    if (idx != arr.length - 1)
      span.nodes.push(document.createTextNode(", "))
  }
  span.nodes.push(document.createTextNode(")"))
  span.nodes.map(function(n) { span.appendChild(n) })
}
Array.prototype.makeTiles["send"] = function(arr, span) {
  span.nodes = [arr[2].makeTile(), document.createTextNode(arr[1] + ".(")]
  for (var idx = 3; idx < arr.length; idx++) {
    span.nodes.push(arr[idx].makeTile())
    if (idx != arr.length - 1)
      span.nodes.push(document.createTextNode(", "))
  }
  span.nodes.push(document.createTextNode(")"))
  span.nodes.map(function(n) { span.appendChild(n) })
}
Array.prototype.makeTiles["var"] = function(arr, span) {
  span.nodes = [document.createTextNode("var "), document.createTextNode(arr[1]), document.createTextNode(" = "), arr[2].makeTile()]
  span.nodes.map(function(n) { span.appendChild(n) })
}

Array.prototype.dup = function() {
  return this.map(function(value, index) {
    return value instanceof Array ? value.dup() : value;
  });
}

function acceptDrop(element, droppableElement) {
eee = element
  var newNode = element.value.dup().makeTile();
  var parent = droppableElement.parentNode;
  if (parent.nodes != undefined)
    for (var idx = 0; idx < parent.nodes.length; idx++)
      if (parent.nodes[idx] == droppableElement) {
        parent.nodes[idx] = newNode
        parent.value[idx] = newNode.value
        break
      }
  parent.insertBefore(newNode, droppableElement);
  parent.removeChild(droppableElement);
  adjustPadding(findTop(newNode));
  updateAnswer();
}

/* adjust the tile's padding based on the depth */
function adjustPadding (tile) {
  if (tile.nodes == undefined) {
    return 2;
  }
  var max = 0;
  tile.nodes.each(function (value, index) {
    var padding = adjustPadding(value);
    if (max < padding) {
      max = padding;
    }
  });
  tile.style.padding = max + 2 + "px";
  return max + 2;
}

function findTop(tile) {
  if (tile.parentNode.nodes == undefined) {
    return tile;
  }
  return findTop(tile.parentNode);
}

// ---------- Evaluation ----------

function updateAnswer() {
  var q = $("query").getElementsByTagName("span")[0].value;
  //alert(q.printString())
  if (q != undefined) {
    $("tree").innerHTML   = q.printString();
    $("code").innerHTML   = q.makeCode();
    $("answer").innerHTML = "ERROR"
    $("answer").innerHTML = q.eval()
  }
}

Array.prototype.eval = function() { return eval(this.makeCode()) }

