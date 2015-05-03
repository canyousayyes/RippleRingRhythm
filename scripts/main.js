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

    // BaseCircle Class
    RippleRingRhythm.BaseCircle = function (game, extendArgs) {
        var defaultExtendArgs = {
            x: 0,
            y: 0,
            radius: 1,
            duration: 1000,
            strength: 1,
            health: 1,
            strokeColor: '#000',
            strokeWidth: '4',
            fillColor: '#000'
        };
        this.args = RippleRingRhythm.extend(defaultExtendArgs, extendArgs);

        // Create element in target svg and set properties based on this.args
        this.element = game.svg.circle(this.args.radius);
        this.element.stroke({color: this.args.strokeColor, width: this.args.strokeWidth})
                .fill({color: this.args.fillColor})
                .opacity(1)
                .move(this.args.x, this.args.y);

        // Setup animation
        this.animation = this.element.animate({duration: this.args.duration, ease: '-'});
        this.animation.opacity(0);
    };

    // BaseRing extends BaseCircle
    RippleRingRhythm.BaseRing = function (game, extendArgs) {
        var self = this, defaultExtendArgs = {
            radiusSpeed: 0.1,
            fillColor: 'transparent'
        };
        extendArgs = RippleRingRhythm.extend(defaultExtendArgs, extendArgs);

        // Super
        RippleRingRhythm.BaseCircle.call(this, game, extendArgs);

        // Animation
        this.animation.radius(this.args.duration * this.args.radiusSpeed);

        // Remove self instance when animation is done
        this.animation.after(function () {
            game.removeRing(self.element);
        });
    };
    RippleRingRhythm.BaseRing.prototype = Object.create(RippleRingRhythm.BaseCircle.prototype);
    RippleRingRhythm.BaseRing.prototype.constructor = RippleRingRhythm.BaseRing;

    // WhiteRing extends BaseRing
    RippleRingRhythm.WhiteRing = function (game, x, y) {
        var extendArgs = {
            x: x,
            y: y,
            strokeColor: '#08C'
        };
        RippleRingRhythm.BaseRing.call(this, game, extendArgs);
    };
    RippleRingRhythm.WhiteRing.prototype = Object.create(RippleRingRhythm.BaseRing.prototype);
    RippleRingRhythm.WhiteRing.prototype.constructor = RippleRingRhythm.WhiteRing;

    // BasePoint extends BaseCircle
    RippleRingRhythm.BasePoint = function (game, extendArgs) {
        var self = this, defaultExtendArgs = {
            dx: 0,
            dy: 0,
            radius: 6,
            duration: 5000,
            strokeColor: 'transparent'
        };
        extendArgs = RippleRingRhythm.extend(defaultExtendArgs, extendArgs);

        // Super
        RippleRingRhythm.BaseCircle.call(this, game, extendArgs);

        // Animation
        this.animation.move(this.args.x + this.args.duration * this.args.dx, this.args.y + this.args.duration * this.args.dy);

        // Remove self instance when animation is done
        this.animation.after(function () {
            game.removePoint(self.element);
        });
    };
    RippleRingRhythm.BasePoint.prototype = Object.create(RippleRingRhythm.BaseCircle.prototype);
    RippleRingRhythm.BasePoint.prototype.constructor = RippleRingRhythm.BasePoint;

    // WhitePoint extends BasePoint
    RippleRingRhythm.WhitePoint = function (game, x, y, dx, dy) {
        var self = this, extendArgs = {
            x: x,
            y: y,
            dx: dx,
            dy: dy,
            fillColor: '#08C'
        };
        RippleRingRhythm.BasePoint.call(this, game, extendArgs);

        // Setup event
        this.element.on('burst', function () {
            console.log('burst');
            game.addRing(self.element.x(), self.element.y(), 'white');
            game.removePoint(self.element);
        });
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

    RippleRingRhythm.Game.prototype.addRing = function (x, y, type) {
        var ringObj;
        switch (type) {
        case 'white':
            ringObj = new RippleRingRhythm.WhiteRing(this, x, y);
            break;
        }
        if (ringObj) {
            this.rings.add(ringObj.element);
        }
    };

    RippleRingRhythm.Game.prototype.removeRing = function (ring) {
        this.rings.remove(ring);
        ring.remove();
    };

    RippleRingRhythm.Game.prototype.addPoint = function (x, y, dx, dy, type) {
        var pointObj;
        switch (type) {
        case 'white':
            pointObj = new RippleRingRhythm.WhitePoint(this, x, y, dx, dy)
            break;
        }
        if (pointObj) {
            this.points.add(pointObj.element);
        }
    };

    RippleRingRhythm.Game.prototype.removePoint = function (point) {
        this.points.remove(point);
        point.remove();
    };

    RippleRingRhythm.Game.prototype.update = function () {
        var self = this;
        self.rings.each(function (i) {
            var ring = self.rings.get(i), rx, ry, rr;
            if (!ring) {
                return;
            }
            rx = ring.cx();
            ry = ring.cy();
            rr = ring.width() / 2;
            self.points.each(function (j) {
                var point = self.points.get(j), px, py, pr, dist2, diff2;
                if (!point) {
                    return;
                }
                px = point.cx();
                py = point.cy();
                pr = point.width() / 2;
                dist2 = Math.pow(rx - px, 2) + Math.pow(ry - py, 2);
                diff2 = Math.pow(rr + pr, 2);
                if (Math.abs(dist2 - diff2) < 400) {
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
            self.addRing(e.x, e.y, 'white');
        });
        // Setup regular functions
        this.regularAddPointHandle = setInterval(function () {
            self.addPoint(Math.random() * 400 + 20, Math.random() * 200 + 20, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, 'white');
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
