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
            duration: 500000,
            // duration: 5000,
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
                });
        // Setup event
        this.element.on('burst', function () {
            console.log('burst');
            svg.fire('pointdone', {source: self.element});
        });
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
        this.regularAddPointHandle = null;
        this.regularUpdateHandle = null;
    };

    RippleRingRhythm.Game.prototype.addWhiteRing = function (x, y) {
        var ringObj = new RippleRingRhythm.WhiteRing(this.svg, x, y);
        this.rings.add(ringObj.element);
    };

    RippleRingRhythm.Game.prototype.addPoint = function (x, y, dx, dy) {
        var pointObj = new RippleRingRhythm.WhitePoint(this.svg, x, y, dx, dy);
        this.points.add(pointObj.element);
    };

    RippleRingRhythm.Game.prototype.removeRing = function (ring) {
        this.rings.remove(ring);
        ring.remove();
    };

    RippleRingRhythm.Game.prototype.removePoint = function (point) {
        this.points.remove(point);
        point.remove();
    };

    RippleRingRhythm.Game.prototype.update = function () {
        var self = this;
        self.rings.each(function (i) {
            var ring = self.rings.get(i), rx = ring.cx(), ry = ring.cy(), rr = ring.width() / 2;
            self.points.each(function (j) {
                var point = self.points.get(j), px = point.cx(), py = point.cy(), pr = point.width() / 2, dist2, diff2;
                dist2 = Math.pow(rx - px, 2) + Math.pow(ry - py, 2);
                diff2 = Math.pow(rr + pr, 2);
                // console.log(Math.abs(dist2 - diff2), rx, ry, rr, px, py, pr);
                if (Math.abs(dist2 - diff2) < 400) {
                    // console.log('hit');
                    // self.removePoint(point);
                    point.fire('burst');
                }
            });
        });
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
            var ring;
            if (e.detail && e.detail.source) {
                ring = e.detail.source;
                self.removeRing(ring);
            }
        });
        this.svg.on('pointdone', function (e) {
            var point;
            if (e.detail && e.detail.source) {
                point = e.detail.source;
                self.removePoint(point);
            }
        });
        //debug
        self.addPoint(200, 200, 0, 0);
        // Setup regular functions
        this.regularAddPointHandle = setInterval(function () {
            // self.addPoint(Math.random() * 400 + 20, Math.random() * 200 + 20, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
        }, 1000);
        this.regularUpdateHandle = setInterval(function () {
            self.update.call(self);
        }, 30);
    };

    // Create instance in window and start game
    window.game = new RippleRingRhythm.Game();
    window.addEventListener('load', function () {
        window.game.init();
    }, false);
}());
