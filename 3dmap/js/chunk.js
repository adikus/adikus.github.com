Chunk = function(mapGenerator, size, x, y) {
    this.mapGenerator = mapGenerator;

    this._x = x;
    this._y = y;
    this._size = size;

    this._initialized = false;

    this._tiles = [];
};

Chunk.prototype = {
    _initialize: function(isoGroup) {
        this.mapGenerator.forEachLayer(function(layer) {
            var startX = Math.floor(this._x * this._size / layer.size) * layer.size - layer.size;
            var endX = Math.ceil((this._x + 1) * this._size / layer.size) * layer.size + layer.size;
            var startY = Math.floor(this._y * this._size / layer.size) * layer.size - layer.size;
            var endY = Math.ceil((this._y + 1) * this._size / layer.size) * layer.size + layer.size;

            this.mapGenerator.initLayerPoints(layer, startX, endX, startY, endY);
            this.mapGenerator.interpolateLayerPoints(layer, startX + layer.size, endX - layer.size, startY + layer.size, endY - layer.size);
        }, this);

        this._initializeTiles();
        this._initialized = true;

        this._group = new Phaser.Group(game, null);
        this._graphics = game.add.graphics(0, 0, isoGroup);
        this._graphics.cacheAsBitmap = true;
    },

    _initializeTiles: function() {
        var points = [];

        for(var i = 0; i <= this._size; i++) {
            for (var j = 0; j <= this._size; j++) {
                var x = this._x * this._size + i;
                var y = this._y * this._size + j;

                if(!points[i])points[i] = [];
                points[i][j] = 0;

                this.mapGenerator.forEachLayer(function(layer) {
                    points[i][j] += this.mapGenerator.get(layer, x, y) / layer.scale;
                }, this);

                points[i][j] = $V([i, j, Math.round(points[i][j]) + heightOffset]);
            }
        }

        this.forEachCoord(function(i, j) {
            var tile = new Tile(points[i][j], points[i + 1][j], points[i + 1][j + 1], points[i][j + 1]);
            if(!this._tiles[i])this._tiles[i] = [];
            this._tiles[i][j] = tile;
        });
    },

    render: function(isoGroup, tileset) {
        if(!this._initialized){
            this._initialize(isoGroup);
        }

        var game = this._group.game;

        this.forEachCoord(function(i, j) {
            var tile = this._tiles[i][j];

            tileset.draw(tile, this._graphics);
        });

        var anchor = new Phaser.Plugin.Isometric.Point3(this._x * this._size * 40, this._y * this._size * 40, 0);
        var position = game.iso.project(anchor);
        this._graphics.x = position.x;
        this._graphics.y = position.y;
    },

    forEachCoord: function(call, ctx) {
        for(var i = 0; i < this._size; i++) {
            for (var j = 0; j < this._size; j++) {
                call.call(ctx || this, i, j);
            }
        }
    }
};
