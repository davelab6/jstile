/*
 * Copyright � 2006-2007 Sun Microsystems, Inc.
 * All rights reserved.  Use is subject to license terms.
 * This distribution may include materials developed by third parties.
 *  
 * Sun, Sun Microsystems, the Sun logo, Java and JavaScript are trademarks
 * or registered trademarks of Sun Microsystems, Inc. in the U.S. and
 * other countries.
 */ 

/**
 * Tools.js.  This file defines various tools such as the class browser,
 * object inspector, style editor, and profiling and debugging capabilities.  
 */

// ===========================================================================
// Class Browser
// ===========================================================================

/**
 * @class SimpleBrowser: A simple JavaScript class browser
 */
   
SimpleBrowser = Class.extend(Model);

Object.extend(SimpleBrowser.prototype, {

    initialize: function() { SimpleBrowser.superClass.initialize.call(this); },

    getClassList: function() { return Class.listClassNames(Global).filter(function(n) { return !n.startsWith('SVG')}).sort(); },

    setClassName: function(n) { this.className = n; this.changed("getMethodList"); },

    getMethodList: function() {
        if (this.className == null) return [];
        else {
            if (this.className == 'Global') return Global.constructor.functionNames().without(this.className);
            else return Global[this.className].localFunctionNames();
        }
    },

    setMethodName: function(n) { this.methodName = n; this.changed("getMethodString"); },

    getMethodString: function() { 
        if (!this.className || !this.methodName) return "no code"; 
        else return Function.methodString(this.className, this.methodName); 
    },

    setMethodString: function(newDef) { eval(newDef); },

    openIn: function(world, location) {
        world.addMorphAt(WindowMorph(this.buildView(pt(400,300)), 'JavaScript Code Browser'), location);
        this.changed('getClassList')
    },

    buildView: function(extent) {
        var panel = PanelMorph.makePanedPanel(extent, [
            ['leftPane', ListPane, Rectangle(0, 0, 0.5, 0.6)],
            ['rightPane', ListPane, Rectangle(0.5, 0, 0.5, 0.6)],
            ['bottomPane', TextPane, Rectangle(0, 0.6, 1, 0.4)]
        ]);
        var m = panel.getNamedMorph('leftPane');
        m.connectModel({model: this, getList: "getClassList", setSelection: "setClassName"});
        m = panel.getNamedMorph('rightPane');
        m.connectModel({model: this, getList: "getMethodList", setSelection: "setMethodName"});
        m = panel.getNamedMorph('bottomPane');
        m.connectModel({model: this, getText: "getMethodString", setText: "setMethodString"});

        var thisModel = this;
        panel.morphMenu = function(evt) { // Offer to open a stats panel
            var menu = Morph.prototype.morphMenu.call(this, evt);
            if (thisModel.className == null) return menu;
            var theClass = Global[thisModel.className];
            if (theClass.prototype == null) return menu;
            menu.addLine();
            menu.addItem(['analyze selection', function() {
               showStatsViewer(theClass.prototype, thisModel.className + "..."); 
            }]);
            return menu; 
        }
        return panel;
    }
    
});

// ===========================================================================
// Object Inspector
// ===========================================================================

/**
 * @class SimpleInspector: A simple JavaScript object (instance) inspector
 */
   
SimpleInspector = Class.extend(Model);

Object.extend(SimpleInspector.prototype, {

    initialize: function(targetMorph) {
        SimpleInspector.superClass.initialize.call(this);
        this.inspectee = targetMorph;
    },

    getPropList: function() { return Object.properties(this.inspectee); },

    setPropName: function(n, v) { this.propName = n; this.changed("getPropText", v) },

    getPropList: function() { return Object.properties(this.inspectee); },

    getPropText: function() {
        if (this.selectedItem() == null) return "-----";
        return Object.inspect(this.selectedItem()).withNiceDecimals();
    },

    setPropText: function(txt, v) { this.inspectee[this.propName] = this.inspectee.evalInThis(txt); },

    selectedItem: function() { return this.inspectee[this.propName]; },

    contextForEval: function() { return this.inspectee; },

    openIn: function(world, location) {
        var rect = (location || pt(50,50)).extent(pt(400,250));
        var window = this.buildView(rect);
        world.addMorph(window);
        this.changed('getPropList');
        // DI: experimental continuous update feature.  It works, but not removed upon close
        // var rightPane = window.targetMorph.getNamedMorph('rightPane').innerMorph();
        // rightPane.startStepping(1000, 'updateView', 'getPropText');
    },

    open: function() { return this.openIn(WorldMorph.current()); },

    buildView: function(rect) {
        var panel = PanelMorph.makePanedPanel(rect.extent(), [
            ['leftPane', ListPane, Rectangle(0, 0, 0.5, 0.6)],
            ['rightPane', TextPane, Rectangle(0.5, 0, 0.5, 0.6)],
            ['bottomPane', TextPane, Rectangle(0, 0.6, 1, 0.4)]
        ]);
        var m = panel.getNamedMorph('leftPane');
        m.connectModel({model: this, getList: "getPropList", setSelection: "setPropName"});
        m = panel.getNamedMorph('rightPane');
        m.connectModel({model: this, getText: "getPropText", setText: "setPropText", doitContext: "contextForEval"});
        m = panel.getNamedMorph('bottomPane');
        m.connectModel({model: this, doitContext: "contextForEval"});
        m.innerMorph().setTextString("doits here have this === inspectee");

        var thisModel = this;
        panel.morphMenu = function(evt) { // offer to inspect the current selection
            var menu = Morph.prototype.morphMenu.call(this, evt);
            if (thisModel.selectedItem() == null) return menu;
            menu.addLine();
            menu.addItem(['inspect selection', function() {
            new SimpleInspector(thisModel.selectedItem()).openIn(WorldMorph.current())}])
            return menu; 
        }
        return WindowMorph(panel, 'Inspector');
    }

});

// ===========================================================================
// Style Editor Panel
// ===========================================================================
  
/**
 * @class StylePanel: Interactive style editor for morphs 
 */
   
StylePanel = Class.extend(Model);

Object.extend(StylePanel.prototype, {

    initialize: function(targetMorph) {
        StylePanel.superClass.initialize.call(this);
        this.targetMorph = targetMorph;
        this.originalSpec = targetMorph.makeStyleSpec();
        for (var p in this.originalSpec) this[p] = this.originalSpec[p];
    },

    getBorderWidth: function() { return this.borderWidth; },

    setBorderWidth: function(w) {
        this.borderWidth = w.roundTo(0.1);
        this.targetMorph.setBorderWidth(this.borderWidth);
        this.changed('getBorderWidth');
    },

    setBorderColor: function(c) { // Maybe add a little color swatch in the view
        this.borderColor = c;
        this.targetMorph.setBorderColor(this.borderColor);
    },

    getRounding: function() { return this.rounding; },
    
    setRounding: function(r) {
        this.targetMorph.shape.roundEdgesBy(this.rounding = r.roundTo(1));
        this.changed('getRounding');
    },

    getFillTypes: function() { return ["simple", "linear gradient", "radial gradient", "stipple"]; },
    getFillType: function() { return this.fillType; },
    setFillType: function(type) { this.fillType = type;  this.setFill(); },
    getFillDirs: function() { return ["NorthSouth", "SouthNorth", "EastWest", "WestEast"]; },
    getFillDir: function() { return this.fillDir; },
    setFillDir: function(dir) { this.fillDir = dir;  this.setFill(); },
    setColor1: function(color) { this.color1 = color; this.setFill(); },
    setColor2: function(color) { this.color2 = color; this.setFill(); },
    
    setFill: function() {
        if (this.fillType == null) this.fillType = 'simple';
        if (this.color1 == null) this.color1 = this.fill;
        if (this.color2 == null) this.color2 = this.fill;

        if (this.fillType == 'simple')  this.targetMorph.setFill(this.color1);
    
        if (this.fillType == 'linear gradient') {
            if (this.fillDir == null) this.fillDir = 'NorthSouth';
            this.targetMorph.setFill(LinearGradient.makeGradient(this.color1, this.color2, LinearGradient[this.fillDir]));
        }
    
        if (this.fillType == 'radial gradient')
            this.targetMorph.setFill(RadialGradient.makeCenteredGradient(this.color1, this.color2));
    },
     
    getFillOpacity: function() { return this.fillOpacity; },
    
    setFillOpacity: function(op) {
        this.fillOpacity = op.roundTo(0.01);
        this.targetMorph.setFillOpacity(this.fillOpacity);
        this.changed('getFillOpacity');
        this.setStrokeOpacity(op); // Stroke opacity is linked to fill
    },

    getStrokeOpacity: function() { return this.strokeOpacity; },
    
    setStrokeOpacity: function(op) {
        this.strokeOpacity = op.roundTo(0.01);
        this.targetMorph.setStrokeOpacity(this.strokeOpacity);
        this.changed('getStrokeOpacity')
    },

    setTextColor: function(c) { // Maybe add a little color swatch in the view
        this.textColor = c;
        this.targetMorph.setTextColor(this.textColor);
    },

    getFontFamily: function() { return this.targetMorph.getFontFamily(); },
    
    setFontFamily: function(familyName) {
        this.familyName = familyName ;
        this.targetMorph.setFontFamily(familyName);
    },

    getFontSize: function() { return this.targetMorph.getFontSize().toString(); },
    
    setFontSize: function(fontSize) {
        this.fontSize = eval(fontSize) ;
        this.targetMorph.setFontSize(this.fontSize);
    },

    openIn: function(world, location) {
        var rect = (location || pt(50,50)).extent(pt(340,100));
        world.addMorph(WindowMorph(this.buildView(rect), 'Style Panel'));
        this.changed('all')
    },

    open: function(morph) {
        return this.openIn(WorldMorph.current());
    },

    buildView: function(rect) {
        var panelExtent = rect.extent();
        var panel = PanelMorph(panelExtent, "rect");
        panel.setFill(Color.primary.blue.lighter().lighter());
        panel.setBorderWidth(2);
        var m;
        var y = 10;

        panel.addMorph(TextMorph(Rectangle(50, y, 100, 20), "Border Width").beLabel());
        panel.addMorph(m = PrintMorph(Rectangle(150, y, 40, 20)));
        m.connectModel({model: this, getValue: "getBorderWidth", setValue: "setBorderWidth"});
        panel.addMorph(m = SliderMorph(Rectangle(200, y, 100, 20), 10.0));
        m.connectModel({model: this, getValue: "getBorderWidth", setValue: "setBorderWidth"});
        y += 30;

        panel.addMorph(TextMorph(Rectangle(50, y, 100, 20), 'Border Color').beLabel());
        panel.addMorph(m = ColorPickerMorph(Rectangle(250, y, 50, 30)));
        m.connectModel({model: this, setColor: "setBorderColor"});
        y += 40;

        if (this.targetMorph.shape.roundEdgesBy) {
            panel.addMorph(TextMorph(Rectangle(50, y, 100, 20), 'Round Corners').beLabel());
            panel.addMorph(m = PrintMorph(Rectangle(150, y, 40, 20)));
            m.connectModel({model: this, getValue: "getRounding", setValue: "setRounding"});
            panel.addMorph(m = SliderMorph(Rectangle(200, y, 100, 20), 50.0));
            m.connectModel({model: this, getValue: "getRounding", setValue: "setRounding"});
            y += 30;
        }

        panel.addMorph(m = CheapListMorph(Rectangle(50, y, 100, 50),[]));
        m.connectModel({model: this, getList: "getFillTypes", getSelection: "getFillType", setSelection: "setFillType"});
        panel.addMorph(m = CheapListMorph(Rectangle(160, y, 75, 60),[]));
        m.connectModel({model: this, getList: "getFillDirs", getSelection: "getFillDir", setSelection: "setFillDir"});
        panel.addMorph(m = ColorPickerMorph(Rectangle(250, y, 50, 30)));
        m.connectModel({model: this, setColor: "setColor1"});
        panel.addMorph(m = ColorPickerMorph(Rectangle(250, y+40, 50, 30)));
        m.connectModel({model: this, setColor: "setColor2"});
        y += 80;

        panel.addMorph(TextMorph(Rectangle(50, y, 90, 20), 'Fill Opacity').beLabel());
        panel.addMorph(m = PrintMorph(Rectangle(150, y, 40, 20)));
        m.connectModel({model: this, getValue: "getFillOpacity", setValue: "setFillOpacity"});
        panel.addMorph(m = SliderMorph(Rectangle(200, y, 100, 20), 1.0));
        m.connectModel({model: this, getValue: "getFillOpacity", setValue: "setFillOpacity"});
        y += 30;

        panel.addMorph(TextMorph(Rectangle(50, y, 90, 20), 'Stroke Opacity').beLabel());
        panel.addMorph(m = PrintMorph(Rectangle(150, y, 40, 20)));
        m.connectModel({model: this, getValue: "getStrokeOpacity", setValue: "setStrokeOpacity"});
        panel.addMorph(m = SliderMorph(Rectangle(200, y, 100, 20), 1.0));
        m.connectModel({model: this, getValue: "getStrokeOpacity", setValue: "setStrokeOpacity"});
        y += 30;

        if (this.targetMorph.setTextColor) {
            panel.addMorph(TextMorph(Rectangle(50, y, 100, 20), "Text Color").beLabel());
            panel.addMorph(m = ColorPickerMorph(Rectangle(250, y, 50, 30)));
            m.connectModel({model: this, setColor: "setTextColor"});
            y += 40;

            panel.addMorph(TextMorph(Rectangle(50, y, 100, 20), 'Font Family').beLabel());
            panel.addMorph(m = TextMorph(Rectangle(150, y, 150, 20)));
            m.connectModel({model: this, getText: "getFontFamily", setText: "setFontFamily"});
            y += 30;

            panel.addMorph(TextMorph(Rectangle(50, y, 100, 20), 'Font Size').beLabel());
            panel.addMorph(m = TextMorph(Rectangle(150, y, 50, 20)));
            m.connectModel({model: this, getText: "getFontSize", setText: "setFontSize"});
            y += 30;
        }

        var oldBounds = panel.shape.bounds();
        panel.shape.setBounds(oldBounds.withHeight(y + 5 - oldBounds.y))

        panel.morphMenu = function(evt) { 
            var menu = Morph.prototype.morphMenu.call(this,evt);
            menu.addLine();
            menu.addItem(['inspect model', new SimpleInspector(panel.getModel()), "openIn", this.world()])
            return menu;
        }

        return panel;
    }
    
});

// ===========================================================================
// Profiler & Statistics Viewer
// ===========================================================================

/**
 * Dan's JavaScript profiler
 */
  
Object.profiler = function (object, service) {
    // The wondrous Ingalls profiler...
    // Invoke as, eg, Object.profiler(Color, "start"), or Object.profiler(Color.prototype, "start")
    var stats = {};
    var fnames = object.constructor.functionNames();

    for (var i = 0; i < fnames.length; i++) { 
        var fname = fnames[i];

        if (fname == "constructor") {} // leave the constructor alone
        else if (service == "stop") 
            object[fname] = object[fname].originalFunction;  // restore original functions
        else if (service == "tallies") 
            stats[fname] = object[fname].tally;  // collect the tallies
        else if (service == "ticks") 
            stats[fname] = object[fname].ticks;  // collect the real-time ticks
        else if (service == "reset") { 
            object[fname].tally = 0; object[fname].ticks = 0; // reset the stats
        } else if (service == "start") { // Make a proxy function object that just calls the original
            var tallyFunc = function () {
                var tallyFunc = arguments.callee;
                tallyFunc.tally++;
                msTime = new Date().getTime();
                var result = tallyFunc.originalFunction.apply(this, arguments); 
                tallyFunc.ticks += (new Date().getTime() - msTime);
               return result;
            }
            
            // Attach tallies, and the original function, then replace the original
            if (object[fname].tally == null) 
                tallyFunc.originalFunction = object[fname];
            else 
                tallyFunc = object[fname]; // So repeated "start" will work as "reset"

            tallyFunc.tally = 0;  
            tallyFunc.ticks = 0;
            object[fname] = tallyFunc; 
        } 
    }
    
    return stats; 
};

function showStatsViewer(profilee,title) {
    Object.profiler(profilee, "start");
    var m = ButtonMorph(WorldMorph.current().bounds().topCenter().addXY(0,20).extent(pt(150, 20)));
    m.connectModel({model: m, getValue: "getThisValue", setValue: "setThisValue"});
    m.getThisValue = function() { return this.onState; };
    m.setThisValue = function(newValue) {
        this.onState = newValue;
        if (newValue == false) { // on mouseup...
            if (this.statsMorph == null) {
                this.statsMorph = TextMorph(this.bounds().bottomLeft().extent(pt(250,20)), "no text");
                WorldMorph.current().addMorph(this.statsMorph); 
            }
            var tallies = Object.profiler(profilee, "tallies");
            var ticks = Object.profiler(profilee, "ticks");
            var statsArray = [];
            
            for (var field in tallies) {
                if (tallies[field] instanceof Function) continue;
                if (tallies[field] == 0) continue;
                
                statsArray.push([tallies[field], ticks[field], field]);
            }

            statsArray.sort(function(a,b) {return b[0]-a[0];});
            var statsText = "";
            if (title) statsText += title + "\n";
            statsText += "tallies : ticks : methodName\n";
            statsText += statsArray.invoke('join', ' : ').join('\n');
            this.statsMorph.setTextString(statsText);
            Object.profiler(profilee, "reset"); 
        } 
    }
    
    WorldMorph.current().addMorph(m);
    var t = TextMorph(pt(0,0).extent(m.bounds().extent()), 'Display and reset stats').beLabel();
    m.addMorph(t);
};

// Inspection tools, called interactively
Object.extend(console, {
    morphs: function(morph) {
        var array = [];
        (morph || WorldMorph.current()).submorphs.each(function(m) { array.push(m) });
        return array;
    },

    $: function(id) {
        return document.getElementById(id.toString());
    }

});

console.log('loaded Tools.js');
