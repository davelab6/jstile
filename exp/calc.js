// ---------- Initialization ----------

window.onload = function(){
  eval(OMetaParser.matchAllwith($("grammar").value, "grammar").squish().join(''))
  addTiles();
  Object.extend(queryPlace(), TileElement);
  sourceChanged("3+4");
  updateAnswer();
}

/* Answer the position of query. */
function queryPlace() {
  return $("query").getElementsByClassName("tile")[0];
}

function sourceChanged(source) {
  var exp = Calc.matchAllwith(source, "expr");
  var place = queryPlace();
  place.parentNode.replaceChild(exp.makeTile(), place);
}

function addTiles() {
  for (var i = 0; i < 10; i++) {
    var element = (i).makeTile();
    element.style.cssFloat = "left";
    element.style.styleFloat = "left";
    $("partsbin").appendChild(element);
    Droppables.remove(element);
  }

  $("partsbin").appendChild(document.createElement("br"));

  var p1 = document.createElement("p");
  var plus = ["+", 3, 4].makeTile();
  p1.appendChild(plus);

  var p2 = document.createElement("p");
  var minus = ["-", 5, 6].makeTile();
  p2.appendChild(minus);

  var p3 = document.createElement("p");
  var multi = ["*", 1, 2].makeTile();
  p3.appendChild(multi);

  Droppables.remove(plus);
  Droppables.remove(minus);
  $("partsbin").appendChild(p1);
  $("partsbin").appendChild(p2);
  $("partsbin").appendChild(p3);
}

// ---------- Tile Constructor ----------

TileElement = {
  className: "tile",
  modelIdx: undefined,
  addColumn: function(element) {
    var td = document.createElement("td");
    td.appendChild(element);
    this.tr.appendChild(td);
    return td;
  },
  addLabel: function(string) {
    this.addColumn(document.createTextNode(string));
  },
  addChild: function(child) {
    child.parentTile = this;
    this.addColumn(child);
  },
  acceptDrop: function(droppee) {
    var newNode = droppee.value.dup().makeTile();

    // Topmost tile
    if (this.parentTile == undefined) {
      this.parentNode.replaceChild(newNode, this);
      return;
    }

    newNode.modelIdx = this.modelIdx;
    newNode.parentTile = this.parentTile
    this.parentTile.value[this.modelIdx] = newNode.value;
    this.parentNode.replaceChild(newNode, this);
    updateAnswer();
  }
}

function makeElement(value, isDraggable) {
  var element = Object.extend(document.createElement("table"), TileElement);
  var tbody = document.createElement("tbody");
  var tr = document.createElement("tr");
  element.tr = tr;
  tbody.appendChild(tr);
  element.appendChild(tbody);
  element.value = value;
  if (isDraggable) {
    element.draggable = new Draggable(element,
        { ghosting: false, revert: true });
    Droppables.add(element,
        { onDrop: function(e, droppable) { droppable.acceptDrop(e) },
          accept: "tile",
          hoverclass: "hoverclass"});
  }
  return element;
}

// ---------- Tiles ----------

Number.prototype.makeTile = function() {
  var element = makeElement(this, true);
  element.addLabel("" + this);
  return element;
}

Array.prototype.makeTile = function() {
  var element = makeElement(this, true);
  var symbolTile = makeElement(null, false);
  symbolTile.addLabel(this[0]);

  var argTile1 = this[1].makeTile();
  argTile1.modelIdx = 1;
  var argTile2 = this[2].makeTile();
  argTile2.modelIdx = 2;
  element.addChild(argTile1);
  element.addChild(symbolTile);
  element.addChild(argTile2);
  return element;
}

Number.prototype.dup = function() { return this.valueOf() };
String.prototype.dup = function() { return this.valueOf() };

Array.prototype.dup = function() {
  return this.map(function(value, index) {
    return value.dup();
  });
}

// ---------- Evaluation ----------

function updateAnswer() {
  var q = queryPlace().value;
  if (q != undefined) {
    $("answer").innerHTML = eval(q.makeCode());
    $("source").value = q.makeCode();
  }
}

Number.prototype.makeCode = function () {
  return "" + this;
}
String.prototype.makeCode = function () {
  return this;
}
Array.prototype.makeCode = function () {
  return "(" + this[1].makeCode() + this[0] + this[2].makeCode() + ")";
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
