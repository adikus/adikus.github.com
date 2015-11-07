Minimap = function(game, group) {
    this.game = game;

    var size = game.map.chunkCount * game.map.chunkSize;
    this.scale = 300/size;
    this.texture = game.make.bitmapData(size, size);
    this.sprite = game.add.sprite(0, 0, this.texture, null, group);
    this.overlay = game.add.graphics(0, 0, group);

    this.sprite.anchor.setTo(0.5);
    this.sprite.fixedToCamera = true;
    this.sprite.scale.setTo(this.scale);
    this.sprite.inputEnabled = true;
    this.sprite.events.onInputDown.add(this.click, this);

    this.overlay.fixedToCamera = true;
    this.overlay.scale.setTo(this.scale);

    this.mask = game.add.graphics();
    this.mask.beginFill(0xffffff);
    this.mask.drawRect(-size/2, -size/2, size, size);
    this.mask.scale.setTo(this.scale);
    this.mask.fixedToCamera = true;
    this.overlay.mask = this.mask;

    this.rotate();
    this.reposition(game.camera.width);

    // TODO: minimapOverlay.mask
};

Minimap.prototype = {
    update: function() {
        this.sprite.scale.setTo(1 / this.game.camera.scale.x * this.scale);
        this.overlay.scale.setTo(1 / this.game.camera.scale.x * this.scale);
        this.mask.scale.setTo(1 / this.game.camera.scale.x * this.scale);

        this.overlay.clear();

        var halfSize = game.map.chunkCount*game.map.chunkSize/2;

        var chunkSize = this.game.map.chunkSize;
        this.game.map.forEachChunkCoord(function(i, j) {
            var chunk = this.game.map.getChunk(i, j);
            if(chunk.hidden && !chunk.cached){
                this.overlay.beginFill(Phaser.Color.getColor(0,0,0), 0.3);
                this.overlay.drawRect(i*chunkSize - halfSize, j*chunkSize - halfSize, chunkSize, chunkSize);
                this.overlay.endFill();
            }
        }, this);

        var corners = _(this.game.cameraManager.getCorners()).map(function(p) {
            return this.game.isoProjector.unproject(p.x, p.y, 0);
        }, this);

        this.overlay.lineStyle(Math.round(2/this.scale), Phaser.Color.getColor(0,0,0));

        this.overlay.moveTo(_(corners).last().x/TILE_SIZE - halfSize, _(corners).last().y/TILE_SIZE - halfSize);
        _(corners).each(function(c) {
            this.overlay.lineTo(c.x/TILE_SIZE - halfSize, c.y/TILE_SIZE - halfSize);
        }, this);
    },

    click: function() {
        var point = new Phaser.Point(game.input.activePointer.x - this.sprite.cameraOffset.x, game.input.activePointer.y - this.sprite.cameraOffset.y);
        point.rotate(0, 0, -this.game.isoProjector.angle);

        var size = game.map.chunkCount * game.map.chunkSize * this.scale;
        var x = Math.round((point.x + size/2) / this.scale);
        var y = Math.round((point.y + size/2) / this.scale);
        var cx = Math.floor(x/game.map.chunkSize);
        var cy = Math.floor(y/game.map.chunkSize);
        var tile = game.map.getChunk(cx, cy)._tiles[x % game.map.chunkSize][y % game.map.chunkSize];

        this.game.cameraManager.centerAt(this.game.isoProjector.project(x*TILE_SIZE, y*TILE_SIZE, tile.bottom*TILE_HEIGHT));
    },

    reposition: function(width) {
        var size = game.map.chunkCount * game.map.chunkSize;

        this.sprite.cameraOffset.setTo(width - size*this.scale/2, size*this.scale/2);
        this.overlay.cameraOffset.setTo(width - size*this.scale/2, size*this.scale/2);
        this.mask.cameraOffset.setTo(width - size*this.scale/2, size*this.scale/2);
    },

    rotate: function() {
        var angle = game.isoProjector.angle * 180 / Math.PI;
        this.sprite.angle = angle;
        this.overlay.angle = angle;
    }
};