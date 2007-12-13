// ---------- Initialization ----------

window.onload = function(){
  addTiles();

  acceptDrop(["+", 3, 4].makeTile(), $("queryPlace"));
  updateAnswer();
}

function addTiles() {
  for (var i = 0; i < 10; i++) {
    var span = (i).makeTile();
    document.body.appendChild(span);
    Droppables.remove(span);
  }
  //  Droppables.add("queryPlace", { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});

  var p1 = document.createElement("p");
  var plus = ["+", 3, 4].makeTile();
  p1.appendChild(plus);
  adjustPadding(p1.firstChild);

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

Number.prototype.makeTile = function() {
  var span = document.createElement("span");
  var v = this;
  span.value = this;
  span.innerHTML = "" + this;
  span.className = "tile";
  span.draggable = new Draggable(span, { ghosting: false, revert: true });
  Droppables.add(span, { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});
  span.tileString = function () { return "[" + v + "]"; };
  return span;
}

Array.prototype.makeTile = function() {
  var span = document.createElement("span");
  var symbolTile = document.createTextNode(this[0]);
  var argTile1 = this[1].makeTile();
  var argTile2 = this[2].makeTile();
  span.value = this;
  span.className = "tile";
  span.appendChild(argTile1);
  span.appendChild(symbolTile);
  span.appendChild(argTile2);
  span.nodes = [symbolTile, argTile1, argTile2];
  span.draggable = new Draggable(span, { ghosting: false, revert: true });
  Droppables.add(span, { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});
  span.tileString = function () { return "(" + argTile1.tileString() + span.value[0] + argTile2.tileString() + ")"; }
  return span;
}

Number.prototype.dup = function() { return this.valueOf() };
String.prototype.dup = function() { return this.valueOf() };

Array.prototype.dup = function() {
  return this.map(function(value, index) {
    return value.dup();
  });
}

function acceptDrop(element, droppableElement) {
  var newNode = element.value.dup().makeTile();
  var parent = droppableElement.parentNode;
  if (parent.nodes != undefined) {
    if (parent.nodes[1] == droppableElement) {
      parent.nodes[1] = newNode;
      parent.value[1] = newNode.value;
    }
    if (parent.nodes[2] == droppableElement) {
      parent.nodes[2] = newNode;
      parent.value[2] = newNode.value;
    }
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
    $("answer").innerHTML = q.getAnswer();
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
