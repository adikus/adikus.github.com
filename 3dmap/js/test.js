var game;

function preload() {
    game.load.image('cube', 'assets/cube.png');
}

function create() {
    game.world.setBounds(-10000, -10000, 20000, 20000);
    game.time.advancedTiming = true;

    for(var i = 0; i < 150; i++) {
        for (var j = 0; j < 150; j++) {

            var scale = 8;
            //var cube = game.add.tileSprite(i*80/scale, j*80/scale, 70, 74, 'cube', 'cube');
            var cube = game.add.image(i*80/scale, j*80/scale, 'cube');
            cube.autoCull = true;
            cube.scale.x = cube.scale.y = 1/scale;
        }
    }

    game.camera.y = -100;
}

function render() {
    game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
}

$(function () {
    game = new Phaser.Game($('#canvas').parent().innerWidth(), 1200, Phaser.CANVAS, 'canvas', { preload: preload, create: create, render: render});
});

