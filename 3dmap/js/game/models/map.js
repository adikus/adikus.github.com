Map = function(game, chunkSize, chunkCount, seed) {
    this.generator = new MapGenerator(seed);
    this.game = game;
    this.terrainGroup = game.add.group();

    this._createChunks(chunkSize, chunkCount);
    this.initializedChunks = 0;
    this._stepsSinceLastRender = Infinity;
};

Map.createFromHeightMap = function(game, chunkCount, image, scale) {
    var map = new Map(game, chunkCount, Math.floor((image.width - 1) / chunkCount));
    var bmd = game.make.bitmapData(image.width, image.height);
    bmd.draw(image, 0, 0);
    bmd.update();
    map.generator.fromHeightMap(bmd, scale);

    return map;
};

Map.prototype = {
    _createChunks: function(chunkSize, chunkCount) {
        this._chunks = [];

        this.chunkSize = chunkSize;
        this.chunkCount = chunkCount;

        this.forEachChunkCoord(function (i, j) {
            if(!this._chunks[i])this._chunks[i] = [];
            this._chunks[i][j] = new Chunk(this.generator, this.chunkSize, i, j);
        }, this);
    },

    forEachChunkCoord: function(call, ctx) {
        for(var i = 0; i < this.chunkCount; i++) {
            for (var j = 0; j < this.chunkCount; j++) {
                call.call(ctx || this, i, j);
            }
        }
    },

    getChunk: function(x, y){
        return this._chunks[x] && this._chunks[x][y];
    },

    generateAll: function() {
        this.generator.forEachLayer(function(layer) {
            var startX = -layer.size;
            var endX = Math.ceil(this.chunkCount * this.chunkSize / layer.size) * layer.size + layer.size;
            var startY = -layer.size;
            var endY = Math.ceil(this.chunkCount * this.chunkSize / layer.size) * layer.size + layer.size;

            this.generator.initLayerPoints(layer, startX, endX, startY, endY);
            this.generator.interpolateLayerPoints(layer, startX + layer.size, endX - layer.size, startY + layer.size, endY - layer.size);
        }, this);

        this.generator.mergeLayers(0, this.chunkCount * this.chunkSize, 0, this.chunkCount * this.chunkSize);
    },

    initializeChunks: function(maxCount) {
        var count = this.initializedChunks;
        for(var i = 0; i < this.chunkCount; i++) {
            for (var j = 0; j < this.chunkCount; j++) {
                var chunk = this.getChunk(i, j);
                if (!chunk.initialized) {
                    chunk.initialize(this.terrainGroup);
                    chunk.renderToMinimap(this.game.minimap, this.initializedChunks - count == maxCount);
                    this.initializedChunks++;
                }
                if (this.initializedChunks - count > maxCount)break;
            }
            if(this.initializedChunks - count > maxCount)break;
        }

        return this.initializedChunks == this.chunkCount * this.chunkCount;
    },

    update: function() {
        var pointCenter = this.game.cameraManager.getFocusXY();
        var pointCenter3 = this.game.isoProjector.unproject(pointCenter.x, pointCenter.y, 0).multiply(1/this.chunkSize/TILE_SIZE, 1/this.chunkSize/TILE_SIZE);

        if(this._stepsSinceLastRender > 1){
            var border = this.chunkSize * TILE_SIZE;
            var borders = [[-2*border, 0], [0, -2.5*border], [border, 0], [0, border]];
            var corners = _(this.game.cameraManager.getCorners()).map(function(p, i) {
                return this.game.isoProjector.unproject(p.x, p.y, 0).add(borders[i][0], borders[i][1]);
            }, this);
            var bounds = new Phaser.Polygon(corners);

            var toBeShown = null;
            var minD = Infinity;

            this.forEachChunkCoord(function(i, j){
                var d = Phaser.Math.distanceSq(pointCenter3.x, pointCenter3.y, i, j);
                var chunk = this.getChunk(i, j);
                var x = chunk.x * chunk.size * TILE_SIZE;
                var y = chunk.y * chunk.size * TILE_SIZE;
                var z = chunk._tiles[0][0].top;
                var offset = this.game.isoProjector.project(0, 0, z * TILE_HEIGHT);
                var offset3 = this.game.isoProjector.unproject(offset.x, offset.y, 0);
                x += offset3.x;
                y += offset3.y;

                if(chunk._graphics && bounds.contains(x, y)){
                    if(d < minD && chunk.hidden){
                        minD = d;
                        toBeShown = chunk;
                    }
                }else{
                    this.getChunk(i, j).hide();
                }
            });

            if(toBeShown){ toBeShown.show( this.game.isoProjector); }

            this._stepsSinceLastRender = 0;
        }else{ this._stepsSinceLastRender++; }
    }
};
