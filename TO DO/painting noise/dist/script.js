

/*
 * A fast javascript implementation of simplex noise by Jonas Wagner
 *
 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 *
 * Copyright (C) 2012 Jonas Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
(function () {
"use strict";

var F2 = 0.5 * (Math.sqrt(3.0) - 1.0),
    G2 = (3.0 - Math.sqrt(3.0)) / 6.0,
    F3 = 1.0 / 3.0,
    G3 = 1.0 / 6.0,
    F4 = (Math.sqrt(5.0) - 1.0) / 4.0,
    G4 = (5.0 - Math.sqrt(5.0)) / 20.0;


function SimplexNoise(random) {
    if (!random) random = Math.random;
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 256; i++) {
        this.p[i] = random() * 256;
    }
    for (i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
    }

}
SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
                            - 1, 1, 0,
                            1, - 1, 0,

                            - 1, - 1, 0,
                            1, 0, 1,
                            - 1, 0, 1,

                            1, 0, - 1,
                            - 1, 0, - 1,
                            0, 1, 1,

                            0, - 1, 1,
                            0, 1, - 1,
                            0, - 1, - 1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1,
                            0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1,
                            1, 0, 1, 1, 1, 0, 1, - 1, 1, 0, - 1, 1, 1, 0, - 1, - 1,
                            - 1, 0, 1, 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, - 1, 0, - 1, - 1,
                            1, 1, 0, 1, 1, 1, 0, - 1, 1, - 1, 0, 1, 1, - 1, 0, - 1,
                            - 1, 1, 0, 1, - 1, 1, 0, - 1, - 1, - 1, 0, 1, - 1, - 1, 0, - 1,
                            1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0,
                            - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 0]),
    noise2D: function (xin, yin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0=0, n1=0, n2=0; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin) * F2; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = xin - X0; // The x,y distances from the cell origin
        var y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            var gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function (xin, yin, zin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);
        var t = (i + j + k) * G3;
        var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        var Y0 = j - t;
        var Z0 = k - t;
        var x0 = xin - X0; // The x,y,z distances from the cell origin
        var y0 = yin - Y0;
        var z0 = zin - Z0;
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // X Y Z order
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // X Z Y order
            else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // Z X Y order
        }
        else { // x0<y0
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Z Y X order
            else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Y Z X order
            else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // Y X Z order
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;
        var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
        var y2 = y0 - j2 + 2.0 * G3;
        var z2 = z0 - k2 + 2.0 * G3;
        var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
        var y3 = y0 - 1.0 + 3.0 * G3;
        var z3 = z0 - 1.0 + 3.0 * G3;
        // Work out the hashed gradient indices of the four simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function (x, y, z, w) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad4 = this.grad4;

        var n0, n1, n2, n3, n4; // Noise contributions from the five corners
        // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
        var s = (x + y + z + w) * F4; // Factor for 4D skewing
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var k = Math.floor(z + s);
        var l = Math.floor(w + s);
        var t = (i + j + k + l) * G4; // Factor for 4D unskewing
        var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
        var Y0 = j - t;
        var Z0 = k - t;
        var W0 = l - t;
        var x0 = x - X0; // The x,y,z,w distances from the cell origin
        var y0 = y - Y0;
        var z0 = z - Z0;
        var w0 = w - W0;
        // For the 4D case, the simplex is a 4D shape I won't even try to describe.
        // To find out which of the 24 possible simplices we're in, we need to
        // determine the magnitude ordering of x0, y0, z0 and w0.
        // Six pair-wise comparisons are performed between each possible pair
        // of the four coordinates, and the results are used to rank the numbers.
        var rankx = 0;
        var ranky = 0;
        var rankz = 0;
        var rankw = 0;
        if (x0 > y0) rankx++;
        else ranky++;
        if (x0 > z0) rankx++;
        else rankz++;
        if (x0 > w0) rankx++;
        else rankw++;
        if (y0 > z0) ranky++;
        else rankz++;
        if (y0 > w0) ranky++;
        else rankw++;
        if (z0 > w0) rankz++;
        else rankw++;
        var i1, j1, k1, l1; // The integer offsets for the second simplex corner
        var i2, j2, k2, l2; // The integer offsets for the third simplex corner
        var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
        // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
        // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
        // impossible. Only the 24 indices which have non-zero entries make any sense.
        // We use a thresholding to set the coordinates in turn from the largest magnitude.
        // Rank 3 denotes the largest coordinate.
        i1 = rankx >= 3 ? 1 : 0;
        j1 = ranky >= 3 ? 1 : 0;
        k1 = rankz >= 3 ? 1 : 0;
        l1 = rankw >= 3 ? 1 : 0;
        // Rank 2 denotes the second largest coordinate.
        i2 = rankx >= 2 ? 1 : 0;
        j2 = ranky >= 2 ? 1 : 0;
        k2 = rankz >= 2 ? 1 : 0;
        l2 = rankw >= 2 ? 1 : 0;
        // Rank 1 denotes the second smallest coordinate.
        i3 = rankx >= 1 ? 1 : 0;
        j3 = ranky >= 1 ? 1 : 0;
        k3 = rankz >= 1 ? 1 : 0;
        l3 = rankw >= 1 ? 1 : 0;
        // The fifth corner has all coordinate offsets = 1, so no need to compute that.
        var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
        var y1 = y0 - j1 + G4;
        var z1 = z0 - k1 + G4;
        var w1 = w0 - l1 + G4;
        var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
        var y2 = y0 - j2 + 2.0 * G4;
        var z2 = z0 - k2 + 2.0 * G4;
        var w2 = w0 - l2 + 2.0 * G4;
        var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
        var y3 = y0 - j3 + 3.0 * G4;
        var z3 = z0 - k3 + 3.0 * G4;
        var w3 = w0 - l3 + 3.0 * G4;
        var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
        var y4 = y0 - 1.0 + 4.0 * G4;
        var z4 = z0 - 1.0 + 4.0 * G4;
        var w4 = w0 - 1.0 + 4.0 * G4;
        // Work out the hashed gradient indices of the five simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var ll = l & 255;
        // Calculate the contribution from the five corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0) n4 = 0.0;
        else {
            var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        // Sum up and scale the result to cover the range [-1,1]
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }


};

window.SimplexNoise = SimplexNoise;

})();

/**
 * dat-gui JavaScript Controller Library
 * https://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */
var dat=dat||{};dat.gui=dat.gui||{};dat.utils=dat.utils||{};dat.controllers=dat.controllers||{};dat.dom=dat.dom||{};dat.color=dat.color||{};dat.utils.css=function(){return{load:function(f,a){a=a||document;var d=a.createElement("link");d.type="text/css";d.rel="stylesheet";d.href=f;a.getElementsByTagName("head")[0].appendChild(d)},inject:function(f,a){a=a||document;var d=document.createElement("style");d.type="text/css";d.innerHTML=f;a.getElementsByTagName("head")[0].appendChild(d)}}}();
dat.utils.common=function(){var f=Array.prototype.forEach,a=Array.prototype.slice;return{BREAK:{},extend:function(d){this.each(a.call(arguments,1),function(a){for(var c in a)this.isUndefined(a[c])||(d[c]=a[c])},this);return d},defaults:function(d){this.each(a.call(arguments,1),function(a){for(var c in a)this.isUndefined(d[c])&&(d[c]=a[c])},this);return d},compose:function(){var d=a.call(arguments);return function(){for(var e=a.call(arguments),c=d.length-1;0<=c;c--)e=[d[c].apply(this,e)];return e[0]}},
each:function(a,e,c){if(a)if(f&&a.forEach&&a.forEach===f)a.forEach(e,c);else if(a.length===a.length+0)for(var b=0,p=a.length;b<p&&!(b in a&&e.call(c,a[b],b)===this.BREAK);b++);else for(b in a)if(e.call(c,a[b],b)===this.BREAK)break},defer:function(a){setTimeout(a,0)},toArray:function(d){return d.toArray?d.toArray():a.call(d)},isUndefined:function(a){return void 0===a},isNull:function(a){return null===a},isNaN:function(a){return a!==a},isArray:Array.isArray||function(a){return a.constructor===Array},
isObject:function(a){return a===Object(a)},isNumber:function(a){return a===a+0},isString:function(a){return a===a+""},isBoolean:function(a){return!1===a||!0===a},isFunction:function(a){return"[object Function]"===Object.prototype.toString.call(a)}}}();
dat.controllers.Controller=function(f){var a=function(a,e){this.initialValue=a[e];this.domElement=document.createElement("div");this.object=a;this.property=e;this.__onFinishChange=this.__onChange=void 0};f.extend(a.prototype,{onChange:function(a){this.__onChange=a;return this},onFinishChange:function(a){this.__onFinishChange=a;return this},setValue:function(a){this.object[this.property]=a;this.__onChange&&this.__onChange.call(this,a);this.updateDisplay();return this},getValue:function(){return this.object[this.property]},
updateDisplay:function(){return this},isModified:function(){return this.initialValue!==this.getValue()}});return a}(dat.utils.common);
dat.dom.dom=function(f){function a(b){if("0"===b||f.isUndefined(b))return 0;b=b.match(e);return f.isNull(b)?0:parseFloat(b[1])}var d={};f.each({HTMLEvents:["change"],MouseEvents:["click","mousemove","mousedown","mouseup","mouseover"],KeyboardEvents:["keydown"]},function(b,a){f.each(b,function(b){d[b]=a})});var e=/(\d+(\.\d+)?)px/,c={makeSelectable:function(b,a){void 0!==b&&void 0!==b.style&&(b.onselectstart=a?function(){return!1}:function(){},b.style.MozUserSelect=a?"auto":"none",b.style.KhtmlUserSelect=
a?"auto":"none",b.unselectable=a?"on":"off")},makeFullscreen:function(b,a,c){f.isUndefined(a)&&(a=!0);f.isUndefined(c)&&(c=!0);b.style.position="absolute";a&&(b.style.left=0,b.style.right=0);c&&(b.style.top=0,b.style.bottom=0)},fakeEvent:function(b,a,c,e){c=c||{};var r=d[a];if(!r)throw Error("Event type "+a+" not supported.");var n=document.createEvent(r);switch(r){case "MouseEvents":n.initMouseEvent(a,c.bubbles||!1,c.cancelable||!0,window,c.clickCount||1,0,0,c.x||c.clientX||0,c.y||c.clientY||0,!1,
!1,!1,!1,0,null);break;case "KeyboardEvents":r=n.initKeyboardEvent||n.initKeyEvent;f.defaults(c,{cancelable:!0,ctrlKey:!1,altKey:!1,shiftKey:!1,metaKey:!1,keyCode:void 0,charCode:void 0});r(a,c.bubbles||!1,c.cancelable,window,c.ctrlKey,c.altKey,c.shiftKey,c.metaKey,c.keyCode,c.charCode);break;default:n.initEvent(a,c.bubbles||!1,c.cancelable||!0)}f.defaults(n,e);b.dispatchEvent(n)},bind:function(a,e,d,f){a.addEventListener?a.addEventListener(e,d,f||!1):a.attachEvent&&a.attachEvent("on"+e,d);return c},
unbind:function(a,e,d,f){a.removeEventListener?a.removeEventListener(e,d,f||!1):a.detachEvent&&a.detachEvent("on"+e,d);return c},addClass:function(a,e){if(void 0===a.className)a.className=e;else if(a.className!==e){var d=a.className.split(/ +/);-1==d.indexOf(e)&&(d.push(e),a.className=d.join(" ").replace(/^\s+/,"").replace(/\s+$/,""))}return c},removeClass:function(a,e){if(e){if(void 0!==a.className)if(a.className===e)a.removeAttribute("class");else{var d=a.className.split(/ +/),f=d.indexOf(e);-1!=
f&&(d.splice(f,1),a.className=d.join(" "))}}else a.className=void 0;return c},hasClass:function(a,c){return(new RegExp("(?:^|\\s+)"+c+"(?:\\s+|$)")).test(a.className)||!1},getWidth:function(b){b=getComputedStyle(b);return a(b["border-left-width"])+a(b["border-right-width"])+a(b["padding-left"])+a(b["padding-right"])+a(b.width)},getHeight:function(b){b=getComputedStyle(b);return a(b["border-top-width"])+a(b["border-bottom-width"])+a(b["padding-top"])+a(b["padding-bottom"])+a(b.height)},getOffset:function(a){var c=
{left:0,top:0};if(a.offsetParent){do c.left+=a.offsetLeft,c.top+=a.offsetTop;while(a=a.offsetParent)}return c},isActive:function(a){return a===document.activeElement&&(a.type||a.href)}};return c}(dat.utils.common);
dat.controllers.OptionController=function(f,a,d){var e=function(c,b,f){e.superclass.call(this,c,b);var q=this;this.__select=document.createElement("select");if(d.isArray(f)){var l={};d.each(f,function(a){l[a]=a});f=l}d.each(f,function(a,b){var c=document.createElement("option");c.innerHTML=b;c.setAttribute("value",a);q.__select.appendChild(c)});this.updateDisplay();a.bind(this.__select,"change",function(){q.setValue(this.options[this.selectedIndex].value)});this.domElement.appendChild(this.__select)};
e.superclass=f;d.extend(e.prototype,f.prototype,{setValue:function(a){a=e.superclass.prototype.setValue.call(this,a);this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue());return a},updateDisplay:function(){this.__select.value=this.getValue();return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common);
dat.controllers.NumberController=function(f,a){function d(a){a=a.toString();return-1<a.indexOf(".")?a.length-a.indexOf(".")-1:0}var e=function(c,b,f){e.superclass.call(this,c,b);f=f||{};this.__min=f.min;this.__max=f.max;this.__step=f.step;a.isUndefined(this.__step)?this.__impliedStep=0==this.initialValue?1:Math.pow(10,Math.floor(Math.log(Math.abs(this.initialValue))/Math.LN10))/10:this.__impliedStep=this.__step;this.__precision=d(this.__impliedStep)};e.superclass=f;a.extend(e.prototype,f.prototype,
{setValue:function(a){void 0!==this.__min&&a<this.__min?a=this.__min:void 0!==this.__max&&a>this.__max&&(a=this.__max);void 0!==this.__step&&0!=a%this.__step&&(a=Math.round(a/this.__step)*this.__step);return e.superclass.prototype.setValue.call(this,a)},min:function(a){this.__min=a;return this},max:function(a){this.__max=a;return this},step:function(a){this.__impliedStep=this.__step=a;this.__precision=d(a);return this}});return e}(dat.controllers.Controller,dat.utils.common);
dat.controllers.NumberControllerBox=function(f,a,d){var e=function(c,b,f){function q(){var a=parseFloat(n.__input.value);d.isNaN(a)||n.setValue(a)}function l(a){var b=u-a.clientY;n.setValue(n.getValue()+b*n.__impliedStep);u=a.clientY}function r(){a.unbind(window,"mousemove",l);a.unbind(window,"mouseup",r)}this.__truncationSuspended=!1;e.superclass.call(this,c,b,f);var n=this,u;this.__input=document.createElement("input");this.__input.setAttribute("type","text");a.bind(this.__input,"change",q);a.bind(this.__input,
"blur",function(){q();n.__onFinishChange&&n.__onFinishChange.call(n,n.getValue())});a.bind(this.__input,"mousedown",function(b){a.bind(window,"mousemove",l);a.bind(window,"mouseup",r);u=b.clientY});a.bind(this.__input,"keydown",function(a){13===a.keyCode&&(n.__truncationSuspended=!0,this.blur(),n.__truncationSuspended=!1)});this.updateDisplay();this.domElement.appendChild(this.__input)};e.superclass=f;d.extend(e.prototype,f.prototype,{updateDisplay:function(){var a=this.__input,b;if(this.__truncationSuspended)b=
this.getValue();else{b=this.getValue();var d=Math.pow(10,this.__precision);b=Math.round(b*d)/d}a.value=b;return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.NumberController,dat.dom.dom,dat.utils.common);
dat.controllers.NumberControllerSlider=function(f,a,d,e,c){function b(a,b,c,e,d){return e+(a-b)/(c-b)*(d-e)}var p=function(c,e,d,f,u){function A(c){c.preventDefault();var e=a.getOffset(k.__background),d=a.getWidth(k.__background);k.setValue(b(c.clientX,e.left,e.left+d,k.__min,k.__max));return!1}function g(){a.unbind(window,"mousemove",A);a.unbind(window,"mouseup",g);k.__onFinishChange&&k.__onFinishChange.call(k,k.getValue())}p.superclass.call(this,c,e,{min:d,max:f,step:u});var k=this;this.__background=
document.createElement("div");this.__foreground=document.createElement("div");a.bind(this.__background,"mousedown",function(b){a.bind(window,"mousemove",A);a.bind(window,"mouseup",g);A(b)});a.addClass(this.__background,"slider");a.addClass(this.__foreground,"slider-fg");this.updateDisplay();this.__background.appendChild(this.__foreground);this.domElement.appendChild(this.__background)};p.superclass=f;p.useDefaultStyles=function(){d.inject(c)};e.extend(p.prototype,f.prototype,{updateDisplay:function(){var a=
(this.getValue()-this.__min)/(this.__max-this.__min);this.__foreground.style.width=100*a+"%";return p.superclass.prototype.updateDisplay.call(this)}});return p}(dat.controllers.NumberController,dat.dom.dom,dat.utils.css,dat.utils.common,"/**\n * dat-gui JavaScript Controller Library\n * https://code.google.com/p/dat-gui\n *\n * Copyright 2011 Data Arts Team, Google Creative Lab\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n */\n\n.slider {\n  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);\n  height: 1em;\n  border-radius: 1em;\n  background-color: #eee;\n  padding: 0 0.5em;\n  overflow: hidden;\n}\n\n.slider-fg {\n  padding: 1px 0 2px 0;\n  background-color: #aaa;\n  height: 1em;\n  margin-left: -0.5em;\n  padding-right: 0.5em;\n  border-radius: 1em 0 0 1em;\n}\n\n.slider-fg:after {\n  display: inline-block;\n  border-radius: 1em;\n  background-color: #fff;\n  border:  1px solid #aaa;\n  content: '';\n  float: right;\n  margin-right: -1em;\n  margin-top: -1px;\n  height: 0.9em;\n  width: 0.9em;\n}");
dat.controllers.FunctionController=function(f,a,d){var e=function(c,b,d){e.superclass.call(this,c,b);var f=this;this.__button=document.createElement("div");this.__button.innerHTML=void 0===d?"Fire":d;a.bind(this.__button,"click",function(a){a.preventDefault();f.fire();return!1});a.addClass(this.__button,"button");this.domElement.appendChild(this.__button)};e.superclass=f;d.extend(e.prototype,f.prototype,{fire:function(){this.__onChange&&this.__onChange.call(this);this.getValue().call(this.object);
this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue())}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common);
dat.controllers.BooleanController=function(f,a,d){var e=function(c,b){e.superclass.call(this,c,b);var d=this;this.__prev=this.getValue();this.__checkbox=document.createElement("input");this.__checkbox.setAttribute("type","checkbox");a.bind(this.__checkbox,"change",function(){d.setValue(!d.__prev)},!1);this.domElement.appendChild(this.__checkbox);this.updateDisplay()};e.superclass=f;d.extend(e.prototype,f.prototype,{setValue:function(a){a=e.superclass.prototype.setValue.call(this,a);this.__onFinishChange&&
this.__onFinishChange.call(this,this.getValue());this.__prev=this.getValue();return a},updateDisplay:function(){!0===this.getValue()?(this.__checkbox.setAttribute("checked","checked"),this.__checkbox.checked=!0):this.__checkbox.checked=!1;return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common);
dat.color.toString=function(f){return function(a){if(1==a.a||f.isUndefined(a.a)){for(a=a.hex.toString(16);6>a.length;)a="0"+a;return"#"+a}return"rgba("+Math.round(a.r)+","+Math.round(a.g)+","+Math.round(a.b)+","+a.a+")"}}(dat.utils.common);
dat.color.interpret=function(f,a){var d,e,c=[{litmus:a.isString,conversions:{THREE_CHAR_HEX:{read:function(a){a=a.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);return null===a?!1:{space:"HEX",hex:parseInt("0x"+a[1].toString()+a[1].toString()+a[2].toString()+a[2].toString()+a[3].toString()+a[3].toString())}},write:f},SIX_CHAR_HEX:{read:function(a){a=a.match(/^#([A-F0-9]{6})$/i);return null===a?!1:{space:"HEX",hex:parseInt("0x"+a[1].toString())}},write:f},CSS_RGB:{read:function(a){a=a.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
return null===a?!1:{space:"RGB",r:parseFloat(a[1]),g:parseFloat(a[2]),b:parseFloat(a[3])}},write:f},CSS_RGBA:{read:function(a){a=a.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\,\s*(.+)\s*\)/);return null===a?!1:{space:"RGB",r:parseFloat(a[1]),g:parseFloat(a[2]),b:parseFloat(a[3]),a:parseFloat(a[4])}},write:f}}},{litmus:a.isNumber,conversions:{HEX:{read:function(a){return{space:"HEX",hex:a,conversionName:"HEX"}},write:function(a){return a.hex}}}},{litmus:a.isArray,conversions:{RGB_ARRAY:{read:function(a){return 3!=
a.length?!1:{space:"RGB",r:a[0],g:a[1],b:a[2]}},write:function(a){return[a.r,a.g,a.b]}},RGBA_ARRAY:{read:function(a){return 4!=a.length?!1:{space:"RGB",r:a[0],g:a[1],b:a[2],a:a[3]}},write:function(a){return[a.r,a.g,a.b,a.a]}}}},{litmus:a.isObject,conversions:{RGBA_OBJ:{read:function(b){return a.isNumber(b.r)&&a.isNumber(b.g)&&a.isNumber(b.b)&&a.isNumber(b.a)?{space:"RGB",r:b.r,g:b.g,b:b.b,a:b.a}:!1},write:function(a){return{r:a.r,g:a.g,b:a.b,a:a.a}}},RGB_OBJ:{read:function(b){return a.isNumber(b.r)&&
a.isNumber(b.g)&&a.isNumber(b.b)?{space:"RGB",r:b.r,g:b.g,b:b.b}:!1},write:function(a){return{r:a.r,g:a.g,b:a.b}}},HSVA_OBJ:{read:function(b){return a.isNumber(b.h)&&a.isNumber(b.s)&&a.isNumber(b.v)&&a.isNumber(b.a)?{space:"HSV",h:b.h,s:b.s,v:b.v,a:b.a}:!1},write:function(a){return{h:a.h,s:a.s,v:a.v,a:a.a}}},HSV_OBJ:{read:function(b){return a.isNumber(b.h)&&a.isNumber(b.s)&&a.isNumber(b.v)?{space:"HSV",h:b.h,s:b.s,v:b.v}:!1},write:function(a){return{h:a.h,s:a.s,v:a.v}}}}}];return function(){e=!1;
var b=1<arguments.length?a.toArray(arguments):arguments[0];a.each(c,function(c){if(c.litmus(b))return a.each(c.conversions,function(c,f){d=c.read(b);if(!1===e&&!1!==d)return e=d,d.conversionName=f,d.conversion=c,a.BREAK}),a.BREAK});return e}}(dat.color.toString,dat.utils.common);
dat.GUI=dat.gui.GUI=function(f,a,d,e,c,b,p,q,l,r,n,u,A,g,k){function v(a,b,h,d){if(void 0===b[h])throw Error("Object "+b+' has no property "'+h+'"');d.color?b=new n(b,h):(b=[b,h].concat(d.factoryArgs),b=e.apply(a,b));d.before instanceof c&&(d.before=d.before.__li);y(a,b);g.addClass(b.domElement,"c");h=document.createElement("span");g.addClass(h,"property-name");h.innerHTML=b.property;var f=document.createElement("div");f.appendChild(h);f.appendChild(b.domElement);d=w(a,f,d.before);g.addClass(d,m.CLASS_CONTROLLER_ROW);
g.addClass(d,typeof b.getValue());t(a,d,b);a.__controllers.push(b);return b}function w(a,b,h){var c=document.createElement("li");b&&c.appendChild(b);h?a.__ul.insertBefore(c,params.before):a.__ul.appendChild(c);a.onResize();return c}function t(a,c,h){h.__li=c;h.__gui=a;k.extend(h,{options:function(b){if(1<arguments.length)return h.remove(),v(a,h.object,h.property,{before:h.__li.nextElementSibling,factoryArgs:[k.toArray(arguments)]});if(k.isArray(b)||k.isObject(b))return h.remove(),v(a,h.object,h.property,
{before:h.__li.nextElementSibling,factoryArgs:[b]})},name:function(a){h.__li.firstElementChild.firstElementChild.innerHTML=a;return h},listen:function(){h.__gui.listen(h);return h},remove:function(){h.__gui.remove(h);return h}});if(h instanceof l){var d=new q(h.object,h.property,{min:h.__min,max:h.__max,step:h.__step});k.each(["updateDisplay","onChange","onFinishChange"],function(a){var K=h[a],b=d[a];h[a]=d[a]=function(){var a=Array.prototype.slice.call(arguments);K.apply(h,a);return b.apply(d,a)}});
g.addClass(c,"has-slider");h.domElement.insertBefore(d.domElement,h.domElement.firstElementChild)}else if(h instanceof q){var e=function(b){return k.isNumber(h.__min)&&k.isNumber(h.__max)?(h.remove(),v(a,h.object,h.property,{before:h.__li.nextElementSibling,factoryArgs:[h.__min,h.__max,h.__step]})):b};h.min=k.compose(e,h.min);h.max=k.compose(e,h.max)}else h instanceof b?(g.bind(c,"click",function(){g.fakeEvent(h.__checkbox,"click")}),g.bind(h.__checkbox,"click",function(a){a.stopPropagation()})):
h instanceof p?(g.bind(c,"click",function(){g.fakeEvent(h.__button,"click")}),g.bind(c,"mouseover",function(){g.addClass(h.__button,"hover")}),g.bind(c,"mouseout",function(){g.removeClass(h.__button,"hover")})):h instanceof n&&(g.addClass(c,"color"),h.updateDisplay=k.compose(function(a){c.style.borderLeftColor=h.__color.toString();return a},h.updateDisplay),h.updateDisplay());h.setValue=k.compose(function(b){a.getRoot().__preset_select&&h.isModified()&&E(a.getRoot(),!0);return b},h.setValue)}function y(a,
b){var c=a.getRoot(),d=c.__rememberedObjects.indexOf(b.object);if(-1!=d){var e=c.__rememberedObjectIndecesToControllers[d];void 0===e&&(e={},c.__rememberedObjectIndecesToControllers[d]=e);e[b.property]=b;if(c.load&&c.load.remembered){c=c.load.remembered;if(c[a.preset])c=c[a.preset];else if(c.Default)c=c.Default;else return;c[d]&&void 0!==c[d][b.property]&&(d=c[d][b.property],b.initialValue=d,b.setValue(d))}}}function L(a){var b=a.__save_row=document.createElement("li");g.addClass(a.domElement,"has-save");
a.__ul.insertBefore(b,a.__ul.firstChild);g.addClass(b,"save-row");var c=document.createElement("span");c.innerHTML="&nbsp;";g.addClass(c,"button gears");var d=document.createElement("span");d.innerHTML="Save";g.addClass(d,"button");g.addClass(d,"save");var e=document.createElement("span");e.innerHTML="New";g.addClass(e,"button");g.addClass(e,"save-as");var f=document.createElement("span");f.innerHTML="Revert";g.addClass(f,"button");g.addClass(f,"revert");var r=a.__preset_select=document.createElement("select");
a.load&&a.load.remembered?k.each(a.load.remembered,function(b,c){F(a,c,c==a.preset)}):F(a,"Default",!1);g.bind(r,"change",function(){for(var b=0;b<a.__preset_select.length;b++)a.__preset_select[b].innerHTML=a.__preset_select[b].value;a.preset=this.value});b.appendChild(r);b.appendChild(c);b.appendChild(d);b.appendChild(e);b.appendChild(f);if(x){var n=function(){u.style.display=a.useLocalStorage?"block":"none"},b=document.getElementById("dg-save-locally"),u=document.getElementById("dg-local-explain");
b.style.display="block";b=document.getElementById("dg-local-storage");"true"===localStorage.getItem(document.location.href+".isLocal")&&b.setAttribute("checked","checked");n();g.bind(b,"change",function(){a.useLocalStorage=!a.useLocalStorage;n()})}var m=document.getElementById("dg-new-constructor");g.bind(m,"keydown",function(a){!a.metaKey||67!==a.which&&67!=a.keyCode||B.hide()});g.bind(c,"click",function(){m.innerHTML=JSON.stringify(a.getSaveObject(),void 0,2);B.show();m.focus();m.select()});g.bind(d,
"click",function(){a.save()});g.bind(e,"click",function(){var b=prompt("Enter a new preset name.");b&&a.saveAs(b)});g.bind(f,"click",function(){a.revert()})}function M(a){function b(f){f.preventDefault();e=f.clientX;g.addClass(a.__closeButton,m.CLASS_DRAG);g.bind(window,"mousemove",c);g.bind(window,"mouseup",d);return!1}function c(b){b.preventDefault();a.width+=e-b.clientX;a.onResize();e=b.clientX;return!1}function d(){g.removeClass(a.__closeButton,m.CLASS_DRAG);g.unbind(window,"mousemove",c);g.unbind(window,
"mouseup",d)}a.__resize_handle=document.createElement("div");k.extend(a.__resize_handle.style,{width:"6px",marginLeft:"-3px",height:"200px",cursor:"ew-resize",position:"absolute"});var e;g.bind(a.__resize_handle,"mousedown",b);g.bind(a.__closeButton,"mousedown",b);a.domElement.insertBefore(a.__resize_handle,a.domElement.firstElementChild)}function G(a,b){a.domElement.style.width=b+"px";a.__save_row&&a.autoPlace&&(a.__save_row.style.width=b+"px");a.__closeButton&&(a.__closeButton.style.width=b+"px")}
function C(a,b){var c={};k.each(a.__rememberedObjects,function(d,e){var f={};k.each(a.__rememberedObjectIndecesToControllers[e],function(a,c){f[c]=b?a.initialValue:a.getValue()});c[e]=f});return c}function F(a,b,c){var d=document.createElement("option");d.innerHTML=b;d.value=b;a.__preset_select.appendChild(d);c&&(a.__preset_select.selectedIndex=a.__preset_select.length-1)}function E(a,b){var c=a.__preset_select[a.__preset_select.selectedIndex];c.innerHTML=b?c.value+"*":c.value}function H(a){0!=a.length&&
u(function(){H(a)});k.each(a,function(a){a.updateDisplay()})}f.inject(d);var x;try{x="localStorage"in window&&null!==window.localStorage}catch(N){x=!1}var B,I=!0,z,D=!1,J=[],m=function(a){function b(){var a=c.getRoot();a.width+=1;k.defer(function(){--a.width})}var c=this;this.domElement=document.createElement("div");this.__ul=document.createElement("ul");this.domElement.appendChild(this.__ul);g.addClass(this.domElement,"dg");this.__folders={};this.__controllers=[];this.__rememberedObjects=[];this.__rememberedObjectIndecesToControllers=
[];this.__listening=[];a=a||{};a=k.defaults(a,{autoPlace:!0,width:m.DEFAULT_WIDTH});a=k.defaults(a,{resizable:a.autoPlace,hideable:a.autoPlace});k.isUndefined(a.load)?a.load={preset:"Default"}:a.preset&&(a.load.preset=a.preset);k.isUndefined(a.parent)&&a.hideable&&J.push(this);a.resizable=k.isUndefined(a.parent)&&a.resizable;a.autoPlace&&k.isUndefined(a.scrollable)&&(a.scrollable=!0);var d=x&&"true"===localStorage.getItem(document.location.href+".isLocal"),e;Object.defineProperties(this,{parent:{get:function(){return a.parent}},
scrollable:{get:function(){return a.scrollable}},autoPlace:{get:function(){return a.autoPlace}},preset:{get:function(){return c.parent?c.getRoot().preset:a.load.preset},set:function(b){c.parent?c.getRoot().preset=b:a.load.preset=b;for(b=0;b<this.__preset_select.length;b++)this.__preset_select[b].value==this.preset&&(this.__preset_select.selectedIndex=b);c.revert()}},width:{get:function(){return a.width},set:function(b){a.width=b;G(c,b)}},name:{get:function(){return a.name},set:function(b){a.name=
b;r&&(r.innerHTML=a.name)}},closed:{get:function(){return a.closed},set:function(b){a.closed=b;a.closed?g.addClass(c.__ul,m.CLASS_CLOSED):g.removeClass(c.__ul,m.CLASS_CLOSED);this.onResize();c.__closeButton&&(c.__closeButton.innerHTML=b?m.TEXT_OPEN:m.TEXT_CLOSED)}},load:{get:function(){return a.load}},useLocalStorage:{get:function(){return d},set:function(a){x&&((d=a)?g.bind(window,"unload",e):g.unbind(window,"unload",e),localStorage.setItem(document.location.href+".isLocal",a))}}});if(k.isUndefined(a.parent)){a.closed=
!1;g.addClass(this.domElement,m.CLASS_MAIN);g.makeSelectable(this.domElement,!1);if(x&&d){c.useLocalStorage=!0;var f=localStorage.getItem(document.location.href+".gui");f&&(a.load=JSON.parse(f))}this.__closeButton=document.createElement("div");this.__closeButton.innerHTML=m.TEXT_CLOSED;g.addClass(this.__closeButton,m.CLASS_CLOSE_BUTTON);this.domElement.appendChild(this.__closeButton);g.bind(this.__closeButton,"click",function(){c.closed=!c.closed})}else{void 0===a.closed&&(a.closed=!0);var r=document.createTextNode(a.name);
g.addClass(r,"controller-name");f=w(c,r);g.addClass(this.__ul,m.CLASS_CLOSED);g.addClass(f,"title");g.bind(f,"click",function(a){a.preventDefault();c.closed=!c.closed;return!1});a.closed||(this.closed=!1)}a.autoPlace&&(k.isUndefined(a.parent)&&(I&&(z=document.createElement("div"),g.addClass(z,"dg"),g.addClass(z,m.CLASS_AUTO_PLACE_CONTAINER),document.body.appendChild(z),I=!1),z.appendChild(this.domElement),g.addClass(this.domElement,m.CLASS_AUTO_PLACE)),this.parent||G(c,a.width));g.bind(window,"resize",
function(){c.onResize()});g.bind(this.__ul,"webkitTransitionEnd",function(){c.onResize()});g.bind(this.__ul,"transitionend",function(){c.onResize()});g.bind(this.__ul,"oTransitionEnd",function(){c.onResize()});this.onResize();a.resizable&&M(this);this.saveToLocalStorageIfPossible=e=function(){x&&"true"===localStorage.getItem(document.location.href+".isLocal")&&localStorage.setItem(document.location.href+".gui",JSON.stringify(c.getSaveObject()))};c.getRoot();a.parent||b()};m.toggleHide=function(){D=
!D;k.each(J,function(a){a.domElement.style.zIndex=D?-999:999;a.domElement.style.opacity=D?0:1})};m.CLASS_AUTO_PLACE="a";m.CLASS_AUTO_PLACE_CONTAINER="ac";m.CLASS_MAIN="main";m.CLASS_CONTROLLER_ROW="cr";m.CLASS_TOO_TALL="taller-than-window";m.CLASS_CLOSED="closed";m.CLASS_CLOSE_BUTTON="close-button";m.CLASS_DRAG="drag";m.DEFAULT_WIDTH=245;m.TEXT_CLOSED="Close Controls";m.TEXT_OPEN="Open Controls";g.bind(window,"keydown",function(a){"text"===document.activeElement.type||72!==a.which&&72!=a.keyCode||
m.toggleHide()},!1);k.extend(m.prototype,{add:function(a,b){return v(this,a,b,{factoryArgs:Array.prototype.slice.call(arguments,2)})},addColor:function(a,b){return v(this,a,b,{color:!0})},remove:function(a){this.__ul.removeChild(a.__li);this.__controllers.splice(this.__controllers.indexOf(a),1);var b=this;k.defer(function(){b.onResize()})},destroy:function(){this.autoPlace&&z.removeChild(this.domElement)},addFolder:function(a){if(void 0!==this.__folders[a])throw Error('You already have a folder in this GUI by the name "'+
a+'"');var b={name:a,parent:this};b.autoPlace=this.autoPlace;this.load&&this.load.folders&&this.load.folders[a]&&(b.closed=this.load.folders[a].closed,b.load=this.load.folders[a]);b=new m(b);this.__folders[a]=b;a=w(this,b.domElement);g.addClass(a,"folder");return b},open:function(){this.closed=!1},close:function(){this.closed=!0},onResize:function(){var a=this.getRoot();if(a.scrollable){var b=g.getOffset(a.__ul).top,c=0;k.each(a.__ul.childNodes,function(b){a.autoPlace&&b===a.__save_row||(c+=g.getHeight(b))});
window.innerHeight-b-20<c?(g.addClass(a.domElement,m.CLASS_TOO_TALL),a.__ul.style.height=window.innerHeight-b-20+"px"):(g.removeClass(a.domElement,m.CLASS_TOO_TALL),a.__ul.style.height="auto")}a.__resize_handle&&k.defer(function(){a.__resize_handle.style.height=a.__ul.offsetHeight+"px"});a.__closeButton&&(a.__closeButton.style.width=a.width+"px")},remember:function(){k.isUndefined(B)&&(B=new A,B.domElement.innerHTML=a);if(this.parent)throw Error("You can only call remember on a top level GUI.");var b=
this;k.each(Array.prototype.slice.call(arguments),function(a){0==b.__rememberedObjects.length&&L(b);-1==b.__rememberedObjects.indexOf(a)&&b.__rememberedObjects.push(a)});this.autoPlace&&G(this,this.width)},getRoot:function(){for(var a=this;a.parent;)a=a.parent;return a},getSaveObject:function(){var a=this.load;a.closed=this.closed;0<this.__rememberedObjects.length&&(a.preset=this.preset,a.remembered||(a.remembered={}),a.remembered[this.preset]=C(this));a.folders={};k.each(this.__folders,function(b,
c){a.folders[c]=b.getSaveObject()});return a},save:function(){this.load.remembered||(this.load.remembered={});this.load.remembered[this.preset]=C(this);E(this,!1);this.saveToLocalStorageIfPossible()},saveAs:function(a){this.load.remembered||(this.load.remembered={},this.load.remembered.Default=C(this,!0));this.load.remembered[a]=C(this);this.preset=a;F(this,a,!0);this.saveToLocalStorageIfPossible()},revert:function(a){k.each(this.__controllers,function(b){this.getRoot().load.remembered?y(a||this.getRoot(),
b):b.setValue(b.initialValue)},this);k.each(this.__folders,function(a){a.revert(a)});a||E(this.getRoot(),!1)},listen:function(a){var b=0==this.__listening.length;this.__listening.push(a);b&&H(this.__listening)}});return m}(dat.utils.css,'<div id="dg-save" class="dg dialogue">\n\n  Here\'s the new load parameter for your <code>GUI</code>\'s constructor:\n\n  <textarea id="dg-new-constructor"></textarea>\n\n  <div id="dg-save-locally">\n\n    <input id="dg-local-storage" type="checkbox"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id="dg-local-explain">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>\'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n      \n    </div>\n    \n  </div>\n\n</div>',
".dg {\n  /** Clear list styles */\n  /* Auto-place container */\n  /* Auto-placed GUI's */\n  /* Line items that don't contain folders. */\n  /** Folder names */\n  /** Hides closed items */\n  /** Controller row */\n  /** Name-half (left) */\n  /** Controller-half (right) */\n  /** Controller placement */\n  /** Shorter number boxes when slider is present. */\n  /** Ensure the entire boolean and function row shows a hand */ }\n  .dg ul {\n    list-style: none;\n    margin: 0;\n    padding: 0;\n    width: 100%;\n    clear: both; }\n  .dg.ac {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    height: 0;\n    z-index: 0; }\n  .dg:not(.ac) .main {\n    /** Exclude mains in ac so that we don't hide close button */\n    overflow: hidden; }\n  .dg.main {\n    -webkit-transition: opacity 0.1s linear;\n    -o-transition: opacity 0.1s linear;\n    -moz-transition: opacity 0.1s linear;\n    transition: opacity 0.1s linear; }\n    .dg.main.taller-than-window {\n      overflow-y: auto; }\n      .dg.main.taller-than-window .close-button {\n        opacity: 1;\n        /* TODO, these are style notes */\n        margin-top: -1px;\n        border-top: 1px solid #2c2c2c; }\n    .dg.main ul.closed .close-button {\n      opacity: 1 !important; }\n    .dg.main:hover .close-button,\n    .dg.main .close-button.drag {\n      opacity: 1; }\n    .dg.main .close-button {\n      /*opacity: 0;*/\n      -webkit-transition: opacity 0.1s linear;\n      -o-transition: opacity 0.1s linear;\n      -moz-transition: opacity 0.1s linear;\n      transition: opacity 0.1s linear;\n      border: 0;\n      position: absolute;\n      line-height: 19px;\n      height: 20px;\n      /* TODO, these are style notes */\n      cursor: pointer;\n      text-align: center;\n      background-color: #000; }\n      .dg.main .close-button:hover {\n        background-color: #111; }\n  .dg.a {\n    float: right;\n    margin-right: 15px;\n    overflow-x: hidden; }\n    .dg.a.has-save > ul {\n      margin-top: 27px; }\n      .dg.a.has-save > ul.closed {\n        margin-top: 0; }\n    .dg.a .save-row {\n      position: fixed;\n      top: 0;\n      z-index: 1002; }\n  .dg li {\n    -webkit-transition: height 0.1s ease-out;\n    -o-transition: height 0.1s ease-out;\n    -moz-transition: height 0.1s ease-out;\n    transition: height 0.1s ease-out; }\n  .dg li:not(.folder) {\n    cursor: auto;\n    height: 27px;\n    line-height: 27px;\n    overflow: hidden;\n    padding: 0 4px 0 5px; }\n  .dg li.folder {\n    padding: 0;\n    border-left: 4px solid rgba(0, 0, 0, 0); }\n  .dg li.title {\n    cursor: pointer;\n    margin-left: -4px; }\n  .dg .closed li:not(.title),\n  .dg .closed ul li,\n  .dg .closed ul li > * {\n    height: 0;\n    overflow: hidden;\n    border: 0; }\n  .dg .cr {\n    clear: both;\n    padding-left: 3px;\n    height: 27px; }\n  .dg .property-name {\n    cursor: default;\n    float: left;\n    clear: left;\n    width: 40%;\n    overflow: hidden;\n    text-overflow: ellipsis; }\n  .dg .c {\n    float: left;\n    width: 60%; }\n  .dg .c input[type=text] {\n    border: 0;\n    margin-top: 4px;\n    padding: 3px;\n    width: 100%;\n    float: right; }\n  .dg .has-slider input[type=text] {\n    width: 30%;\n    /*display: none;*/\n    margin-left: 0; }\n  .dg .slider {\n    float: left;\n    width: 66%;\n    margin-left: -5px;\n    margin-right: 0;\n    height: 19px;\n    margin-top: 4px; }\n  .dg .slider-fg {\n    height: 100%; }\n  .dg .c input[type=checkbox] {\n    margin-top: 9px; }\n  .dg .c select {\n    margin-top: 5px; }\n  .dg .cr.function,\n  .dg .cr.function .property-name,\n  .dg .cr.function *,\n  .dg .cr.boolean,\n  .dg .cr.boolean * {\n    cursor: pointer; }\n  .dg .selector {\n    display: none;\n    position: absolute;\n    margin-left: -9px;\n    margin-top: 23px;\n    z-index: 10; }\n  .dg .c:hover .selector,\n  .dg .selector.drag {\n    display: block; }\n  .dg li.save-row {\n    padding: 0; }\n    .dg li.save-row .button {\n      display: inline-block;\n      padding: 0px 6px; }\n  .dg.dialogue {\n    background-color: #222;\n    width: 460px;\n    padding: 15px;\n    font-size: 13px;\n    line-height: 15px; }\n\n/* TODO Separate style and structure */\n#dg-new-constructor {\n  padding: 10px;\n  color: #222;\n  font-family: Monaco, monospace;\n  font-size: 10px;\n  border: 0;\n  resize: none;\n  box-shadow: inset 1px 1px 1px #888;\n  word-wrap: break-word;\n  margin: 12px 0;\n  display: block;\n  width: 440px;\n  overflow-y: scroll;\n  height: 100px;\n  position: relative; }\n\n#dg-local-explain {\n  display: none;\n  font-size: 11px;\n  line-height: 17px;\n  border-radius: 3px;\n  background-color: #333;\n  padding: 8px;\n  margin-top: 10px; }\n  #dg-local-explain code {\n    font-size: 10px; }\n\n#dat-gui-save-locally {\n  display: none; }\n\n/** Main type */\n.dg {\n  color: #eee;\n  font: 11px 'Lucida Grande', sans-serif;\n  text-shadow: 0 -1px 0 #111;\n  /** Auto place */\n  /* Controller row, <li> */\n  /** Controllers */ }\n  .dg.main {\n    /** Scrollbar */ }\n    .dg.main::-webkit-scrollbar {\n      width: 5px;\n      background: #1a1a1a; }\n    .dg.main::-webkit-scrollbar-corner {\n      height: 0;\n      display: none; }\n    .dg.main::-webkit-scrollbar-thumb {\n      border-radius: 5px;\n      background: #676767; }\n  .dg li:not(.folder) {\n    background: #1a1a1a;\n    border-bottom: 1px solid #2c2c2c; }\n  .dg li.save-row {\n    line-height: 25px;\n    background: #dad5cb;\n    border: 0; }\n    .dg li.save-row select {\n      margin-left: 5px;\n      width: 108px; }\n    .dg li.save-row .button {\n      margin-left: 5px;\n      margin-top: 1px;\n      border-radius: 2px;\n      font-size: 9px;\n      line-height: 7px;\n      padding: 4px 4px 5px 4px;\n      background: #c5bdad;\n      color: #fff;\n      text-shadow: 0 1px 0 #b0a58f;\n      box-shadow: 0 -1px 0 #b0a58f;\n      cursor: pointer; }\n      .dg li.save-row .button.gears {\n        background: #c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;\n        height: 7px;\n        width: 8px; }\n      .dg li.save-row .button:hover {\n        background-color: #bab19e;\n        box-shadow: 0 -1px 0 #b0a58f; }\n  .dg li.folder {\n    border-bottom: 0; }\n  .dg li.title {\n    padding-left: 16px;\n    background: black url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;\n    cursor: pointer;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.2); }\n  .dg .closed li.title {\n    background-image: url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==); }\n  .dg .cr.boolean {\n    border-left: 3px solid #806787; }\n  .dg .cr.function {\n    border-left: 3px solid #e61d5f; }\n  .dg .cr.number {\n    border-left: 3px solid #2fa1d6; }\n    .dg .cr.number input[type=text] {\n      color: #2fa1d6; }\n  .dg .cr.string {\n    border-left: 3px solid #1ed36f; }\n    .dg .cr.string input[type=text] {\n      color: #1ed36f; }\n  .dg .cr.function:hover, .dg .cr.boolean:hover {\n    background: #111; }\n  .dg .c input[type=text] {\n    background: #303030;\n    outline: none; }\n    .dg .c input[type=text]:hover {\n      background: #3c3c3c; }\n    .dg .c input[type=text]:focus {\n      background: #494949;\n      color: #fff; }\n  .dg .c .slider {\n    background: #303030;\n    cursor: ew-resize; }\n  .dg .c .slider-fg {\n    background: #2fa1d6; }\n  .dg .c .slider:hover {\n    background: #3c3c3c; }\n    .dg .c .slider:hover .slider-fg {\n      background: #44abda; }\n",
dat.controllers.factory=function(f,a,d,e,c,b,p){return function(q,l,r,n){var u=q[l];if(p.isArray(r)||p.isObject(r))return new f(q,l,r);if(p.isNumber(u))return p.isNumber(r)&&p.isNumber(n)?new d(q,l,r,n):new a(q,l,{min:r,max:n});if(p.isString(u))return new e(q,l);if(p.isFunction(u))return new c(q,l,"");if(p.isBoolean(u))return new b(q,l)}}(dat.controllers.OptionController,dat.controllers.NumberControllerBox,dat.controllers.NumberControllerSlider,dat.controllers.StringController=function(f,a,d){var e=
function(c,b){function d(){f.setValue(f.__input.value)}e.superclass.call(this,c,b);var f=this;this.__input=document.createElement("input");this.__input.setAttribute("type","text");a.bind(this.__input,"keyup",d);a.bind(this.__input,"change",d);a.bind(this.__input,"blur",function(){f.__onFinishChange&&f.__onFinishChange.call(f,f.getValue())});a.bind(this.__input,"keydown",function(a){13===a.keyCode&&this.blur()});this.updateDisplay();this.domElement.appendChild(this.__input)};e.superclass=f;d.extend(e.prototype,
f.prototype,{updateDisplay:function(){a.isActive(this.__input)||(this.__input.value=this.getValue());return e.superclass.prototype.updateDisplay.call(this)}});return e}(dat.controllers.Controller,dat.dom.dom,dat.utils.common),dat.controllers.FunctionController,dat.controllers.BooleanController,dat.utils.common),dat.controllers.Controller,dat.controllers.BooleanController,dat.controllers.FunctionController,dat.controllers.NumberControllerBox,dat.controllers.NumberControllerSlider,dat.controllers.OptionController,
dat.controllers.ColorController=function(f,a,d,e,c){function b(a,b,d,e){a.style.background="";c.each(l,function(c){a.style.cssText+="background: "+c+"linear-gradient("+b+", "+d+" 0%, "+e+" 100%); "})}function p(a){a.style.background="";a.style.cssText+="background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);";a.style.cssText+="background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";
a.style.cssText+="background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";a.style.cssText+="background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";a.style.cssText+="background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);"}var q=function(f,n){function u(b){v(b);a.bind(window,"mousemove",v);a.bind(window,
"mouseup",l)}function l(){a.unbind(window,"mousemove",v);a.unbind(window,"mouseup",l)}function g(){var a=e(this.value);!1!==a?(t.__color.__state=a,t.setValue(t.__color.toOriginal())):this.value=t.__color.toString()}function k(){a.unbind(window,"mousemove",w);a.unbind(window,"mouseup",k)}function v(b){b.preventDefault();var c=a.getWidth(t.__saturation_field),d=a.getOffset(t.__saturation_field),e=(b.clientX-d.left+document.body.scrollLeft)/c;b=1-(b.clientY-d.top+document.body.scrollTop)/c;1<b?b=1:0>
b&&(b=0);1<e?e=1:0>e&&(e=0);t.__color.v=b;t.__color.s=e;t.setValue(t.__color.toOriginal());return!1}function w(b){b.preventDefault();var c=a.getHeight(t.__hue_field),d=a.getOffset(t.__hue_field);b=1-(b.clientY-d.top+document.body.scrollTop)/c;1<b?b=1:0>b&&(b=0);t.__color.h=360*b;t.setValue(t.__color.toOriginal());return!1}q.superclass.call(this,f,n);this.__color=new d(this.getValue());this.__temp=new d(0);var t=this;this.domElement=document.createElement("div");a.makeSelectable(this.domElement,!1);
this.__selector=document.createElement("div");this.__selector.className="selector";this.__saturation_field=document.createElement("div");this.__saturation_field.className="saturation-field";this.__field_knob=document.createElement("div");this.__field_knob.className="field-knob";this.__field_knob_border="2px solid ";this.__hue_knob=document.createElement("div");this.__hue_knob.className="hue-knob";this.__hue_field=document.createElement("div");this.__hue_field.className="hue-field";this.__input=document.createElement("input");
this.__input.type="text";this.__input_textShadow="0 1px 1px ";a.bind(this.__input,"keydown",function(a){13===a.keyCode&&g.call(this)});a.bind(this.__input,"blur",g);a.bind(this.__selector,"mousedown",function(b){a.addClass(this,"drag").bind(window,"mouseup",function(b){a.removeClass(t.__selector,"drag")})});var y=document.createElement("div");c.extend(this.__selector.style,{width:"122px",height:"102px",padding:"3px",backgroundColor:"#222",boxShadow:"0px 1px 3px rgba(0,0,0,0.3)"});c.extend(this.__field_knob.style,
{position:"absolute",width:"12px",height:"12px",border:this.__field_knob_border+(.5>this.__color.v?"#fff":"#000"),boxShadow:"0px 1px 3px rgba(0,0,0,0.5)",borderRadius:"12px",zIndex:1});c.extend(this.__hue_knob.style,{position:"absolute",width:"15px",height:"2px",borderRight:"4px solid #fff",zIndex:1});c.extend(this.__saturation_field.style,{width:"100px",height:"100px",border:"1px solid #555",marginRight:"3px",display:"inline-block",cursor:"pointer"});c.extend(y.style,{width:"100%",height:"100%",
background:"none"});b(y,"top","rgba(0,0,0,0)","#000");c.extend(this.__hue_field.style,{width:"15px",height:"100px",display:"inline-block",border:"1px solid #555",cursor:"ns-resize"});p(this.__hue_field);c.extend(this.__input.style,{outline:"none",textAlign:"center",color:"#fff",border:0,fontWeight:"bold",textShadow:this.__input_textShadow+"rgba(0,0,0,0.7)"});a.bind(this.__saturation_field,"mousedown",u);a.bind(this.__field_knob,"mousedown",u);a.bind(this.__hue_field,"mousedown",function(b){w(b);a.bind(window,
"mousemove",w);a.bind(window,"mouseup",k)});this.__saturation_field.appendChild(y);this.__selector.appendChild(this.__field_knob);this.__selector.appendChild(this.__saturation_field);this.__selector.appendChild(this.__hue_field);this.__hue_field.appendChild(this.__hue_knob);this.domElement.appendChild(this.__input);this.domElement.appendChild(this.__selector);this.updateDisplay()};q.superclass=f;c.extend(q.prototype,f.prototype,{updateDisplay:function(){var a=e(this.getValue());if(!1!==a){var f=!1;
c.each(d.COMPONENTS,function(b){if(!c.isUndefined(a[b])&&!c.isUndefined(this.__color.__state[b])&&a[b]!==this.__color.__state[b])return f=!0,{}},this);f&&c.extend(this.__color.__state,a)}c.extend(this.__temp.__state,this.__color.__state);this.__temp.a=1;var l=.5>this.__color.v||.5<this.__color.s?255:0,p=255-l;c.extend(this.__field_knob.style,{marginLeft:100*this.__color.s-7+"px",marginTop:100*(1-this.__color.v)-7+"px",backgroundColor:this.__temp.toString(),border:this.__field_knob_border+"rgb("+l+
","+l+","+l+")"});this.__hue_knob.style.marginTop=100*(1-this.__color.h/360)+"px";this.__temp.s=1;this.__temp.v=1;b(this.__saturation_field,"left","#fff",this.__temp.toString());c.extend(this.__input.style,{backgroundColor:this.__input.value=this.__color.toString(),color:"rgb("+l+","+l+","+l+")",textShadow:this.__input_textShadow+"rgba("+p+","+p+","+p+",.7)"})}});var l=["-moz-","-o-","-webkit-","-ms-",""];return q}(dat.controllers.Controller,dat.dom.dom,dat.color.Color=function(f,a,d,e){function c(a,
b,c){Object.defineProperty(a,b,{get:function(){if("RGB"===this.__state.space)return this.__state[b];p(this,b,c);return this.__state[b]},set:function(a){"RGB"!==this.__state.space&&(p(this,b,c),this.__state.space="RGB");this.__state[b]=a}})}function b(a,b){Object.defineProperty(a,b,{get:function(){if("HSV"===this.__state.space)return this.__state[b];q(this);return this.__state[b]},set:function(a){"HSV"!==this.__state.space&&(q(this),this.__state.space="HSV");this.__state[b]=a}})}function p(b,c,d){if("HEX"===
b.__state.space)b.__state[c]=a.component_from_hex(b.__state.hex,d);else if("HSV"===b.__state.space)e.extend(b.__state,a.hsv_to_rgb(b.__state.h,b.__state.s,b.__state.v));else throw"Corrupted color state";}function q(b){var c=a.rgb_to_hsv(b.r,b.g,b.b);e.extend(b.__state,{s:c.s,v:c.v});e.isNaN(c.h)?e.isUndefined(b.__state.h)&&(b.__state.h=0):b.__state.h=c.h}var l=function(){this.__state=f.apply(this,arguments);if(!1===this.__state)throw"Failed to interpret color arguments";this.__state.a=this.__state.a||
1};l.COMPONENTS="r g b h s v hex a".split(" ");e.extend(l.prototype,{toString:function(){return d(this)},toOriginal:function(){return this.__state.conversion.write(this)}});c(l.prototype,"r",2);c(l.prototype,"g",1);c(l.prototype,"b",0);b(l.prototype,"h");b(l.prototype,"s");b(l.prototype,"v");Object.defineProperty(l.prototype,"a",{get:function(){return this.__state.a},set:function(a){this.__state.a=a}});Object.defineProperty(l.prototype,"hex",{get:function(){"HEX"!==!this.__state.space&&(this.__state.hex=
a.rgb_to_hex(this.r,this.g,this.b));return this.__state.hex},set:function(a){this.__state.space="HEX";this.__state.hex=a}});return l}(dat.color.interpret,dat.color.math=function(){var f;return{hsv_to_rgb:function(a,d,e){var c=a/60-Math.floor(a/60),b=e*(1-d),f=e*(1-c*d);d=e*(1-(1-c)*d);a=[[e,d,b],[f,e,b],[b,e,d],[b,f,e],[d,b,e],[e,b,f]][Math.floor(a/60)%6];return{r:255*a[0],g:255*a[1],b:255*a[2]}},rgb_to_hsv:function(a,d,e){var c=Math.min(a,d,e),b=Math.max(a,d,e),c=b-c;if(0==b)return{h:NaN,s:0,v:0};
a=(a==b?(d-e)/c:d==b?2+(e-a)/c:4+(a-d)/c)/6;0>a&&(a+=1);return{h:360*a,s:c/b,v:b/255}},rgb_to_hex:function(a,d,e){a=this.hex_with_component(0,2,a);a=this.hex_with_component(a,1,d);return a=this.hex_with_component(a,0,e)},component_from_hex:function(a,d){return a>>8*d&255},hex_with_component:function(a,d,e){return e<<(f=8*d)|a&~(255<<f)}}}(),dat.color.toString,dat.utils.common),dat.color.interpret,dat.utils.common),dat.utils.requestAnimationFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||
window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(f,a){window.setTimeout(f,1E3/60)}}(),dat.dom.CenteredDiv=function(f,a){var d=function(){this.backgroundElement=document.createElement("div");a.extend(this.backgroundElement.style,{backgroundColor:"rgba(0,0,0,0.8)",top:0,left:0,display:"none",zIndex:"1000",opacity:0,WebkitTransition:"opacity 0.2s linear",transition:"opacity 0.2s linear"});f.makeFullscreen(this.backgroundElement);this.backgroundElement.style.position=
"fixed";this.domElement=document.createElement("div");a.extend(this.domElement.style,{position:"fixed",display:"none",zIndex:"1001",opacity:0,WebkitTransition:"-webkit-transform 0.2s ease-out, opacity 0.2s linear",transition:"transform 0.2s ease-out, opacity 0.2s linear"});document.body.appendChild(this.backgroundElement);document.body.appendChild(this.domElement);var d=this;f.bind(this.backgroundElement,"click",function(){d.hide()})};d.prototype.show=function(){var d=this;this.backgroundElement.style.display=
"block";this.domElement.style.display="block";this.domElement.style.opacity=0;this.domElement.style.webkitTransform="scale(1.1)";this.layout();a.defer(function(){d.backgroundElement.style.opacity=1;d.domElement.style.opacity=1;d.domElement.style.webkitTransform="scale(1)"})};d.prototype.hide=function(){var a=this,c=function(){a.domElement.style.display="none";a.backgroundElement.style.display="none";f.unbind(a.domElement,"webkitTransitionEnd",c);f.unbind(a.domElement,"transitionend",c);f.unbind(a.domElement,
"oTransitionEnd",c)};f.bind(this.domElement,"webkitTransitionEnd",c);f.bind(this.domElement,"transitionend",c);f.bind(this.domElement,"oTransitionEnd",c);this.backgroundElement.style.opacity=0;this.domElement.style.opacity=0;this.domElement.style.webkitTransform="scale(1.1)"};d.prototype.layout=function(){this.domElement.style.left=window.innerWidth/2-f.getWidth(this.domElement)/2+"px";this.domElement.style.top=window.innerHeight/2-f.getHeight(this.domElement)/2+"px"};return d}(dat.dom.dom,dat.utils.common),
dat.dom.dom,dat.utils.common);


/**
 * requestAnimationFrame
 */
window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


// Configs

var Configs = {
    backgroundColor: '#eee9e9',
    particleNum: 1000,
    step: 5,
    base: 1000,
    zInc: 0.001
};


// Vars

var canvas,
    context,
    screenWidth,
    screenHeight,
    centerX,
    centerY,
    particles = [],
    hueBase = 0,
    simplexNoise,
    zoff = 0,
    gui;


// Initialize

function init() {
    canvas = document.getElementById('c');

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize(null);

    for (var i = 0, len = Configs.particleNum; i < len; i++) {
        initParticle((particles[i] = new Particle()));
    }

    simplexNoise = new SimplexNoise();

    canvas.addEventListener('click', onCanvasClick, false);

    gui = new dat.GUI();
    gui.add(Configs, 'step', 1, 10);
    gui.add(Configs, 'base', 500, 3000);
    gui.add(Configs, 'zInc', 0.0001, 0.01);
    gui.close();

    update();
}


// Event listeners

function onWindowResize(e) {
    screenWidth  = canvas.width  = window.innerWidth;
    screenHeight = canvas.height = window.innerHeight;

    centerX = screenWidth / 2;
    centerY = screenHeight / 2;

    context = canvas.getContext('2d');
    context.lineWidth = 0.3;
    context.lineCap = context.lineJoin = 'round';
}

function onCanvasClick(e) {
    context.save();
    context.globalAlpha = 0.8;
    context.fillStyle = Configs.backgroundColor;
    context.fillRect(0, 0, screenWidth, screenHeight);
    context.restore();
    
    simplexNoise = new SimplexNoise();
}


// Functions

function getNoise(x, y, z) {
    var octaves = 4,
        fallout = 0.5,
        amp = 1, f = 1, sum = 0,
        i;

    for (i = 0; i < octaves; ++i) {
        amp *= fallout;
        sum += amp * (simplexNoise.noise3D(x * f, y * f, z * f) + 1) * 0.5;
        f *= 2;
    }

    return sum;
}

function initParticle(p) {
    p.x = p.pastX = screenWidth * Math.random();
    p.y = p.pastY = screenHeight * Math.random();
    p.color.h = hueBase + Math.atan2(centerY - p.y, centerX - p.x) * 180 / Math.PI;
    p.color.s = 1;
    p.color.l = 0.5;
    p.color.a = 0;
}


// Update

function update() {
    var step = Configs.step,
        base = Configs.base,
        i, p, angle;
    
    for (i = 0, len = particles.length; i < len; i++) {
        p = particles[i];

        p.pastX = p.x;
        p.pastY = p.y;
    
        angle = Math.PI * 6 * getNoise(p.x / base * 1.75, p.y / base * 1.75, zoff);
        p.x += Math.cos(angle) * step;
        p.y += Math.sin(angle) * step;
        
        if (p.color.a < 1) p.color.a += 0.003;

        context.beginPath();
        context.strokeStyle = p.color.toString();
        context.moveTo(p.pastX, p.pastY);
        context.lineTo(p.x, p.y);
        context.stroke();
        
        if (p.x < 0 || p.x > screenWidth || p.y < 0 || p.y > screenHeight) {
            initParticle(p);
        }
    }
    
    hueBase += 0.1;
    zoff += Configs.zInc;

    requestAnimationFrame(update);
}


/**
 * HSLA
 */
function HSLA(h, s, l, a) {
    this.h = h || 0;
    this.s = s || 0;
    this.l = l || 0;
    this.a = a || 0;
}

HSLA.prototype.toString = function() {
    return 'hsla(' + this.h + ',' + (this.s * 100) + '%,' + (this.l * 100) + '%,' + this.a + ')';
}

/**
 * Particle
 */
function Particle(x, y, color) {
    this.x = x || 0;
    this.y = y || 0;
    this.color = color || new HSLA();
    this.pastX = this.x;
    this.pastY = this.y;
}


// Run

init();