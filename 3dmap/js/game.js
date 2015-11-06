VERSION = '0.2.6-c';

TILE_SIZE = 16;
TILE_HEIGHT = 8;

DEBUG = false;

$(function() {
    window.game = new Phaser.Game($('#render').innerWidth(), window.innerHeight - 50, Phaser.CANVAS, 'render');

    game.state.add("boot", Boot);
    game.state.add("preload", Preload);
    game.state.add("title_screen", TitleScreen);
    game.state.add("loading", Loading);
    game.state.add("game", Game);
    game.state.start("boot");
});
