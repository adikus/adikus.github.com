VERSION = '0.2.10-a';

TILE_SIZE = 15;
TILE_HEIGHT = 5;

ALLOW_PRELOAD = false;

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
