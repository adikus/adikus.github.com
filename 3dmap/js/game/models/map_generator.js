MapGenerator = function(seed) {
    this._seed = seed;

    this._layers = [];

    this._histogram = {};

    this.heightOffset = 0;
    this.globalScale = 1;

    this._applyHeightCurve = false;
};

MapGenerator.prototype = {
    addLayer: function(size, scale) {
        this._layers.push({size: size, scale: scale, map: [], interpolated: [], startPoint: null})
    },

    addIslandLayer: function(mapSize) {
        var template = [
            [-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4],
            [-4,-3,-2,-2,-2,-2,-2,-2,-2,-3,-4],
            [-4,-2,-1, 0, 0, 0, 0, 0,-1,-2,-4],
            [-4,-2, 0, 0, 1, 1, 1, 0, 0,-2,-4],
            [-4,-2, 0, 1, 1, 1, 1, 1, 0,-2,-4],
            [-4,-2, 0, 1, 1, 1, 1, 1, 0,-2,-4],
            [-4,-2, 0, 1, 1, 1, 1, 1, 0,-2,-4],
            [-4,-2, 0, 0, 1, 1, 1, 0, 0,-2,-4],
            [-4,-2,-1, 0, 0, 0, 0, 0,-1,-2,-4],
            [-4,-3,-2,-2,-2,-2,-2,-2,-2,-3,-4],
            [-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4]
        ];
        var map = [];
        var s = Math.round(mapSize/8);
        for(var i = 0; i < template.length; i++){
            for(var j = 0; j < template.length; j++){
                if(!map[i*s-s])map[i*s-s] = [];
                map[i*s-s][j*s-s] = template[i][j]*25;
            }
        }
        this._layers.push({
            size: s, scale: 1, map: map
        });
    },

    fromHeightMap: function(heightMap, scale) {
        var layer = {isHeightMap: true, scale: 1, map: []};
        for(var i = 0; i < heightMap.width; i++){
            for(var j = 0; j < heightMap.height; j++){
                if(!layer.map[i])layer.map[i] = [];
                layer.map[i][j] = heightMap.getPixelRGB(i, j).r / 255 * scale;
            }
        }
        this._layers.push(layer);
    },

    forEachLayer: function(call, ctx) {
        for(var i = 0; i < this._layers.length; i++) {
            call.call(ctx || this, this._layers[i]);
        }
    },

    get: function(layer, x, y){
        return layer.map[x] && layer.map[x][y] !== undefined ? layer.map[x][y] : null;
    },

    getFinal: function(x, y){
        var layer = this._layers[0];
        var height = layer.map[x] && layer.map[x][y] ? (layer.map[x][y] + this.heightOffset)/this.globalScale : null;

        if(this._applyHeightCurve){
            if(height > 1 && height <= 3)height = Math.sqrt(height);
            if(height > 3)height = Math.pow(height*0.75/75 + 0.25, 3)*70 + 0.5;
        }

        return height;
    },

    initLayerPoints: function(layer, x1, x2, y1, y2){
        if(layer.isHeightMap)return;
        x1 = Math.ceil(x1/layer.size)*layer.size;
        y1 = Math.ceil(y1/layer.size)*layer.size;
        for(var i = x1; i <= x2; i += layer.size) {
            for(var j = y1; j <= y2; j += layer.size) {
                if(!layer.map[i])layer.map[i] = [];
                if(this.get(layer, i, j) !== null)continue;

                Math.seedrandom(this._seed.toString() + i + j);

                var prevHeight = this.get(layer, i, j - layer.size) || this.get(layer, i, j + layer.size);
                var prevHeight2 = this.get(layer, i, j - 2*layer.size) || this.get(layer, i, j + 2*layer.size);

                var neighbourHeight = this.get(layer, i - layer.size, j) || this.get(layer, i + layer.size, j);
                var neighbourHeight2 = this.get(layer, i - 2*layer.size, j) || this.get(layer, i + 2*layer.size, j);

                if(prevHeight === null && neighbourHeight === null){
                    if(layer.startPoint === null){
                        layer.startPoint = [i, j];
                    }else{
                        throw 'No anchor point at (' + i + ', ' + j + ') for layer ' + layer.size + ', ' + layer.scale;
                    }
                }

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

                layer.map[i][j] = (hH + hV + slopeV + slopeH + slopeChange1 + slopeChange2 + rand1 + rand2)/2;
            }
        }
    },

    interpolateLayerPoints: function(layer, x1, x2, y1, y2) {
        if(layer.isHeightMap)return;
        x1 = Math.ceil(x1/layer.size)*layer.size;
        y1 = Math.ceil(y1/layer.size)*layer.size;
        x2 = Math.floor(x2/layer.size)*layer.size;
        y2 = Math.floor(y2/layer.size)*layer.size;

        for(var i = x1 - layer.size; i <= x2 + layer.size; i += layer.size) {
            this._interpolateColumn(layer, i, y1, y2, layer.size);
        }
        for(var j = y1; j <= y2; j++) {
            this._interpolateRow(layer, j, x1, x2, layer.size);
        }
    },

    mergeLayers: function(x1, x2, y1, y2) {
        var map = [];
        for(var i = x1; i <= x2; i++){
            if(!map[i])map[i] = [];
            for(var j = y1; j <= y2; j++){
                var height = 0;

                this.forEachLayer(function(layer) {
                    height += this.get(layer, i, j) / layer.scale;
                });

                map[i][j] = height;
                this._addToHistogram(height);
            }
        }

        this._layers = [{size: 1, scale: 1, map: map}];
    },

    normalizeWater: function(waterPercentage) {
        var map = this._layers[0].map;
        var count = map[0].length * map.length;
        var targetCount = count * (1 - waterPercentage/100);
        var keys = _(this._histogram).keys().map(function(k){ return parseInt(k); });
        keys.sort(function(a, b){ return a - b });
        var i = 0;
        var sum = 0;
        while(sum < targetCount){
            sum += this._histogram[keys[i]];
            i++;
        }
        this.heightOffset = -keys[i];
    },

    normalizeHeight: function() {
        var aboveSeeCount = 0;
        var sum = _(this._histogram).reduce(function(sum, count, height) {
            height = parseInt(height);
            if(height - this.heightOffset > 0){
                sum += count*(height - this.heightOffset);
                aboveSeeCount += count;
            }

            return sum;
        }, 0, this);

        var meanHeight = sum/aboveSeeCount + this.heightOffset;
        this.globalScale = meanHeight/65;
    },

    applyHeightCurve: function() {
        this._applyHeightCurve = true;
    },

    _interpolate: function(layer, x1, y1, x2, y2, steps) {
        var dx = Math.round((x2  - x1)/3);
        var dy = Math.round((y2  - y1)/3);

        var height2 = this.get(layer, x1 + dx, y1 + dy);
        var height3 = this.get(layer, x2 - dx, y2 - dy);
        var height1 = this.get(layer, x1, y1);
        var height4 = this.get(layer, x2, y2);

        if(height1 === null || height2 === null || height3 === null ||height4 === null){
            throw 'Unable to find all 4 points (' + x1 + ',' + x2 + ',' + y1 + ',' + y2 + ')';
        }

        var l1 = -steps;
        var l2 = 0;
        var l3 = steps;
        var l4 = steps*2;

        var anchor1 = [l2+(l3-l1)/8,height2+(height3-height1)/8];
        var anchor2 = [l3+(l2-l4)/8,height3+(height2-height4)/8];

        var values = [];
        for(var k = 1; k < steps; k++){
            values[k - 1] = this._getCubicBezierPoint([l2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], l3, height3], 1.0/steps*k)[1];
        }
        return values;
    },

    _interpolateColumn: function(layer, i, y1, y2, steps) {
        for(var j = y1; j < y2; j += steps){
            var values = this._interpolate(layer, i, j - steps, i, j + 2*steps, steps);
            _(values).each(function(v, k){ layer.map[i][j + k + 1] = v; }, this);
        }
    },

    _interpolateRow: function(layer, j, x1, x2, steps) {
        for(var i = x1; i < x2; i += steps){
            var values = this._interpolate(layer, i - steps, j, i + 2*steps, j, steps);
            _(values).each(function(v, k){
                if(!layer.map[i + k + 1])layer.map[i + k + 1] = [];
                layer.map[i + k + 1][j] = v;
            }, this);
        }
    },

    _getCubicBezierPoint: function (points, t) {
        return [
            Math.pow((1-t),3)*points[0] + 3*t*Math.pow((1-t),2)*points[2] + 3*(1-t)*Math.pow(t,2)*points[4] + Math.pow(t,3)*points[6],
            Math.pow((1-t),3)*points[1] + 3*t*Math.pow((1-t),2)*points[3] + 3*(1-t)*Math.pow(t,2)*points[5] + Math.pow(t,3)*points[7]
        ];
    },

    _addToHistogram: function(v) {
        v = Math.round(v);
        if(!this._histogram[v])this._histogram[v] = 0;
        this._histogram[v]++;
    }
};
