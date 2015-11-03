Tileset = function(game) {
    this._textures = {};
    this._triangleData = {};

    this.game = game;

    this._initialized = false;
};

Tileset.prototype = {
    get: function(type) {
        return this._textures[type];
    },

    draw: function(tile, graphics) {
        if(!this._initialized){
            this._constructProjector();
            this._initialized = true;
        }

        var contourPoints = [];

        _(tile.triangles).each(function(triangle) {
            var type = triangle.getTerrainType();

            if(!this._triangleData[type]){
                this._calculateTriangleData(triangle)
            }
            var triangleData = this._triangleData[type];

            var x = tile.x*40;
            var y = tile.y*40;
            var z = _([triangle.bottom*20, 0]).max();

            var offset3D = new Phaser.Plugin.Isometric.Point3(x, y, z);
            var offset = game.iso.project(offset3D);

            graphics.lineStyle(0, Phaser.Color.getColor(0,0,0), 0);

            var offsetPoints = _(triangleData.points).map(function(p) { return new Phaser.Point(offset.x + p.x, offset.y + p.y); });
            graphics.lineStyle(2, triangle.getColor(triangleData.shade), 1);
            graphics.beginFill(triangle.getColor(triangleData.shade));
            graphics.drawPolygon(offsetPoints);
            graphics.endFill();

            if(contourPoints.length < 3){
                contourPoints = offsetPoints;
            }else{
                contourPoints.push(offsetPoints[1]);
            }

        }, this);

        graphics.lineStyle(2, Phaser.Color.getColor(0,0,0), 0.3);
        graphics.moveTo(contourPoints[0].x, contourPoints[0].y);
        graphics.lineTo(contourPoints[1].x, contourPoints[1].y);
        graphics.lineTo(contourPoints[2].x, contourPoints[2].y);
        graphics.lineTo(contourPoints[3].x, contourPoints[3].y);
        graphics.lineTo(contourPoints[0].x, contourPoints[0].y);
    },

    _calculateTriangleData: function(triangle) {
        var type = triangle.getTerrainType();

        triangle.initSylvester();

        var normalizedPoints = triangle.getTerrainNormalizedValues();
        var projectedPoints = _(normalizedPoints).map(function(p, i) {
            var index = triangle.pointMap[i];
            return this.projector[index][p]
        }, this);

        this._triangleData[type] = {
            points: projectedPoints,
            shade: triangle.getShade(light)
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
                var point3 = new Phaser.Plugin.Isometric.Point3(point2.x * 40, point2.y * 40, i * 20);
                this.projector[j][i] = this.game.iso.project(point3);
            }
        }
    }
};
