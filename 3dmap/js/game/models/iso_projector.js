IsoProjector = function(game, light) {
    this._triangleData = {};

    this.game = game;
    this.light = light;

    this._initialized = false;
};

IsoProjector.prototype = {
    project: function(x, y, z) {
        var point3 = new Phaser.Plugin.Isometric.Point3(x, y, z);
        return this.game.iso.project(point3);
    },

    unproject: function(x, y, z) {
        var point = new Phaser.Point(x, y);
        return game.iso.unproject(point, undefined, z);
    },

    terrainUnproject: function(x, y, minZ, maxZ) {
        if(minZ === undefined)minZ = -50;
        if(maxZ === undefined)maxZ = 150;

        var foundTile = null;
        for(var j = maxZ; j > minZ; j--){
            var point3 = this.unproject(x, y, j*TILE_HEIGHT).multiply(1/TILE_SIZE, 1/TILE_SIZE);
            var point2 = (new Phaser.Point(point3.x, point3.y)).floor();
            var chunkXY = point2.clone().multiply(1/this.game.map.chunkSize, 1/this.game.map.chunkSize).floor();
            var chunk = this.game.map.getChunk(chunkXY.x, chunkXY.y);
            if(!chunk)continue;
            chunkXY.multiply(this.game.map.chunkSize, this.game.map.chunkSize);
            var tileXY = point2.clone().subtract(chunkXY.x, chunkXY.y);
            var tile = chunk._tiles[tileXY.x] && chunk._tiles[tileXY.x][tileXY.y];
            if(tile && tile.bottom <= j && tile.top >= j){
                foundTile = tile;
                break;
            }
        }

        return foundTile;
    },

    _drawPath: function(graphics, lineWidth, color, alpha, points) {
        graphics.lineStyle(lineWidth, color, alpha);
        graphics.moveTo(_(points).last().x, _(points).last().y);
        _(points).each(function(p) {
            graphics.lineTo(p.x, p.y);
        });
    },

    _getOffsetPoints: function(tile, triangle, useGlobalPosition, useTerrain) {
        if(useGlobalPosition === undefined)useGlobalPosition = false;
        if(useTerrain === undefined)useTerrain = true;
        var type = useTerrain ? triangle.getTerrainType() : triangle.getType();

        if(!this._triangleData[type]){
            this._calculateTriangleData(triangle)
        }
        var triangleData = this._triangleData[type];

        var x = tile.x*TILE_SIZE;
        var y = tile.y*TILE_SIZE;
        var z = triangle.bottom*TILE_HEIGHT;
        if(useTerrain){
            z = Math.max(0, z);
        }
        if(useGlobalPosition) {
            x += tile.chunk.x*tile.chunk.size*TILE_SIZE;
            y += tile.chunk.y*tile.chunk.size*TILE_SIZE;
        }

        var offset = this.project(x, y, z);
        return _(triangleData.points).map(function(p) { return p.clone().add(offset.x, offset.y) } );
    },

    draw: function(tile, graphics) {
        if(!this._initialized){
            this._constructProjector();
            this._initialized = true;
        }

        var contourPoints = [];

        _(tile.triangles).each(function(triangle) {
            var offsetPoints = this._getOffsetPoints(tile, triangle);
            var color = triangle.getColor(triangle.getShade(this.light));

            graphics.lineStyle(2, color, 1);
            graphics.beginFill(color);
            graphics.drawPolygon(offsetPoints);
            graphics.endFill();

            if(contourPoints.length < 3){
                contourPoints = offsetPoints;
            }else{
                contourPoints.push(offsetPoints[1]);
            }

        }, this);


        this._drawPath(graphics, 1, Phaser.Color.getColor(0,0,0), 0.3, contourPoints);
    },

    drawOverlay: function(tile, graphics) {
        if(!this._initialized){
            this._constructProjector();
            this._initialized = true;
        }

        graphics.clear();

        var contourPoints = this._getOffsetPoints(tile, tile.triangles[0], true, false);
        contourPoints.push(this._getOffsetPoints(tile, tile.triangles[1], true, false)[1]);

        graphics.beginFill(Phaser.Color.getColor(255, 255, 255), 0.3);
        graphics.drawPolygon(contourPoints);
        graphics.endFill();

        if(tile.bottom < 0){
            contourPoints = this._getOffsetPoints(tile, tile.triangles[0], true);
            contourPoints.push(this._getOffsetPoints(tile, tile.triangles[1], true)[1]);
        }

        this._drawPath(graphics, 2, Phaser.Color.getColor(0,0,0), 0.5, contourPoints);
    },

    _calculateTriangleData: function(triangle, useTerrain) {
        if(useTerrain === undefined)useTerrain = true;
        var type = useTerrain ? triangle.getTerrainType() : triangle.getType();

        var normalizedPoints = useTerrain ? triangle.getTerrainNormalizedValues() : triangle.getNormalizedValues();
        var projectedPoints = _(normalizedPoints).map(function(p, i) {
            var index = triangle.pointMap[i];
            return this.projector[index][p];
        }, this);

        this._triangleData[type] = {
            points: projectedPoints
        };
    },

    _constructProjector: function() {
        this.projector = [[],[],[],[]];

        var corners = [
            new Phaser.Point(0, 0),
            new Phaser.Point(1, 0),
            new Phaser.Point(1, 1),
            new Phaser.Point(0, 1)
        ];

        for(var i = 0; i <= 4; i++){
            for(var j = 0; j < 4; j++){
                var point2 = corners[j];
                var point3 = new Phaser.Plugin.Isometric.Point3(point2.x * TILE_SIZE, point2.y * TILE_SIZE, i * TILE_HEIGHT);
                this.projector[j][i] = this.game.iso.project(point3);
            }
        }
    }
};
