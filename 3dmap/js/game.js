VERSION = '0.2.5-c';

TILE_SIZE = 16;
TILE_HEIGHT = 8;

DEBUG = false;

window.time = function(name, cb, ctx) {
    var start = window.performance.now();
    cb.call(ctx);
    var end = window.performance.now();
    console.log(name, ' took ', end - start, ' ms');
};

$(function() {
    window.game = new Phaser.Game($('#render').innerWidth(), window.innerHeight - 50, Phaser.CANVAS, 'render');

    game.state.add("boot", Boot);
    game.state.add("preload", Preload);
    game.state.add("title_screen", TitleScreen);
    game.state.add("loading", Loading);
    game.state.add("game", Game);
    game.state.start("boot");
});
