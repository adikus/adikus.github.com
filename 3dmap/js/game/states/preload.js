Preload = function(game) {};

Preload.prototype = {
    preload: function() {
        game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;

        $('#fullscreen').click(function() {
            if (game.scale.isFullScreen) {
                game.scale.stopFullScreen();
            } else {
                game.scale.startFullScreen(true);
            }
        });
    },

    create: function() {
        game.state.start('title_screen');
    }
};