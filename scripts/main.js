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

    // Setting Class
    RippleRingRhythm.Setting = function () {
        this.score = 0;
        this.ringDuration = 1000;
        this.ringSpeed = 0.1;
        this.pointDuration = 5000;
        this.pointSpeed = 0.1;
        this.pointMax = 500;
        this.pointFrequency = 4;
        this.chainCountMax = 10;
        this.chainTimeout = 1000;
        this.chainMultiplier = 1.1;
    };

    // BaseCircle Class
    RippleRingRhythm.BaseCircle = function (game, extendArgs) {
        var defaultExtendArgs = {
            x: 0,
            y: 0,
            radius: 1,
            duration: 1000,
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
            radiusSpeed: game.setting.ringSpeed,
            duration: game.setting.ringDuration,
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
            duration: game.setting.pointDuration,
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
            game.addRing(self.element.x(), self.element.y(), 'white');
            game.removePoint(self.element);
            game.addChainedScore(100);
        });
    };
    RippleRingRhythm.WhitePoint.prototype = Object.create(RippleRingRhythm.BasePoint.prototype);
    RippleRingRhythm.WhitePoint.prototype.constructor = RippleRingRhythm.BasePoint;

    // Game Module
    RippleRingRhythm.Game = function () {
        this.svg = null;
        this.svgScore = null;
        this.points = null;
        this.rings = null;
        this.chainCount = null;
        this.lastChainTimestamp = null;
        this.setting = null;
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
        if (this.points.members.length >= this.setting.pointMax) {
            return;
        }
        switch (type) {
        case 'white':
            pointObj = new RippleRingRhythm.WhitePoint(this, x, y, dx, dy);
            break;
        }
        if (pointObj) {
            this.points.add(pointObj.element);
        }
    };

    RippleRingRhythm.Game.prototype.addRandomPoint = function () {
        var rbox, direction, speed, angle, x, y, dx, dy;
        rbox = this.svg.rbox();
        speed = this.setting.pointSpeed;
        angle = Math.random() * 120 - 60;
        // Random determine a direction
        direction = Math.floor(Math.random() * 4);
        // Determine x, y, angle based on direction
        switch (direction) {
        case 0: // Come from top, x = 10% ~ 90% width, y = 0, angle = 270 +/- range
            x = ((Math.random() * 0.8) + 0.1) * rbox.width;
            y = 0;
            angle = angle + 270;
            break;
        case 1: // Come from bottom, x = 10% ~ 90% width, y = height, angle = 90 +/- range
            x = ((Math.random() * 0.8) + 0.1) * rbox.width;
            y = rbox.height;
            angle = angle + 90;
            break;
        case 2: // Come from left, x = 0, y = 10% ~ 90% height, angle = 0 +/- range
            x = 0;
            y = ((Math.random() * 0.8) + 0.1) * rbox.height;
            break;
        case 3: // Come from right, x = 0, y = 10% ~ 90% height, angle = 180 +/- range
            x = rbox.width;
            y = ((Math.random() * 0.8) + 0.1) * rbox.height;
            angle = angle + 180;
            break;
        }
        // Calculate dx, dy
        angle = angle * Math.PI / 180;
        dx = speed * Math.cos(angle);
        dy = speed * Math.sin(angle) * -1;
        // Add that point into game
        this.addPoint(x, y, dx, dy, 'white');
    };

    RippleRingRhythm.Game.prototype.removePoint = function (point) {
        this.points.remove(point);
        point.remove();
    };

    RippleRingRhythm.Game.prototype.addScore = function (score) {
        this.setting.score += score;
    };

    RippleRingRhythm.Game.prototype.addChainedScore = function (baseScore) {
        var score, newChainTimestamp = new Date();
        // Update chain count
        if (newChainTimestamp - this.lastChainTimestamp > this.setting.chainTimeout) {
            this.chainCount = 0;
        }
        this.chainCount = Math.min(this.chainCount + 1, this.setting.chainCountMax);
        this.lastChainTimestamp = newChainTimestamp;
        // Update score
        score = Math.floor(baseScore * Math.pow(this.setting.chainMultiplier, this.chainCount));
        this.addScore(score);
    };

    RippleRingRhythm.Game.prototype.update = function () {
        var self = this;
        // Update collision
        self.rings.each(function (i) {
            var ring = self.rings.get(i), rx, ry, rr;
            if (!ring) {
                return;
            }
            rx = ring.cx();
            ry = ring.cy();
            rr = ring.width() / 2;
            self.points.each(function (j) {
                var point = self.points.get(j), px, py, pr, dist2, diff2, ratio;
                if (!point) {
                    return;
                }
                px = point.cx();
                py = point.cy();
                pr = point.width() / 2;
                dist2 = Math.pow(rx - px, 2) + Math.pow(ry - py, 2);
                diff2 = Math.pow(rr + pr, 2);
                if (diff2 < 0.1) {
                    ratio = 0;
                } else {
                    ratio = dist2 / diff2;
                }
                if ((ratio > 0.85) && (ratio < 1.15)) {
                    point.fire('burst');
                }
            });
        });
        // Update score
        this.svgScore.text("Score: " + this.setting.score);
    };

    RippleRingRhythm.Game.prototype.init = function () {
        var self = this;
        // Setup properties
        this.svg = new SVG('game').size('100%', '100%');
        this.svgScore = this.svg.text("").move(10, 5).font({
            family: 'sans-serif',
            size: 14
        });
        this.points = this.svg.set();
        this.rings = this.svg.set();
        this.chainCount = 0;
        this.lastChainTimestamp = new Date();
        this.setting = new RippleRingRhythm.Setting();
        // Setup events
        this.svg.click(function (e) {
            self.addRing(e.x, e.y, 'white');
        });
        // Setup regular functions
        this.regularAddPointHandle = setInterval(function () {
            var i;
            for (i = 0; i < self.setting.pointFrequency; i += 1) {
                self.addRandomPoint();
            }
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
