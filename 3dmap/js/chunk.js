Chunk = function(mapGenerator, size, x, y) {
    this.mapGenerator = mapGenerator;

    this._x = x;
    this._y = y;
    this._size = size;

    this._initialized = false;

    this._polygons = [];
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

        this._initializePolygons();
        this._initialized = true;

        this._group = new Phaser.Group(game, null);
    },

    _initializePolygons: function() {
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

                points[i][j] = $V([i, j, Math.round(points[i][j]) - 80]);
            }
        }

        this.forEachCoord(function(i, j) {
            var polygon = new Polygon(points[i][j], points[i + 1][j], points[i + 1][j + 1], points[i][j + 1]);
            if(!this._polygons[i])this._polygons[i] = [];
            this._polygons[i][j] = polygon;
        });
    },

    render: function(isoGroup, tileset) {
        if(!this._initialized){
            this._initialize();
        }

        var game = this._group.game;

        this.forEachCoord(function(i, j) {
            var polygon = this._polygons[i][j];
            var type = polygon.getType();

            if(polygon.top < 0){
                type = '0000';
            }else if(polygon.top >= 0 && polygon.z < -1){
                type = _(4).times(function(i){ return Math.max(parseInt(type.charAt(i)) + polygon.z + 1, 0); }).join('');
            }

            var texture = tileset.get(type);
            if(!texture){
                texture = tileset.render(polygon);
            }

            var x = polygon.i*40;
            var y = polygon.j*40;
            var z = polygon.z < 0 ? -20 : polygon.z*20;

            var tile = game.add.isoSprite(x, y, z, null, 0, this._group);

            if(polygon.z < 20)texture = tileset.get(type+'brown');
            if(polygon.z < 15)texture = tileset.get(type+'green');
            if(polygon.z < 3)texture = tileset.get(type+'sand');
            if(polygon.top < 0)texture = tileset.get(type+'blue');

            tile.texture = texture;
            tile.anchor.set(0.5);
        });

        //game.iso.simpleSort(this._group);

        var zoom = game.camera.scale.x;
        game.camera.scale.setTo(1);

        var localBounds = this._group.getLocalBounds();
        var bounds = this._group.getBounds();

        var renderTexture = game.add.renderTexture(Math.round(this._group.width), Math.round(this._group.height));
        renderTexture.renderXY(this._group, Math.round(-bounds.x), Math.round(-bounds.y), true);

        var anchor = new Phaser.Plugin.Isometric.Point3(this._x * this._size * 40, this._y * this._size * 40, 0);
        var position = game.iso.project(anchor);

        this._group.destroy();

        this._sprite = game.add.sprite(position.x, position.y, null, null, isoGroup);
        this._sprite.anchor.set(-localBounds.x/localBounds.width, -localBounds.y/localBounds.height);
        this._sprite.texture = renderTexture;

        game.camera.scale.setTo(zoom);
    },

    forEachCoord: function(call, ctx) {
        for(var i = 0; i < this._size; i++) {
            for (var j = 0; j < this._size; j++) {
                call.call(ctx || this, i, j);
            }
        }
    }
};
