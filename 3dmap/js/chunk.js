Chunk = function(mapGenerator, size, x, y) {
    this.mapGenerator = mapGenerator;

    this._x = x;
    this._y = y;
    this._size = size;

    this._initialized = false;

    this._tiles = [];
    this.hidden = true;

    this.onMinimap = false;
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

        this._graphics = game.make.graphics(0, 0);
        this._graphics.depth = this._x + this._y;
    },

    _initializeTiles: function() {
        var points = [];

        for(var i = 0; i <= this._size; i++) {
            for (var j = 0; j <= this._size; j++) {
                var x = this._x * this._size + i;
                var y = this._y * this._size + j;

                if(!points[i])points[i] = [];

                var height = 0;

                this.mapGenerator.forEachLayer(function(layer) {
                    height += this.mapGenerator.get(layer, x, y) / layer.scale;
                }, this);

                points[i][j] = $V([i, j, Math.round(height + heightOffset)]);
            }
        }

        this.forEachCoord(function(i, j) {
            var tile = new Tile(this, points[i][j], points[i + 1][j], points[i + 1][j + 1], points[i][j + 1]);
            if(!this._tiles[i])this._tiles[i] = [];
            this._tiles[i][j] = tile;
        });
    },

    render: function(isoGroup, tileset, minimapTexture) {
        if(!this._initialized){
            this._initialize(isoGroup);
        }

        var game = isoGroup.game;

        this.forEachCoord(function(i, j) {
            var tile = this._tiles[i][j];

            tileset.draw(tile, this._graphics);
        });

        var anchor = new Phaser.Plugin.Isometric.Point3(this._x * this._size * TILE_SIZE, this._y * this._size * TILE_SIZE, 0);
        var position = game.iso.project(anchor);
        this._graphics.x = position.x;
        this._graphics.y = position.y;

        this.renderToMinimap(minimapTexture);
    },

    renderToMinimap: function(minimapTexture, immediate){
        this.forEachCoord(function(i, j) {
            var tile = this._tiles[i][j];

            var triangle = tile.triangles[0];
            var color = Phaser.Color.getRGB(triangle.getColor(triangle.getShade(light)));
            var immediate = immediate !== undefined ? immediate : ((i+1) % this._size == 0) && ((j+1) % this._size == 0);
            minimapTexture.setPixel(this._x*this._size + i, this._y*this._size + j, color.red, color.green, color.blue, immediate);
            this.onMinimap = true;
        });
    },

    hide: function() {
        if(!this._graphics || this.hidden)return;
        this._graphics.cacheAsBitmap = false;
        this._graphics.visible = false;
        this._graphics.clear();
        this._graphics.parent.remove(this._graphics);
        this.hidden = true;
    },

    show: function(isoGroup, tileset, minimapTexture) {
        if(!this._graphics || !this.hidden)return;
        this.render(isoGroup, tileset, minimapTexture);
        isoGroup.add(this._graphics);
        isoGroup.sort('depth');
        this._graphics.cacheAsBitmap = true;
        this._graphics.visible = true;
        this.hidden = false;
    },

    forEachCoord: function(call, ctx) {
        for(var i = 0; i < this._size; i++) {
            for (var j = 0; j < this._size; j++) {
                call.call(ctx || this, i, j);
            }
        }
    }
};
