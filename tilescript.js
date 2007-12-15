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
Array.prototype.makeTiles["get"] = Array.prototype.makeTiles["number"]
Array.prototype.makeTiles["string"] = function(arr, span) {
  span.innerHTML = "<i>" + span.value[1] + "</i>";
}
Array.prototype.makeTiles["func"] = function(arr, span) {
  span.appendChild(document.createTextNode("function(" + arr[1].splice(1).join(", ") + ")"))
  var body = arr[2].makeTile()
  span.appendChild(body)
  span.nodes = [body]
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
  if (q != undefined) {
    $("answer").innerHTML = q.printString();
  }
}

Number.prototype.getAnswer = function () { return this };
Array.prototype.getAnswer = function () {
  if (this[0] == "+") {
    return this[1].getAnswer() + this[2].getAnswer();
  } else if (this[0] == "-") {
    return this[1].getAnswer() - this[2].getAnswer();
  } else if (this[0] == "*") {
    return this[1].getAnswer() * this[2].getAnswer();
  }
}

// ---------- Tests ----------

function test() {
  // Clone
  if (["-", 2, 3].dup()[0] != "-") {
    alert("Failed: [\"-\", 2, 3].dup()[0] != " +  ["-", 2, 3].dup()[0]);
  }
    
  // Simple replace
  before = (3).makeTile();
  after = (4).makeTile();
  p = document.createElement("p");
  p.appendChild(before);
  document.body.appendChild(p);
  acceptDrop(after, before);
  if (p.firstChild.value != 4) alert("Failed: " + p.firstChild.value);
  document.body.appendChild(document.createTextNode("ok"))

  // Replace to an expression
  before = (3).makeTile();
  after = ["+", 3, 4].makeTile();
  p = document.createElement("p");
  p.appendChild(before);
  document.body.appendChild(p);
  acceptDrop(after, before);
  if (p.firstChild.value[0] != "+") alert("Failed: " + p.firstChild.value);
  document.body.appendChild(document.createTextNode("ok"))

  // Replace to a complex tile
  before = ["+", 3, 4].makeTile();
  after =["-", 5, 6].makeTile();
  target = before.nodes[1];
  p = document.createElement("p");
  p.appendChild(before);
  document.body.appendChild(p);
  acceptDrop(after, target);
  if (p.firstChild.value[1][0] != "-") alert("Failed: " + p.firstChild.value);
  if (p.firstChild.nodes[1].value[0] != "-") {
    alert("Failed: " + p.firstChild.nodes[1].value);
  }
  document.body.appendChild(document.createTextNode("ok"))
}
