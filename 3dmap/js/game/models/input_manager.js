InputManager = function(game) {
    this.game = game;

    this._setupKeyboardHandler();
    this._setupZoomHandler();

    this._currentZoom = 1;
};

InputManager.prototype = {
    _setupKeyboardHandler: function() {
        this.cursors = game.input.keyboard.createCursorKeys();
    },

    _setupZoomHandler: function() {
        var self = this;

        this.game.input.mouse.mouseWheelCallback = function(event) {
            if((event.wheelDelta || event.deltaY) > 0){
                self._zoomHandler(1.05);
            }else{
                self._zoomHandler(1/1.05);
            }

            event.preventDefault();
        };

        var mc = new Hammer($('#render')[0]);
        var pinch = new Hammer.Pinch();
        mc.add([pinch]);
        mc.on("pinchstart", function() {
            self._currentZoom = 1;
        });
        mc.on("pinch", function(event) {
            self._zoomHandler(event.scale/self._currentZoom);
            self._currentZoom = event.scale;
        });
    },

    _zoomHandler: function(scale) {
        if(this._zoomHandlerCallback)this._zoomHandlerCallback(scale);
    },

    onZoom: function(handler){
        this._zoomHandlerCallback = handler;
    },

    onCursorKey: function(handler) {
        this._cursorKeyCallback = handler;
    },

    onDrag: function(handler) {
        this._dragCallback = handler;
    },

    getActivePointerXY: function() {
        var pointer = game.input.activePointer;
        return new Phaser.Point(pointer.worldX/this.game.world.scale.x, pointer.worldY/this.game.world.scale.y);
    },

    update: function() {
        if(this._cursorKeyCallback){
            if (this.cursors.up.isDown){
                this._cursorKeyCallback(0, 1);
            }
            if (this.cursors.down.isDown){
                this._cursorKeyCallback(0, -1);
            }
            if (this.cursors.right.isDown){
                this._cursorKeyCallback(1, 0);
            }
            if (this.cursors.left.isDown){
                this._cursorKeyCallback(-1, 0);
            }
        }

        if(this.game.input.activePointer.isDown && !this.game.input.pointer2.isDown){
            if (this._previousPointerPosition) {

                if(this._dragCallback)this._dragCallback(this._previousPointerPosition.x - game.input.activePointer.position.x, this._previousPointerPosition.y - game.input.activePointer.position.y);
            }
            this._previousPointerPosition = this.game.input.activePointer.position.clone();
        }else{
            this._previousPointerPosition = null;
        }
    }
};