Boot = function(game) {};

Boot.prototype = {
    preload: function() {
        if(DEBUG)game.add.plugin(Phaser.Plugin.Debug);
        game.plugins.add(new Phaser.Plugin.Isometric(game));
        game.iso.anchor.setTo(0, 0);

        $('#version').text(VERSION);
    },

    create: function() {
        game.time.advancedTiming = true;

        game.state.start('preload');
    }
};