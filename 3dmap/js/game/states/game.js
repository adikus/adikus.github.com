Game = function() {};

Game.prototype = {
    init: function(settings) {
        this.settings = settings;
    },

    create: function() {
        game.inputManager = new InputManager(game);
        game.cameraManager = new CameraManager(game);

        game.inputManager.onZoom(game.cameraManager.zoom);
        game.inputManager.onCursorKey(function(x, y) { game.cameraManager.move(x*20, y*-20); });
        game.inputManager.onDrag(function(x, y) { game.cameraManager.move(x, y); });

        game.cameraManager.zoom(0.75);
        var center = game.map.chunkCount * game.map.chunkSize * TILE_SIZE / 2;
        game.cameraManager.centerAt(game.isoProjector.project(center, center, 0));

        this.mapOverlay = game.add.graphics(0, 0);
    },

    update: function() {
        game.inputManager.update();

        game.map.update();
        game.minimap.update();

        var point = game.inputManager.getActivePointerXY();
        this.selectedTile = game.isoProjector.terrainUnproject(point.x, point.y);
        if(this.selectedTile) {
            game.isoProjector.drawOverlay(this.selectedTile, this.mapOverlay);
        }
    },

    render: function() {
        game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
        var pointer = game.inputManager.getActivePointerXY();
        var pos = Math.round(pointer.x) + ", " + Math.round(pointer.y);
        game.debug.text(pos, 2, 45, "#a7aebe");
        if(this.selectedTile){
            var pos2 = (this.selectedTile.x+this.selectedTile.chunk.x*this.selectedTile.chunk.size) + ", " + (this.selectedTile.y+this.selectedTile.chunk.y*this.selectedTile.chunk.size) + ", " + this.selectedTile.bottom;
            game.debug.text(pos2, 2, 60, "#a7aebe");
            game.debug.text(this.selectedTile.triangles[0].getType() + ', ' +this.selectedTile.triangles[1].getType(), 2, 75, "#a7aebe");
        }
    }
};