IsoProjector = function(game, light) {
    this._triangleData = {};

    this.game = game;
    this.light = light;

    this._initialized = false;

    this.angle = 0;
};

IsoProjector.prototype = {
    project: function(x, y, z) {
        var point2 = new Phaser.Point(x, y);
        point2.rotate(0, 0, this.angle);
        var point3 = new Phaser.Plugin.Isometric.Point3(point2.x, point2.y, z);
        return this.game.iso.project(point3);
    },

    unproject: function(x, y, z) {
        var point = new Phaser.Point(x, y);
        var point3 = game.iso.unproject(point, undefined, z);
        var point2 = new Phaser.Point(point3.x, point3.y);
        point2.rotate(0, 0, -this.angle);
        return point2;
    },

    getDepth: function(x, y) {
        var point2 = new Phaser.Point(x, y);
        point2.rotate(0, 0, this.angle);
        return point2.x + point2.y;
    },

    rotate: function(amount) {
        this.angle += amount;
        this._constructProjector();
        this._triangleData = {};
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

    getAngleIndex: function() {
        var index = Math.round(this.angle/Math.PI*2 % 4);
        if(index < 0)index += 4;
        if(index > 3)index -= 4;
        return index;
    },

    _drawPath: function(graphics, lineWidth, color, alpha, points) {
        graphics.lineStyle(lineWidth, color, alpha);
        graphics.moveTo(_(points).last().x, _(points).last().y);
        graphics.lineTo(points[0].x, points[0].y);
        graphics.lineTo(points[1].x, points[1].y);
        graphics.lineTo(points[2].x, points[2].y);
        graphics.lineTo(points[3].x, points[3].y);
    },

    _getOffsetPoints: function(tile, triangle, useGlobalPosition, useTerrain) {
        if(useGlobalPosition === undefined)useGlobalPosition = false;
        if(useTerrain === undefined)useTerrain = true;
        var type = useTerrain ? triangle.getTerrainType() : triangle.getType();

        if(!this._triangleData[type]){
            this._calculateTriangleData(triangle, useTerrain)
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

    _getBottomPoints: function(tile, bottom) {
        var indexes = [tile.triangles[0].pointMap[0],tile.triangles[0].pointMap[1],tile.triangles[0].pointMap[2],tile.triangles[1].pointMap[1]];
        var points = [this.projector[indexes[0]][0],this.projector[indexes[1]][0],this.projector[indexes[2]][0],this.projector[indexes[3]][0]];

        var x = tile.x*TILE_SIZE;
        var y = tile.y*TILE_SIZE;
        var z = bottom*TILE_HEIGHT;

        var offset = this.project(x, y, z);
        return _(points).map(function(p) { return p.clone().add(offset.x, offset.y) } );
    },

    _drawTileBottom: function(graphics, tile, contourPoints, bottom) {
        var bottomPoints = this._getBottomPoints(tile, bottom);
        var depths = _(bottomPoints).map(function(p, i) { return {i: i, y: p.y}; });
        depths.sort(function(a, b) { return b.y - a.y });

        graphics.lineStyle(0);
        graphics.beginFill(tile.top > 60 ? Phaser.Color.getColor(36, 36, 36) : tile.triangles[0].getColor(0.3));
        graphics.drawPolygon([contourPoints[depths[0].i], contourPoints[depths[1].i], bottomPoints[depths[1].i], bottomPoints[depths[0].i]]);
        graphics.drawPolygon([contourPoints[depths[0].i], contourPoints[depths[2].i], bottomPoints[depths[2].i], bottomPoints[depths[0].i]]);
        graphics.endFill();
    },

    _drawTileUnderwater: function(graphics, tile, contourPoints) {
        var bottomPoints = this._getOffsetPoints(tile, tile.triangles[0], false, false);
        bottomPoints.push(this._getOffsetPoints(tile, tile.triangles[1], false, false)[1]);
        var depths = _(contourPoints).map(function(p, i) { return {i: i, y: p.y}; });
        depths.sort(function(a, b) { return b.y - a.y });

        graphics.lineStyle(0);
        graphics.beginFill(tile.triangles[0].getColor(0.3));
        graphics.drawPolygon([contourPoints[depths[0].i], contourPoints[depths[1].i], bottomPoints[depths[1].i], bottomPoints[depths[0].i]]);
        graphics.drawPolygon([contourPoints[depths[0].i], contourPoints[depths[2].i], bottomPoints[depths[2].i], bottomPoints[depths[0].i]]);
        graphics.endFill();
    },

    draw: function(tile, graphics, isEdge) {
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

        if(isEdge && (tile.chunk.size - 1 == tile.x || tile.chunk.size - 1 == tile.y || tile.x == 0 || tile.y == 0)){
            if(tile.top > 0)this._drawTileBottom(graphics, tile, contourPoints, 0);
            else this._drawTileUnderwater(graphics, tile, contourPoints);
        }else if(tile.top > 0){
            this._drawTileBottom(graphics, tile, contourPoints, Math.max(tile.bottom - 5, 0));
        }

        this._drawPath(graphics, 1, Phaser.Color.getColor(0,0,0), 0.3, contourPoints);
    },

    drawOverlay: function(tile, graphics, color) {
        if(!this._initialized){
            this._constructProjector();
            this._initialized = true;
        }

        var contourPoints = this._getOffsetPoints(tile, tile.triangles[0], true, false);
        contourPoints.push(this._getOffsetPoints(tile, tile.triangles[1], true, false)[1]);

        graphics.lineStyle(0);
        graphics.beginFill(color || Phaser.Color.getColor(255, 255, 255), 0.2);
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
                this.projector[j][i] = this.project(point2.x * TILE_SIZE, point2.y * TILE_SIZE, i * TILE_HEIGHT);
            }
        }
    }
};
