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
            this._chunks[i][j] = new Chunk(this.game, this.chunkSize, i, j);
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
        var centerTile = this.game.isoProjector.terrainUnproject(pointCenter.x, pointCenter.y);
        var pointCenter3;

        if(centerTile){
            pointCenter3 = new Phaser.Point(centerTile.chunk.x, centerTile.chunk.y);
        }else{
            pointCenter3 = this.game.isoProjector.unproject(pointCenter.x, pointCenter.y, 0).multiply(1 / this.chunkSize / TILE_SIZE, 1 / this.chunkSize / TILE_SIZE);
        }

        if (this._stepsSinceLastRender++ > 1) {
            var toBeShown = null;
            var minD = Infinity;

            this.forEachChunkCoord(function (i, j) {
                var chunk = game.map.getChunk(i, j);
                if(chunk._dirty)chunk.hide();
                if(!chunk.hidden && this.chunkCount <= 20)return;

                if(this._stepsSinceLastRender > 10 || game.cameraManager.containsChunk(chunk)){
                    var d = Phaser.Math.distanceSq(pointCenter3.x, pointCenter3.y, i, j);
                    if(d < minD){
                        minD = d;
                        toBeShown = chunk;
                    }
                } else chunk.hide();
            });

            if (toBeShown) {
                toBeShown.show();
                this._stepsSinceLastRender = 0;
            }
        }
    },

    hideAll: function() {
        this.forEachChunkCoord(function(i, j) {
            this.getChunk(i, j)._dirty = true;
        });
    }
};
