/*jslint browser, devel, this, for */
/*global window, SVG */
(function () {
    "use strict";
    var RippleRingRhythm = {};

    // BaseRing Module
    RippleRingRhythm.BaseRing = function (svg, args) {
        var defaultArgs = {
            x: 0,
            y: 0,
            initRadius: 1,
            radius: 20,
            strokeColor: '#000',
            strokeWidth: '2',
            fillColor: 'transparent'
        };
        args = this.extend(defaultArgs, args);

        this.element = svg.circle(args.initRadius);
        this.element.stroke({color: args.strokeColor, width: args.strokeWidth})
                .fill({color: args.fillColor})
                .move(args.x, args.y);
        this.element.animate()
                .radius(args.radius);
    };

    RippleRingRhythm.BaseRing.prototype.extend = function (args, newArgs) {
        Object.keys(newArgs).forEach(function (key) {
            if (newArgs.hasOwnProperty(key)) {
                args[key] = newArgs[key];
            }
        });
        return args;
    };

    // WhiteRing Module extends BaseRing
    RippleRingRhythm.WhiteRing = function (svg, x, y) {
        var args = {
            x: x,
            y: y,
            radius: 20,
            strokeColor: '#08C'
        };
        RippleRingRhythm.BaseRing.call(this, svg, args);
    };
    RippleRingRhythm.WhiteRing.prototype = Object.create(RippleRingRhythm.BaseRing.prototype);
    RippleRingRhythm.WhiteRing.prototype.constructor = RippleRingRhythm.WhiteRing;

    // Game Module
    RippleRingRhythm.Game = function () {
        this.svg = null;
        this.points = null;
        this.rings = null;
    };

    RippleRingRhythm.Game.prototype.addWhiteRing = function (x, y) {
        var ring = new RippleRingRhythm.WhiteRing(this.svg, x, y);
        this.rings.add(ring);
    };    

    RippleRingRhythm.Game.prototype.init = function () {
        var self = this;
        // Setup properties
        this.svg = new SVG('game').size('100%', '100%');
        this.points = this.svg.set();
        this.rings = this.svg.set();
        // Setup events
        this.svg.click(function (e) {
            self.addWhiteRing(e.x, e.y);
        });
    };

    // Create instance in window and start game
    window.game = new RippleRingRhythm.Game();
    window.addEventListener('load', function () {
        window.game.init();
    }, false);
}());
