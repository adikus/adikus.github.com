Minimap = function(game) {
    this.game = game;

    var size = game.map.chunkCount * game.map.chunkSize;
    this.scale = size > 300 ? 300/size : 1;
    this.texture = game.make.bitmapData(size, size);
    this.sprite = game.add.sprite(0, 0, this.texture);
    this.overlay = game.add.graphics(0,0);

    this.sprite.fixedToCamera = true;
    this.sprite.cameraOffset.setTo(game.camera.width - size*this.scale, 0);
    this.sprite.scale.setTo(this.scale);

    this.overlay.fixedToCamera = true;
    this.overlay.cameraOffset.setTo(game.camera.width - size*this.scale, 0);
    this.overlay.scale.setTo(this.scale);

    // TODO: minimapOverlay.mask
};

Minimap.prototype = {
    update: function() {
        this.sprite.scale.setTo(1 / this.game.camera.scale.x * this.scale);
        this.overlay.scale.setTo(1 / this.game.camera.scale.x * this.scale);

        this.overlay.clear();

        var chunkSize = this.game.map.chunkSize;
        this.game.map.forEachChunkCoord(function(i, j) {
            if(this.game.map.getChunk(i, j).hidden){
                this.overlay.beginFill(Phaser.Color.getColor(0,0,0), 0.3);
                this.overlay.drawRect(i*chunkSize, j*chunkSize, chunkSize, chunkSize);
                this.overlay.endFill();
            }
        }, this);

        var corners = _(this.game.cameraManager.getCorners()).map(function(p) {
            return this.game.isoProjector.unproject(p.x, p.y, 0);
        }, this);

        this.overlay.lineStyle(Math.round(2/this.scale), Phaser.Color.getColor(0,0,0));

        this.overlay.moveTo(_(corners).last().x/TILE_SIZE, _(corners).last().y/TILE_SIZE);
        _(corners).each(function(c) {
            this.overlay.lineTo(c.x/TILE_SIZE, c.y/TILE_SIZE);
        }, this);
    }
};