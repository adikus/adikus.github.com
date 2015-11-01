Tileset = function(game) {
    this._textures = {};
    this._polygons = {};
    this.game = game;

    this._initialized = false;
};

Tileset.prototype = {
    get: function(type) {
        return this._textures[type];
    },

    render: function(polygon) {
        if(!this._initialized){
            this._constructProjector();
            this._initialized = true;
        }

        polygon.initSylvester();

        var normalizedPoints = polygon.getNormalizedValues();
        var projectedPoints = _(normalizedPoints).map(function(p, i) { return this.projector[i][p] }, this);

        if(normalizedPoints[1] == normalizedPoints[3]){
            projectedPoints.unshift(projectedPoints.pop());
        }

        var graphics = new Phaser.Graphics(game, 0, 0);

        graphics.beginFill(polygon.color);
        graphics.drawPolygon(projectedPoints.slice(0,3));
        graphics.endFill();

        graphics.beginFill(polygon.color2);
        graphics.drawPolygon(projectedPoints[2], projectedPoints[3], projectedPoints[0]);
        graphics.endFill();

        graphics.lineStyle(2, Phaser.Color.getColor(0,0,0), 0.3);
        graphics.moveTo(projectedPoints[0].x, projectedPoints[0].y);
        graphics.lineTo(projectedPoints[1].x, projectedPoints[1].y);
        graphics.lineTo(projectedPoints[2].x, projectedPoints[2].y);
        graphics.lineTo(projectedPoints[3].x, projectedPoints[3].y);
        graphics.lineTo(projectedPoints[0].x, projectedPoints[0].y);

        var renderTexture = game.add.renderTexture(200, 200);
        renderTexture.renderXY(graphics, 100, 100, true);
        this._textures[polygon.getType()] = renderTexture;
        this._polygons[polygon.getType()] = polygon;
        graphics.visible = false;
        console.log('Rendered', polygon.getType());

        return this._textures[polygon.getType()];
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

        console.log(this.projector);
    }
};
