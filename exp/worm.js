// Turtle graphics and Inspector test
// 
// tested with IE6 & Firefox2
//

IE = !!(window.attachEvent && !window.opera);

// ---------- Canvas Object for IE
var VMLCanvas = new Object();

VMLCanvas.newImageShape = function(obj) {
  var shape = document.createElement("v:image");
  return shape;
}

VMLCanvas.newWorldShape = function(obj) {
  var group = document.createElement("v:group");
  group.coordsize = obj.width + "," + obj.height;
  group.style.width = obj.width;
  group.style.height = obj.height;

  var rect = document.createElement("v:rect");
  rect.style.width = "100%";
  rect.style.height = "100%";
  rect.fillcolor = obj.fill;
  group.appendChild(rect);
  return group;
}

VMLCanvas.newPolylineShape = function(obj) {
  var shape = document.createElement("v:polyline");
  shape.setAttribute("strokecolor", obj.stroke);
  shape.setAttribute("strokeweight", obj.strokeWidth);
  shape.setAttribute("filled", "false");
  return shape;
}

VMLCanvas.add = function(parent, child) {
  parent._shape.appendChild(child._shape);
}

VMLCanvas.updateRect = function(obj) {
  obj._shape.src = obj.src;
  obj._shape.style.width = obj.width;
  obj._shape.style.height = obj.height;
  obj._shape.style.left = obj._x - obj.width / 2;
  obj._shape.style.top = obj._y - obj.height / 2;
  obj._shape.style.rotation = obj._angle;
}

VMLCanvas.updatePolyline = function(obj) {
  var points = "";
  if (obj._vertices.length < 2) return;
  for (var i = 0; i < obj._vertices.length; i++) {
    points += Math.floor(obj._vertices[i][0]) + "," + Math.floor(obj._vertices[i][1]) + " ";
  }
  obj._shape.points.Value = points;
}

VMLCanvas.showAsWorld = function(obj) {
  document.getElementById("world").appendChild(obj._shape);
}

// ---------- Canvas Object for SVG (Firefox and Safari)

var SVGNS = "http://www.w3.org/2000/svg";
var SVGCanvas = new Object();

SVGCanvas.newImageShape = function(obj) {
  var shape = document.createElementNS(SVGNS, "image");
  return shape;
}

SVGCanvas.newWorldShape = function(obj) {
  var svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("width", obj.width);
  svg.setAttribute("height", obj.height);

  var rect = document.createElementNS(SVGNS, "rect");
  rect.setAttribute("fill", obj.fill);
  rect.setAttribute("width", obj.width);
  rect.setAttribute("height", obj.height);
  svg.appendChild(rect);

  return svg;
}

SVGCanvas.newPolylineShape = function(obj) {
  var shape = document.createElementNS(SVGNS, "polyline");
  shape.setAttribute("stroke", obj.stroke);
  shape.setAttribute("stroke-width", obj.strokeWidth);
  shape.setAttribute("fill", "none");
  return shape;
}

SVGCanvas.showAsWorld = function(obj) {
  document.getElementById("world").appendChild(obj._shape);
}

SVGCanvas.add = function(parent, child) {
  parent._shape.appendChild(child._shape);
}

SVGCanvas.updateRect = function(obj) {
  obj._shape.setAttributeNS("http://www.w3.org/1999/xlink", "href", obj.src);
  obj._shape.setAttribute("width", obj.width);
  obj._shape.setAttribute("height", obj.height);
  var left = obj._x - obj.width / 2;
  var top = obj._y - obj.height / 2;
  obj._shape.setAttribute("transform",
    "translate(" + left + ", " + top + ") " + 
    "rotate(" + obj._angle + ", " + obj.width / 2 + ", " + obj.height / 2 + ")");
}

SVGCanvas.updatePolyline = function(obj) {
  var points = "";
  if (obj._vertices.length < 2) return;
  for (var i = 0; i < obj._vertices.length; i++) {
    points += Math.floor(obj._vertices[i][0]) + "," + Math.floor(obj._vertices[i][1]) + " ";
  }
  obj._shape.setAttribute("points", points);
}


Canvas =  IE ? VMLCanvas : SVGCanvas;

// ---------- Scheduler
var scheduler = {
  tasks: [],
  add: function(func) { this.tasks.push(func); },
  tick: function() {
    if (this.tasks.length > 0) {
      (this.tasks.shift())();
    }
  },
  timer: undefined,
  initialize: function() {
    this.tasks = [];
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(function () { scheduler.tick() }, 50);
  }
}
scheduler.initialize();

// ---------- World
var world = {
  width: 600,
  height: 200,
  fill: "#CF8E6B",
  add: function (obj) {
    Canvas.add(this, obj)
  }
}
world._shape = Canvas.newWorldShape(world);

// ---------- Trail
var trail = {
  stroke: "#632D01",
  strokeWidth: 2,
  _vertices: [],
  initialize: function () { this._vertices = [] },
  addVertex: function (p) {
    this._vertices.push(p);
    Canvas.updatePolyline(this);
  }
}
trail._shape = Canvas.newPolylineShape(trail);

// ---------- Turtle
var turtle = new Image();
turtle.exportNames = ["src", "_angle", "_x", "_y"];
turtle.src = "worm.png";
turtle._angle = 0;
turtle._x = 300;
turtle._y = 100;
turtle._shape = Canvas.newImageShape(turtle);

turtle.setAngle = function(degree) {
  this._angle = degree;
  Canvas.updateRect(turtle);
};
turtle.getAngle = function() { return this._angle }

turtle.forwardBy = function(distance) {
  var t = this;
  scheduler.add(function() {
    var radian = t._angle * Math.PI / 180;
    t._x = t._x + (distance * (Math.sin(radian)));
    t._y = t._y - (distance * (Math.cos(radian)));
    Canvas.updateRect(turtle);
    trail.addVertex([t._x, t._y]);
   });
}
turtle.forwardBy(0);

turtle.turnBy = function(degree) {
  var t = this;
  scheduler.add(function() {
    t._angle = (t._angle + degree) % 360;
    Canvas.updateRect(turtle);
  });
}

// ---------- Inspector
var inspector = document.createElement("form");
inspector.table = document.createElement("table");
inspector.tbody = document.createElement("tbody");
inspector.appendChild(inspector.table);
inspector.submit = document.createElement("input");
inspector.submit.type = "submit";
inspector.appendChild(inspector.submit);
inspector.table.appendChild(inspector.tbody);
inspector.setObject = function(obj) {
  this.object = obj;
  this.fields = [];
  this.lastValues = new Array(obj.exportNames.length);
  while (this.tbody.childNodes.length > 0) {
    this.tbody.removeChild(this.tbody.firstChild);
  }
  for (var i = 0; i < obj.exportNames.length; i++) {
    var key = obj.exportNames[i];
    var row = document.createElement("tr");
    var keyElement = document.createElement("td");
    var valueElement = document.createElement("td");
    var field = document.createElement("input");
    this.fields.push(field);
    keyElement.appendChild(document.createTextNode(key));
    valueElement.appendChild(field);
    row.appendChild(keyElement);
    row.appendChild(valueElement);
    this.tbody.appendChild(row);
  }
}

inspector.inspect = function() {
  for (var i = 0; i < this.object.exportNames.length; i++) {
    var key = this.object.exportNames[i];
    if (this.lastValues[i] != this.object[key]) {
      this.fields[i].value = this.object[key];
      this.lastValues[i] = this.object[key];
    }
  }
}

inspector.onsubmit = function () { 
  for (var i = 0; i < this.object.exportNames.length; i++) {
    var key = this.object.exportNames[i];
    if (typeof this.object[key] == "number") {
      this.object[key] = parseFloat(this.fields[i].value);
    } else {
      this.object[key] = this.fields[i].value;
    }
  }
  Canvas.updateRect(turtle); // TODO
  return false;
}

inspector.setObject(turtle);
setInterval(function () { inspector.inspect() }, 100);

// ---------- Initialization

world.add(trail);
Canvas.updatePolyline(trail);
world.add(turtle);
Canvas.updateRect(turtle);

window.onload = function () {
  Canvas.showAsWorld(world);
  eval(document.getElementById("inspector").appendChild(inspector));
}

function doIt() {
  scheduler.initialize();
  eval(document.getElementById("workspace").value);
}
function reset() {
  scheduler.initialize();
  trail.initialize();
  turtle._x = 300;
  turtle._y = 100;
  turtle._angle = 0;
  turtle.forwardBy(0);
  Canvas.updatePolyline(trail);
  Canvas.updateRect(turtle);
}
