Chunk = function(game, size, x, y) {
    this.game = game;

    this.x = x;
    this.y = y;
    this.size = size;

    this.initialized = false;

    this._tiles = [];
    this.hidden = true;

    this._dirty = true;
    this._cache = [];
};

Chunk.prototype = {
    initialize: function(terrainGroup) {
        this._initializeTiles();
        this.initialized = true;

        this._group = terrainGroup;
    },

    getTile: function(x, y) {
        return this._tiles[x] && this._tiles[x][y];
    },

    _initializeTiles: function() {
        var points = [];

        for(var i = 0; i <= this.size; i++) {
            for (var j = 0; j <= this.size; j++) {
                var x = this.x * this.size + i;
                var y = this.y * this.size + j;

                if(!points[i])points[i] = [];

                points[i][j] = $V([i, j, Math.round(this.game.map.generator.getFinal(x, y))]);
            }
        }

        this.forEachCoord(function(i, j) {
            var tile = new Tile(this, points[i][j], points[i + 1][j], points[i + 1][j + 1], points[i][j + 1]);
            if(!this._tiles[i])this._tiles[i] = [];
            this._tiles[i][j] = tile;
        });
    },

    rotate: function() {
        this._dirty = true;
        this.cached = this._cache[this.game.isoProjector.getAngleIndex()];
    },

    render: function() {
        var index = this.game.isoProjector.getAngleIndex();

        if(this._graphics && this.allowCaching)this.hide();

        if(this._cache[index]){
            this._graphics = this._cache[index];
        }else{
            if(!this._graphics || this.allowCaching)this._graphics = game.make.graphics(0, 0);

            this.forEachCoord(function(i, j) {
                var tile = this._tiles[i][j];

                var isEdge = this.game.map.chunkCount - 1 == this.x || this.game.map.chunkCount - 1 == this.y || this.x == 0 || this.y == 0;
                timestat('draw', function() {
                    this.game.isoProjector.draw(tile, this._graphics, isEdge, this._dirty);
                }, this);

            });

            var position = this.game.isoProjector.project(this.x * this.size * TILE_SIZE, this.y * this.size * TILE_SIZE, 0);
            this._graphics.x = position.x;
            this._graphics.y = position.y;
            this._graphics.depth = this.game.isoProjector.getDepth(this.x, this.y);

            this._graphics.cacheAsBitmap = true;

            if(this.allowCaching){
                this._cache[index] = this._graphics;
                this.cached = true;
            }

            var graphics = this._graphics;
            _.defer(function(){ graphics.graphicsData = []; });
        }

        this._dirty = false;
    },

    renderToMinimap: function(minimap, immediate){
        this.forEachCoord(function(i, j) {
            var tile = this._tiles[i][j];

            if(!this.allowCaching){
                this.game.isoProjector.saveTriangle(tile, tile.triangles[0]);
                this.game.isoProjector.saveTriangle(tile, tile.triangles[1]);
            }

            var triangle = tile.triangles[0];
            var shade = triangle.getShade(game.isoProjector.light);
            var color = Phaser.Color.getRGB(triangle.getColor(shade));
            var immediate = immediate !== undefined ? immediate : ((i+1) % this.size == 0) && ((j+1) % this.size == 0);
            minimap.texture.setPixel(this.x*this.size + i, this.y*this.size + j, color.red, color.green, color.blue, immediate);
        });
    },

    hide: function() {
        if(this.hidden)return;
        if(!this.allowCaching){
            this._graphics.cacheAsBitmap = false;
            this._graphics.clear();
            this._dirty = true;
        }
        this._graphics.visible = false;
        this._graphics.parent.remove(this._graphics);
        this.hidden = true;
    },

    show: function() {
        if(!this.hidden && !this._dirty)return;
        if(this._dirty) {
            this.render();
        }
        this._group.add(this._graphics);
        this._group.sort('depth');
        this._graphics.visible = true;
        this.hidden = false;
    },

    forEachCoord: function(call, ctx) {
        var point1 = new Phaser.Point(0, 0);
        var point2 = new Phaser.Point(this.size, this.size);
        point2.rotate(0, 0, -this.game.isoProjector.angle);
        var offset = (new Phaser.Point(this.size, this.size)).subtract(point2.x,point2.y).multiply(0.5,0.5);
        point1.add(offset.x, offset.y);
        point2.add(offset.x, offset.y);

        var xStart = Math.round(point1.x);
        var xEnd = Math.round(point2.x);
        var xStep = Math.round((xEnd - xStart)/this.size);
        var yStart = Math.round(point1.y);
        var yEnd = Math.round(point2.y);
        var yStep = Math.round((yEnd - yStart)/this.size);

        if(xStart > xEnd){ xStart--; xEnd--; }
        if(yStart > yEnd){ yStart--; yEnd--; }

        for(var i = xStart; Math.round(Math.abs(xEnd - i)) > 0; i += xStep) {
            for(var j = yStart; Math.round(Math.abs(yEnd - j)) > 0; j += yStep) {
                call.call(ctx || this, i, j);
            }
        }
    },

    getCorners: function() {
        var tiles = [this._tiles[0][0], this._tiles[this.size - 1][0], this._tiles[this.size - 1][this.size - 1], this._tiles[0][this.size - 1]];

        return _(tiles).map(function(tile) {
            return new Phaser.Plugin.Isometric.Point3(tile.globalX(), tile.globalY(), tile.bottom);
        });
    },

    getControlPoints: function() {
        var corners = this.getCorners();

        var additionalPoints = [
            this._tiles[Math.floor(this.size/2)][Math.floor(this.size/2)],
            this._tiles[0][Math.floor(this.size/2)],
            this._tiles[this.size - 1][Math.floor(this.size/2)],
            this._tiles[Math.floor(this.size/2)][this.size - 1],
            this._tiles[Math.floor(this.size/2)][0]
        ];
        additionalPoints = _(additionalPoints).map(function(tile) {
            return new Phaser.Plugin.Isometric.Point3(tile.globalX(), tile.globalY(), tile.bottom);
        });

        corners.push.apply(corners, additionalPoints);
        return corners;
    }
};
