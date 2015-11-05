CameraManager = function(game) {
    this.game = game;

    this._calcWorldBounds();
};

CameraManager.prototype = {
    zoom: function(scale) {
        var x = (game.camera.view.x + game.camera.view.halfWidth)/game.camera.scale.x;
        var y = (game.camera.view.y + game.camera.view.halfHeight)/game.camera.scale.y;

        var zoom = Phaser.Math.clamp(game.camera.scale.x*scale, 0.4, 3);

        game.camera.scale.setTo(zoom);

        game.camera.x = x*game.camera.scale.x - game.camera.view.halfWidth;
        game.camera.y = y*game.camera.scale.y - game.camera.view.halfHeight;

        var isoBounds = game.cameraManager.getWorldBounds();
        game.world.setBounds(isoBounds.x, isoBounds.y, isoBounds.width, isoBounds.height);
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

    _calcWorldBounds: function() {
        var x1 = -0.5 * this.game.map.chunkSize * TILE_SIZE;
        var x2 = (this.game.map.chunkCount+1) * this.game.map.chunkSize * TILE_SIZE;

        var cornerLeft = this.game.isoProjector.project(x1, x2, 0);
        var cornerTop = this.game.isoProjector.project(x1, x1, TILE_HEIGHT*100);
        var cornerRight = this.game.isoProjector.project(x2, x1, 0);
        var cornerBottom = this.game.isoProjector.project(x2, x2, 0);

        this._worldBounds = {x: cornerLeft.x, y: cornerTop.y, width: cornerRight.x - cornerLeft.x, height: cornerBottom.y - cornerTop.y};
    }
};
