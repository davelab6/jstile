// ---------- A simple model tracking mouse X coordinate ----------

Model = {}
Model.dependents = [];

// Main loop
Model.handleEvent = function(event) {
  Model.x = event.pageX;
  $("ModelX").innerHTML = Model.x;
  $("ModelDependents").innerHTML = Model.dependents;
  Model.changed();
}

Model.changed = function() {
  var generator, i;
  for (var i = 0; i < Model.dependents.length; i++) {
    try {
      generator = Model.dependents[i];
      generator.send(Model.x);
    } catch (err if err instanceof StopIteration) {
      // When the generator is finished, remove dependency.
      i = Model.dependents.indexOf(generator);
      this.dependents.splice(i, 1); 
    }
  }
}

Model.addDependent = function(f) {
  f.next();
  Model.dependents.push(f);
}

// ---------- Listners ----------

// Basic example of an infinit loop as an observer (like eToys).
function everything() {
  yield; // Just an idiom because the first yield can not receive a value.
  while (true) {
    $("everything").innerHTML = yield; // Get updated X value (now it's hard-coded)
  };
}

// It lives only 100 cycle, after that, the dependency is released automatically.
function first100() {
  yield;
  for(var i = 0; i < 100; i++) {
    $("first100").innerHTML = yield;
  }; 
}

// Only one of 100 is interesting. (because sleep() is difficult in JS)
function each100() {
  yield;
  while (true) {
    for (var i = 0; i < 99; i++) yield; // Throw away 99 times!
    $("each100").innerHTML = yield;
  }
}

// ---------- Initialization ----------

// Add listners. You don't need removeDependent.
Model.addDependent(everything());
Model.addDependent(first100());
Model.addDependent(each100());

window.onload = function() {
  document.body.onmousemove = function (event) {
    Model.handleEvent(event);
  }
}
