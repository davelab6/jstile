/*
 * Copyright © 2006-2007 Sun Microsystems, Inc.
 * All rights reserved.  Use is subject to license terms.
 * This distribution may include materials developed by third parties.
 *  
 * Sun, Sun Microsystems, the Sun logo, Java and JavaScript are trademarks
 * or registered trademarks of Sun Microsystems, Inc. in the U.S. and
 * other countries.
 */ 

var TextCompatibilityTrait = {
    
    naiveGetFontSize: function() {
        // not this won't work if the attribute is inherited or it has units etc
        // besides, there's no single font size to report
        return parseInt(this.getAttribute("font-size"));
    },

    getFontSize: function() {
        for (var node = this; node && (/text|tspan/).test(node.tagName); node = node.parentNode) {
            var result = node.getAttribute("font-size");
            if (result) return parseInt(result);
        }
        return 0; // Should we return a default size?
    },
    
    naiveGetFontFamily: function() {
        // not this won't work if the attribute is inherited etc
        // besides, there's no single font family to report
        return this.getAttribute("font-family");
    },

    getFontFamily: function() {
        for (var node = this; node && (/text|tspan/).test(node.tagName); node = node.parentNode) {
            var result = node.getAttribute("font-family");
            if (result) return result;
        }
        return null; // ???
    },

    naiveGetX: function() {
        // not this won't work if the attribute is not explicitly set etc
        return parseInt(this.getAttribute("x"));
    },
    
    naiveGetY: function() {
        // not this won't work if the attribute is not explicitly set etc
        return parseInt(this.getAttribute("y"));
    },

    setX: function(newValue /*:float*/) {
        var oldValue = this.naiveGetX();
        if (oldValue != newValue) { // FIXME: maybe just recalc the offset
            this.extentTable = null;
        }
        this.setAttributeNS(null, "x", newValue.toString());
    },
    
    setY: function(newValue /*:float*/) {
        var oldValue = this.naiveGetY();
        if (oldValue != newValue) { // FIXME: maybe just recalc the offset
            this.extentTable = null;
        }
        this.setAttributeNS(null, "y", newValue.toString());
    },

    // FIXME consider precomputing only up to the last position requested
    naiveComputeExtents: function() {
        if (!this.extentTable) {
            this.extentTable = new Array(this.textContent.length);
            var fontInfo = Font.forFamily(this.naiveGetFontFamily(), this.naiveGetFontSize());
            if (!fontInfo) {
                console.log('did not create font info for ' + family);
                return this.extentTable;// maybe just zeros?
            }
    
            var leftX = this.naiveGetX();
            var bottomY = this.naiveGetY();

            for (var i = 0; i < this.textContent.length; i++) {
                var thisChar = this.textContent.charAt(i);
                var h = fontInfo.getCharHeight(thisChar);
                var w = fontInfo.getCharWidth(thisChar);
                if (isNaN(w)) {
                    console.warn('width is a NaN for char ' + thisChar);
                   continue;
                }
                var ext = Rectangle(leftX, bottomY - h, w, h);
                this.extentTable[i] = ext;
                leftX += w;
            }
            // console.log('for string ' + this.textContent + ' family ' + this.naiveGetFontFamily() + ' size ' + this.naiveGetFontSize() + ' computed ' + this.extentTableToString());
        }
        return this.extentTable;
    },
    
    onDemandEstablishExtentTable: function() {
        if (!this.extentTable) {
            this.extentTable = new Array(this.textString.length);
            if (!this.fontInfo) this.fontInfo = Font.forFamily(this.getFontFamily(), this.getFontSize());
            if (!this.fontInfo) {
                console.log('did not create font info for ' + family);
                return this.extentTable;// maybe just zeros?
            }
        }
    },

    // this is private for onDemandComputeExtents
    computeExtentsForPosition: function(position, leftX) {
        var bottomY = this.naiveGetY();
        var thisChar = this.textString.charAt(position);
        var h = this.fontInfo.getCharHeight(thisChar);
        var w = this.fontInfo.getCharWidth(thisChar);

        if (isNaN(w)) {
            console.warn('computeExtentsForPosition: width is a NaN for char ' + thisChar);
        } else {
            var ext = Rectangle(leftX, bottomY - h, w, h);
            this.extentTable[position] = ext;
        }
    },

    // compute extents back leftwards to the last computed extent or the left edge
    //   (non recursive version)
    onDemandComputeExtents: function(position) {
        var originalPosition = position;
        var leftX;

        this.onDemandEstablishExtentTable();
        if (position < this.startIndex) return null;
        if (!this.extentTable[position]) {
            while (position >= this.startIndex && !this.extentTable[position]) {
                // console.log('extents from %s to %s on %s', this.startIndex, originalPosition, this.textString);
                if (position == this.startIndex) {
                    this.computeExtentsForPosition(position, this.naiveGetX());
                    break;
                }
                position--;
            }
            while (position < originalPosition) {
                this.computeExtentsForPosition(position + 1, this.extentTable[position].x + this.extentTable[position].width);
                position++;
            }
        }
        return this.extentTable[originalPosition];
    },

    extentTableToString: function() {
        var s = "";
        for (var i = 0; i < this.extentTable.length; i++) {
            var e = this.extentTable[i];
            if (e == null) {
                s += "*";
            } else {
                s += "|" + e.x + "X," + e.y + "Y," + e.width + "W," + e.height + "H|";
            }
        }
        return s;
    },
    
    getExtentOfChar: function(position) {
        // var ext = this.naiveComputeExtents()[position];
        var ext = this.onDemandComputeExtents(position);
        // KP: note clone to avoid inadvertent modifications
        return ext? ext.clone() : null;
    },
    
    getStartPositionOfChar: function(pos) {
        return this.getExtentOfChar(pos).bottomLeft();
    },

    getEndPositionOfChar: function(pos) {
        return this.getExtentOfChar(pos).bottomRight();
    },

    getCharNumAtPosition: function(pos) {
        // FIXME binary search?
        // var exts = this.naiveComputeExtents();
        for (var i = 0; i < this.textContent.length; i++) {
            var ext =  this.getExtentOfChar(i);
            if (ext && ext.containsPoint(pos)) return i;
        }
        // console.log('failed for ' + pos + ' exts is ' + this.extentTableToString());
        return -1;
    }

};

Text = HostClass.fromElementType('text', false);
Object.extend(Text.prototype, TextCompatibilityTrait);

TextSpan = HostClass.fromElementType('tspan', false);
Object.extend(TextSpan.prototype, TextCompatibilityTrait);

Object.extend(TextSpan.prototype, {

    setRelativeX: function(arg) {
        this.setAttributeNS(null, "dx", arg);
    },

    setRelativeY: function(arg) {
        this.setAttributeNS(null, "dy", arg);
    }

});

console.log('loaded svgtext-compat.js');

