Preload = function(game) {};

Preload.prototype = {
    preload: function() {
        game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;
        game.scale.fullScreenTarget = $('#render')[0];

        $('#fullscreen').click(function() {
            if (game.scale.isFullScreen) {
                game.scale.stopFullScreen();
            } else {
                game.scale.startFullScreen(true);
            }
        });

        $(window).resize(function() {
            game.scale.setGameSize($('#render').innerWidth(), window.innerHeight - 50);
        });
    },

    create: function() {
        game.state.start('title_screen');
    }
};