/*jslint browser, devel, this, for */
/*global window, SVG */
(function () {
    "use strict";
    var RippleRingRhythm = {};

    // Common functions
    RippleRingRhythm.extend = function (args, newArgs) {
        Object.keys(newArgs).forEach(function (key) {
            if (newArgs.hasOwnProperty(key)) {
                args[key] = newArgs[key];
            }
        });
        return args;
    };


    // BaseRing Module
    RippleRingRhythm.BaseRing = function (svg, args) {
        var self = this, defaultArgs = {
            x: 0,
            y: 0,
            initRadius: 1,
            duration: 1000,
            speed: 0.1,
            strength: 1,
            health: 1,
            strokeColor: '#000',
            strokeWidth: '4',
            fillColor: 'transparent'
        };
        args = RippleRingRhythm.extend(defaultArgs, args);

        // Create element in target svg and set properties based on args
        this.element = svg.circle(args.initRadius);
        this.element.stroke({color: args.strokeColor, width: args.strokeWidth})
                .fill({color: args.fillColor})
                .opacity(1)
                .move(args.x, args.y);
        // Setup animation. Trigger 'ringdone' event on target svg to allow it to handle this instance
        this.element.animate({duration: args.duration})
                .radius(args.duration * args.speed)
                .opacity(0)
                .after(function () {
                    svg.fire('ringdone', {source: self.element});
                });
    };

    // WhiteRing Module extends BaseRing
    RippleRingRhythm.WhiteRing = function (svg, x, y) {
        var args = {
            x: x,
            y: y,
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
        var ringObj = new RippleRingRhythm.WhiteRing(this.svg, x, y);
        this.rings.add(ringObj.element);
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
        this.svg.on('ringdone', function (e) {
            var element;
            if (e.detail && e.detail.source) {
                element = e.detail.source;
                self.rings.remove(element);
                element.remove();
            }
        });
    };

    // Create instance in window and start game
    window.game = new RippleRingRhythm.Game();
    window.addEventListener('load', function () {
        window.game.init();
    }, false);
}());
