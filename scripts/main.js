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
        this.element.animate({duration: args.duration, ease: '-'})
                .radius(args.duration * args.speed)
                .opacity(0)
                .after(function () {
                    svg.fire('ringdone', {source: self.element});
                });
    };

    // WhiteRing extends BaseRing
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

    // BasePoint Module
    RippleRingRhythm.BasePoint = function (svg, args) {
        var self = this, defaultArgs = {
            x: 0,
            y: 0,
            radius: 6,
            duration: 5000,
            dx: 0,
            dy: 0,
            health: 1,
            fillColor: '#000'
        };
        args = RippleRingRhythm.extend(defaultArgs, args);

        // Create element in target svg and set properties based on args
        this.element = svg.circle(args.radius);
        this.element.fill({color: args.fillColor})
                .opacity(1)
                .move(args.x, args.y);
        // Setup animation. Trigger 'pointdone' event on target svg to allow it to handle this instance
        this.element.animate({duration: args.duration, ease: '-'})
                .move(args.x + args.duration * args.dx, args.y + args.duration * args.dy)
                .opacity(0)
                .after(function () {
                    svg.fire('pointdone', {source: self.element});
                });;
    };

    // WhitePoint extends BasePoint
    RippleRingRhythm.WhitePoint = function (svg, x, y, dx, dy) {
        var args = {
            x: x,
            y: y,
            dx: dx,
            dy: dy,
            fillColor: '#08C'
        };
        RippleRingRhythm.BasePoint.call(this, svg, args);
    };
    RippleRingRhythm.WhitePoint.prototype = Object.create(RippleRingRhythm.BasePoint.prototype);
    RippleRingRhythm.WhitePoint.prototype.constructor = RippleRingRhythm.BasePoint;

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

    RippleRingRhythm.Game.prototype.addPoint = function (x, y, dx, dy) {
        var pointObj = new RippleRingRhythm.WhitePoint(this.svg, x, y, dx, dy);
        this.points.add(pointObj.element);
    };

    RippleRingRhythm.Game.prototype.init = function () {
        var self = this;
        // Setup properties
        this.svg = new SVG('game').size('100%', '100%');
        this.points = this.svg.set();
        this.rings = this.svg.set();
        // Setup events
        setInterval(function () {
            self.addPoint(Math.random() * 400 + 20, Math.random() * 200 + 20, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
        }, 1000);
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
        this.svg.on('pointdone', function (e) {
            var element;
            if (e.detail && e.detail.source) {
                element = e.detail.source;
                self.points.remove(element);
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
