VERSION = '0.2.13';

TILE_SIZE = 15;
TILE_HEIGHT = 5;

ALLOW_PRELOAD = false;

Z_COST = 20;

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
