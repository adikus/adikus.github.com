CameraManager = function(game) {
    this.game = game;

    this._calcWorldBounds();
    this._targetZoom = 1;
    this._zoomDirty = false;
};

CameraManager.prototype = {
    zoom: function(scale) {
        game.cameraManager._targetZoom = Phaser.Math.clamp(game.cameraManager._targetZoom*scale, 0.4, 3);
        game.cameraManager._zoomDirty = true;
    },

    move: function(x, y) {
        game.camera.x += x;
        game.camera.y += y;
    },

    centerAt: function(point) {
        this.game.camera.x = point.x*game.camera.scale.x - game.camera.view.halfWidth;
        this.game.camera.y = point.y*game.camera.scale.y - game.camera.view.halfHeight;
    },

    getFocusXY: function() {
        return new Phaser.Point(
            (game.camera.x + game.camera.view.halfWidth)/game.world.scale.x,
            (game.camera.y + game.camera.view.halfHeight)/game.world.scale.y
        );
    },

    getWorldBounds: function() {
        return new Phaser.Rectangle(
            this._worldBounds.x * this.game.camera.scale.x,
            this._worldBounds.y * this.game.camera.scale.y,
            this._worldBounds.width * this.game.camera.scale.x,
            this._worldBounds.height * this.game.camera.scale.y
        );
    },

    getCameraBounds: function()  {
        return new Phaser.Rectangle(
            game.camera.x/game.world.scale.x,
            game.camera.y/game.world.scale.y,
            game.camera.width/game.world.scale.x,
            game.camera.height/game.world.scale.y
        );
    },

    getCorners: function() {
        var bounds = this.getCameraBounds();

        return [
            new Phaser.Point(bounds.x, bounds.y),
            new Phaser.Point(bounds.x + bounds.width, bounds.y),
            new Phaser.Point(bounds.x + bounds.width, bounds.y + bounds.height),
            new Phaser.Point(bounds.x, bounds.y + bounds.height)
        ];
    },

    update: function() {
        if(this._zoomDirty){
            var x = (game.camera.view.x + game.camera.view.halfWidth)/game.camera.scale.x;
            var y = (game.camera.view.y + game.camera.view.halfHeight)/game.camera.scale.y;

            game.camera.scale.setTo(this._targetZoom);

            game.camera.x = x*game.camera.scale.x - game.camera.view.halfWidth;
            game.camera.y = y*game.camera.scale.y - game.camera.view.halfHeight;

            var isoBounds = game.cameraManager.getWorldBounds();
            game.world.setBounds(isoBounds.x, isoBounds.y, isoBounds.width, isoBounds.height);

            this._zoomDirty = false;
        }
    },

    rotate: function() {
        this._calcWorldBounds();
        this.zoom(1);
    },

    containsChunk: function(chunk) {
        var bounds = this.getCameraBounds();

        var chunkCorners = chunk.getCorners();
        for(var i = 0; i < chunkCorners.length; i++){
            var corner = chunkCorners[i];
            var point = this.game.isoProjector.project(corner.x * TILE_SIZE, corner.y * TILE_SIZE, corner.z * TILE_HEIGHT);
            if(bounds.contains(point.x, point.y))return true;
        }

        return false;
    },

    _calcWorldBounds: function() {
        var x1 = -this.game.map.chunkSize * TILE_SIZE;
        var x2 = (this.game.map.chunkCount+2) * this.game.map.chunkSize * TILE_SIZE;

        var corners = [];
        corners[0] = this.game.isoProjector.project(x1, x2, 0);
        corners[1] = this.game.isoProjector.project(x1, x1, 0);
        corners[2] = this.game.isoProjector.project(x2, x1, 0);
        corners[3] = this.game.isoProjector.project(x2, x2, 0);

        var minX = _(corners).chain().map(function(p){ return p.x; }).min().value();
        var maxX = _(corners).chain().map(function(p){ return p.x; }).max().value();
        var minY = _(corners).chain().map(function(p){ return p.y; }).min().value();
        var maxY = _(corners).chain().map(function(p){ return p.y; }).max().value();

        this._worldBounds = {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
    }
};
