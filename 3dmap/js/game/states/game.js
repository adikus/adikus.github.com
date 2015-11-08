Game = function() {};

Game.prototype = {
    init: function(settings) {
        this.settings = settings;
        this.groups = settings.groups;
    },

    create: function() {
        game.inputManager = new InputManager(game);
        game.cameraManager = new CameraManager(game);

        game.map.easystar = new EasyStar.js();
        game.map.easystar.setGrid(game.map);
        game.map.easystar.setIterationsPerCalculation(200);
        game.map.easystar.enableDiagonals();

        game.inputManager.onZoom(game.cameraManager.zoom);
        game.inputManager.onCursorKey(function(x, y) { game.cameraManager.move(x*20, y*-20); });
        game.inputManager.onDrag(function(x, y) { game.cameraManager.move(x, y); });
        game.inputManager.onKeyDown(Phaser.KeyCode.Q, function() { this.rotate(Math.PI/2); }, this);
        game.inputManager.onKeyDown(Phaser.KeyCode.E, function() { this.rotate(-Math.PI/2); }, this);
        game.inputManager.onKeyDown(Phaser.KeyCode.O, function() {
            this.pathStart = this.selectedTile;
            game.isoProjector.drawOverlay(this.pathStart, game.map.pathOverlay, Phaser.Color.getColor(0, 255, 255));
        }, this);
        game.inputManager.onKeyDown(Phaser.KeyCode.P, function() {
            this.pathEnd = this.selectedTile;
            var self = this;
            game.map.easystar.findPath(this.pathStart.globalX(), this.pathStart.globalY(), this.pathEnd.globalX(), this.pathEnd.globalY(), true, function(path){
                //console.log(path);
                game.map.pathOverlay.clear();
                _(path).each(function(point) {
                    var tile = game.map.getTile(point.x, point.y);
                    game.isoProjector.drawOverlay(tile, game.map.pathOverlay, Phaser.Color.getColor(255, 0, 0));
                });
                var point = path[Math.floor(path.length/2)];
                game.map.easystar.findPath(self.pathStart.globalX(), self.pathStart.globalY(), point.x, point.y, false, function(path){
                    //console.log(path);
                    game.map.pathOverlay.clear();
                    _(path).each(function(point) {
                        var tile = game.map.getTile(point.x, point.y);
                        game.isoProjector.drawOverlay(tile, game.map.pathOverlay, Phaser.Color.getColor(0, 255, 0));
                    });
                });
                game.map.easystar.findPath(point.x, point.y, self.pathEnd.globalX(), self.pathEnd.globalY(), false, function(path){
                    //console.log(path);
                    game.map.pathOverlay.clear();
                    _(path).each(function(point) {
                        var tile = game.map.getTile(point.x, point.y);
                        game.isoProjector.drawOverlay(tile, game.map.pathOverlay, Phaser.Color.getColor(0, 0, 255));
                    });
                });
            });
            console.log('start');
        }, this);

        game.cameraManager.zoom(0.75);
        var center = game.map.chunkCount * game.map.chunkSize * TILE_SIZE / 2;
        game.cameraManager.centerAt(game.isoProjector.project(center, center, 0));

        game.map.pathOverlay = game.add.graphics(0, 0, this.groups.overlay);
        this.mapOverlay = game.add.graphics(0, 0, this.groups.overlay);

        game.scale.onFullScreenChange.add(function(scale){
            game.minimap.reposition(scale.width);
        });
    },

    update: function() {
        game.map.easystar.calculate();
        game.inputManager.update();
        game.cameraManager.update();

        game.map.update();
        game.minimap.update();

        var point = game.inputManager.getActivePointerXY();
        this.selectedTile = game.isoProjector.terrainUnproject(point.x, point.y);
        if(this.selectedTile) {
            this.mapOverlay.clear();
            game.isoProjector.drawOverlay(this.selectedTile, this.mapOverlay);
        }
    },

    render: function() {
        game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
        var pointer = game.inputManager.getActivePointerXY();
        var pos = Math.round(pointer.x) + ", " + Math.round(pointer.y);
        game.debug.text(pos, 2, 45, "#a7aebe");
        if(this.selectedTile){
            var pos2 = (this.selectedTile.globalX()) + ", " + (this.selectedTile.globalY()) + ", " + this.selectedTile.bottom;
            game.debug.text(pos2, 2, 60, "#a7aebe");
            game.debug.text(this.selectedTile.triangles[0].getType() + ', ' +this.selectedTile.triangles[1].getType(), 2, 75, "#a7aebe");
        }
    },

    rotate: function(amount) {
        var center2 = game.cameraManager.getFocusXY();
        var centerTile = game.isoProjector.terrainUnproject(center2.x, center2.y);
        var center3 = game.isoProjector.unproject(center2.x, center2.y, 0);

        game.isoProjector.rotate(amount);
        game.minimap.rotate();
        game.cameraManager.rotate();
        game.map.rotate();

        var newCenter = centerTile ? game.isoProjector.project(centerTile.globalX()*TILE_SIZE, centerTile.globalY()*TILE_SIZE, centerTile.bottom*TILE_HEIGHT) : game.isoProjector.project(center3.x, center3.y, 0);
        game.cameraManager.centerAt(newCenter);
    }
};