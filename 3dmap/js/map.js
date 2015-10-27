function Map(w, h, s, seed) {
    var map = {
        width: w,
        height: h,
        size: s,
        seed: seed,

        _map: [],

        forEachCoord: function(call, ctx) {
            for(var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.height; j++) {
                    call.call(ctx || this, i, j);
                }
            }
        },

        forEach: function(call, ctx) {
            this.forEachCoord(function(i, j) {
                call.call(this, this._map[i][j], i, j)
            }, ctx || this);
        },

        get: function(i, j){
            return this._map[i] && this._map[i][j];
        },

        max: function() {
            return _(this._map).chain().map(function (column) {
                return _(column).max();
            }).max().value();
        },

        min: function() {
            return _(this._map).chain().map(function (column) {
                return _(column).min();
            }).min().value();
        },

        normalize: function(scale) {
            var min = this.min();

            this.forEach(function(v, i, j) {
                this._map[i][j] = Math.round((v - min)/scale);
            }, this);
        },

        _initializeArray: function() {
            this.forEachCoord(function (i, j) {
                if(!this._map[i])this._map[i] = [];
                this._map[i][j] = 0;
            }, this);
        },

        _generateBasePoints: function() {
            for(var i = 0; i < this.width; i += this.size) {
                for (var j = 0; j < this.height; j += this.size) {
                    // Initialize randomness based on the seed
                    Math.seedrandom(this.seed.toString() + i + j);

                    var prevHeight = this.get(i, j - 1);
                    var prevHeight2 = this.get(i, j - 2);

                    var neighbourHeight = this.get(i - 1, j);
                    var neighbourHeight2 = this.get(i - 2, j);

                    var slopeV = prevHeight && prevHeight2 && (prevHeight - prevHeight2) || 0.1;
                    var slopeH = neighbourHeight && neighbourHeight2 && (neighbourHeight - neighbourHeight2) || 0.1;

                    var hH = prevHeight || neighbourHeight || 200;
                    var hV = neighbourHeight || 200;

                    var p0 = (hH + 50) / 300;
                    var p1 = (hV + 50) / 300;
                    var rand1 = Math.random() * 300 - 150;
                    var rand2 = Math.random() * 300 - 150;
                    var p2 = (slopeV + rand1 + 100) / 200;
                    var p3 = (slopeH + rand2 + 100) / 200;
                    var slopeChangeSize = 100;
                    var slopeChange1 = Math.random() * (slopeChangeSize - (slopeChangeSize * (p0 + p2)));
                    var slopeChange2 = Math.random() * (slopeChangeSize - (slopeChangeSize * (p1 + p3)));

                    if(Math.abs(slopeV + slopeH) > 150){
                        slopeV = slopeV / 5;
                        slopeH = slopeH / 5;
                    }

                    this._map[i][j] = (hH + hV + slopeV + slopeH + slopeChange1 + slopeChange2 + rand1 + rand2)/2;
                    if(!this._map[i][j]) { console.error('Zero height!!!', i, j); }
                }
            }
        },

        _getCubicBezierPoint: function (points, t) {
            return [
                Math.pow((1-t),3)*points[0] + 3*t*Math.pow((1-t),2)*points[2] + 3*(1-t)*Math.pow(t,2)*points[4] + Math.pow(t,3)*points[6],
                Math.pow((1-t),3)*points[1] + 3*t*Math.pow((1-t),2)*points[3] + 3*(1-t)*Math.pow(t,2)*points[5] + Math.pow(t,3)*points[7]
            ];
        },

        _interpolate: function(x1, y1, x2, y2, steps) {
            var dx = Math.round((x2  - x1)/3);
            var dy = Math.round((y2  - y1)/3);

            var height2 = this.get(x1 + dx, y1 + dy);
            var height3 = this.get(x2 - dx, y2 - dy);
            var height1 = this.get(x1, y1) || height2;
            var height4 = this.get(x2, y2) || height3;

            var l1 = -steps;
            var l2 = 0;
            var l3 = steps;
            var l4 = steps*2;

            var anchor1 = [l2+(l3-l1)/8,height2+(height3-height1)/8];
            var anchor2 = [l3+(l2-l4)/8,height3+(height2-height4)/8];

            var values = [];
            for(var k = 1; k < this.size; k++){
                values[k - 1] = this._getCubicBezierPoint([l2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], l3, height3], 1.0/steps*k)[1];
            }
            return values;
        },

        _interpolateColumn: function(i, steps) {
            for(var j = 0; j < this.height - 1; j += steps){
                var values = this._interpolate(i, j - steps, i, j + 2*steps, steps);
                _(values).each(function(v, k){ this._map[i][j + k + 1] = v; }, this);
            }
        },

        _interpolateRow: function(j, steps) {
            for(var i = 0; i < this.width - 1; i += steps){
                var values = this._interpolate(i - steps, j, i + 2*steps, j, steps);
                _(values).each(function(v, k){ this._map[i + k + 1][j] = v; }, this);
            }
        }
    };

    map._initializeArray();
    map._generateBasePoints();

    for(var i = 0; i < map.width; i += map.size) {
        map._interpolateColumn(i, map.size);
    }
    for(var j = 0; j < map.height; j++) {
        map._interpolateRow(j, map.size);
    }

    return map;
}
