MapGenerator = function(seed) {
    this._seed = seed;

    this._layers = [];
};

MapGenerator.prototype = {
    addLayer: function(size, scale) {
        this._layers.push({size: size, scale: scale, map: [], interpolated: [], startPoint: null})
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
        return layer.map[x] && layer.map[x][y] ? layer.map[x][y] : null;
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
                        throw 'No anchor point at (' + i + ', ' + j + ')';
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

        //console.log('Interpolated', layer.size, x1/layer.size, x2/layer.size, y1/layer.size, y2/layer.size)
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
    }
};
