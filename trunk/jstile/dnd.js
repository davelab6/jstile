window.onload = function(){
  addTiles();
  updateAnswer();
}

function addTiles() {
  for (var i = 0; i < 10; i++) {
    var span = document.createElement("span");
    span.innerHTML = "" + i;
    span.className = "tile";
    span.id = "proto_" + i;
    document.body.appendChild(span);
    new Draggable(span.id, { ghosting: false, revert: true });
  }
  Droppables.add("arg1",
  { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});
  Droppables.add("arg2",
  { onDrop: acceptDrop, accept: "tile", hoverclass: "hoverclass"});
}

function acceptDrop(element, droppableElement) {
  droppableElement.innerHTML = element.innerHTML;
  updateAnswer();
}

function updateAnswer() {
  $("answer").innerHTML = parseInt($("arg1").innerHTML) + parseInt($("arg2").innerHTML);
}
