Chunk = function(mapGenerator, size, x, y) {
    this.mapGenerator = mapGenerator;

    this.x = x;
    this.y = y;
    this.size = size;

    this.initialized = false;

    this._tiles = [];
    this.hidden = true;
};

Chunk.prototype = {
    initialize: function(terrainGroup) {
        this._initializeTiles();
        this.initialized = true;

        this._group = terrainGroup;
        this._graphics = game.make.graphics(0, 0);
        this._graphics.depth = this.x + this.y;
    },

    _initializeTiles: function() {
        var points = [];

        for(var i = 0; i <= this.size; i++) {
            for (var j = 0; j <= this.size; j++) {
                var x = this.x * this.size + i;
                var y = this.y * this.size + j;

                if(!points[i])points[i] = [];

                points[i][j] = $V([i, j, Math.round(this.mapGenerator.getFinal(x, y))]);
            }
        }

        this.forEachCoord(function(i, j) {
            var tile = new Tile(this, points[i][j], points[i + 1][j], points[i + 1][j + 1], points[i][j + 1]);
            if(!this._tiles[i])this._tiles[i] = [];
            this._tiles[i][j] = tile;
        });
    },

    render: function(projector) {
        var game = this._group.game;

        this.forEachCoord(function(i, j) {
            var tile = this._tiles[i][j];

            projector.draw(tile, this._graphics);
        });

        var position = game.isoProjector.project(this.x * this.size * TILE_SIZE, this.y * this.size * TILE_SIZE, 0);
        this._graphics.x = position.x;
        this._graphics.y = position.y;
    },

    renderToMinimap: function(minimap, immediate){
        this.forEachCoord(function(i, j) {
            var tile = this._tiles[i][j];

            var triangle = tile.triangles[0];
            var shade = triangle.getShade(game.isoProjector.light);
            var color = Phaser.Color.getRGB(triangle.getColor(shade));
            var immediate = immediate !== undefined ? immediate : ((i+1) % this.size == 0) && ((j+1) % this.size == 0);
            minimap.texture.setPixel(this.x*this.size + i, this.y*this.size + j, color.red, color.green, color.blue, immediate);
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

    show: function(isoProjector) {
        if(!this._graphics || !this.hidden)return;
        this.render(isoProjector);
        this._group.add(this._graphics);
        this._group.sort('depth');
        this._graphics.cacheAsBitmap = true;
        this._graphics.visible = true;
        this.hidden = false;
    },

    forEachCoord: function(call, ctx) {
        for(var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                call.call(ctx || this, i, j);
            }
        }
    }
};
