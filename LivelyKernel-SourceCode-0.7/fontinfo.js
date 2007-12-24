/*
 * Copyright © 2006-2007 Sun Microsystems, Inc.
 * All rights reserved.  Use is subject to license terms.
 * This distribution may include materials developed by third parties.
 *  
 * Sun, Sun Microsystems, the Sun logo, Java and JavaScript are trademarks
 * or registered trademarks of Sun Microsystems, Inc. in the U.S. and
 * other countries.
 */ 

// This file requires (X)HTML DOM, NOT XML DOM

var XHTML_NS = "http://www.w3.org/1999/xhtml";

function CharacterInfo(width, height) {
    this.width = width;
    this.height = height;
};

CharacterInfo.prototype.toString = function() {
    return this.width + "x" + this.height;
};

function Font(family/*:String*/, size/*:Integer*/){
    this.family = family;
    this.size = size;
    this.extents = [];

    var body = document.documentElement.getElementsByTagName('body')[0];    
    var d = body.appendChild(document.createElementNS(XHTML_NS, "div"));
    
    d.style.kerning    = 0;
    d.style.fontFamily = family;
    d.style.fontSize   = size + "px";

    for (var i = 33; i < 255; i++) {
        var sub = d.appendChild(document.createElementNS(XHTML_NS, "span"));
        sub.appendChild(document.createTextNode(String.fromCharCode(i)));
        this.extents[i] = new CharacterInfo(sub.offsetWidth,  sub.offsetHeight);
    }

    if (d.offsetWidth == 0) {
	console.log("timing problems, expect messed up text for font %s %s", family, size);
    }

    // handle spaces
    var sub = d.appendChild(document.createElementNS(XHTML_NS, "span"));
    sub.appendChild(document.createTextNode('x x'));

    var xWidth = this.getCharWidth('x');
    if (xWidth < 0) { 
        throw new Error('x Width is ' + xWidth);
    }
    
    var spaceWidth = sub.offsetWidth - xWidth*2;
    console.log('font ' + this + ': space width ' + spaceWidth + ' from ' + sub.offsetWidth + ' xWidth ' + xWidth);    
    // tjm: sanity check as Firefox seems to do this wrong with certain values
    if (spaceWidth > 100) {
	
	this.extents[(' '.charCodeAt(0))] = //new CharacterInfo(this.getCharInfo(' ').width - 2, this.getCharInfo(' ').height);
	new CharacterInfo(2*xWidth/3, sub.offsetHeight);
    } else {
	this.extents[(' '.charCodeAt(0))] = new CharacterInfo(spaceWidth, sub.offsetHeight);
    }
    
    //d.removeChild(span);
    body.removeChild(d);
};

Font.prototype.getSize = function() {
    return this.size;
};

Font.prototype.getFamily = function() {
    return this.family;
};

Font.prototype.toString = function() {
    return this.family + " " + this.getSize();
}

Font.prototype.getCharInfo = function(charString) {
    var code = charString.charCodeAt(0);
    return this.extents[code];
};

Font.prototype.getCharWidth = function(charString) {
    var code = charString.charCodeAt(0);
    return this.extents[code] ? this.extents[code].width : -1;
};

Font.prototype.getCharHeight = function(charString) {
    var code = charString.charCodeAt(0);
    return this.extents[code] ? this.extents[code].height : -1;
};

Font.prototype.applyTo = function(element) {
    element.setAttributeNS(null, "font-size", this.getSize());
    element.setAttributeNS(null, "font-family", this.getFamily());
};

Font.cache = {};

Font.forFamily = function(familyName, size) {
    var key  = familyName + ":" + size;
    var entry = Font.cache[key];
    if (!entry) {
        try {
            entry = new Font(familyName, size);
        } catch(er) {
            console.log("%s when looking for %s:%s", er, familyName, size);
            return null;
        }
        Font.cache[key] = entry;
    }
    return entry;
};

