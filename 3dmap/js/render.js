VERSION = '0.1.3-a';

var game;
var isoGroup;
var cursors;

var scaleDown = 3;
var size = 40/scaleDown;
var sprite;

var previousPointerPosition;

var renderedChunks = [];

var cube;

function preload() {
    game.load.image('cube', 'assets/cube.png');

    //game.add.plugin(Phaser.Plugin.Debug);

    game.plugins.add(new Phaser.Plugin.Isometric(game));

    game.iso.anchor.setTo(0, 0);
}

function zoom(scale) {
    var x = (game.camera.view.x + game.camera.view.halfWidth)/game.camera.scale.x;
    var y = (game.camera.view.y + game.camera.view.halfHeight)/game.camera.scale.y;

    var s = game.camera.scale.x;
    var zoom = Phaser.Math.clamp(s*scale, 0.1, 2);

    game.camera.scale.setTo(zoom);

    game.camera.x = x*game.camera.scale.x - game.camera.view.halfWidth;
    game.camera.y = y*game.camera.scale.y - game.camera.view.halfHeight;

    var bounds = isoGroup.getLocalBounds();
    game.world.setBounds(bounds.x*zoom, bounds.y*zoom, bounds.width*zoom, bounds.height*zoom);
}

function create() {
    game.time.advancedTiming = true;

    cursors = game.input.keyboard.createCursorKeys();
    game.input.mouse.mouseWheelCallback = function(event) {
        if(event.wheelDelta > 0){
            zoom(1.05);
        }else{
            zoom(1/1.05);
        }

        event.preventDefault();
    };

    window.light = $V([0,0.5,1]);

    window.map = new Map(25, game.device.desktop ? 10 : 3, '123456789');
    map.generator.addLayer(125, 3);
    map.generator.addLayer(25, 8);
    map.generator.addLayer(5, 100);

    window.tileset = new Tileset(game);

    map.forEachChunkCoord(function(i, j){
        if(!renderedChunks[i])renderedChunks[i] = [];
        renderedChunks[i][j] = false;
    });

    isoGroup = new Phaser.Group(game);

    cube = game.add.isoSprite(0, 0, 0, 'cube');
    cube.anchor.set(0.5);

    game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;

    $('#fullscreen').click(function() {
        if (game.scale.isFullScreen) {
            game.scale.stopFullScreen();
        } else {
            game.scale.startFullScreen(true);
        }
    });

    game.world.setBounds(-10000, -10000, 20000, 20000);
}

var chunksRendered = 0;

function update() {
    if (cursors.up.isDown){
        game.camera.y -= 20;
    }
    if (cursors.down.isDown){
        game.camera.y += 20;
    }
    if (cursors.right.isDown){
        game.camera.x += 20;
    }
    if (cursors.left.isDown){
        game.camera.x -= 20;
    }

    if(game.input.activePointer.isDown && !game.input.pointer2.isDown){
        if (previousPointerPosition) {
            game.camera.x += previousPointerPosition.x - game.input.activePointer.position.x;
            game.camera.y += previousPointerPosition.y - game.input.activePointer.position.y;
        }
        previousPointerPosition = game.input.activePointer.position.clone();
    }else{
        previousPointerPosition = null;
    }

    if(chunksRendered < renderedChunks.length*renderedChunks.length){
        for(var i = 0; i < renderedChunks.length; i++) {
            var rendered = false;
            for (var j = 0; j < renderedChunks[0].length; j++) {
                if(!renderedChunks[i][j]){
                    var chunk = map.getChunk(i, j);
                    chunk.render(isoGroup, tileset);
                    renderedChunks[i][j] = true;
                    rendered = true;
                    chunksRendered++;
                    break;
                }
            }
            if(rendered)break;
        }
    }

    var pointer = game.input.activePointer;
    for(var j = -50; j < 50; j++){
        var point3 = game.iso.unproject(new Phaser.Point(pointer.worldX/game.world.scale.x, pointer.worldY/game.world.scale.y), undefined, j*20);
        var x = Math.floor(point3.x/40);
        var y = Math.floor(point3.y/40);
        var chunk = map.getChunk(Math.floor(x/25), Math.floor(y/25));
        if(!chunk)continue;
        var polygon = chunk._polygons[x % 25] && chunk._polygons[x % 25][y % 25];
        if(polygon && polygon.z <= j && polygon.top >= j){
            cube.isoX = Math.floor(point3.x/40)*40;
            cube.isoY = Math.floor(point3.y/40)*40;
            cube.isoZ = polygon.z*20;
            break;
        }
    }

}

function render() {
    game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
    game.debug.text(chunksRendered, 2, 30, "#a7aebe");
    var pointer = game.input.activePointer;
    var pos = pointer.worldX + ", " + pointer.worldY;
    game.debug.text(pos, 2, 45, "#a7aebe");
    var pos2 = Math.round(cube.isoX/40) + ", " + Math.round(cube.isoY/40) + ", " + Math.round(cube.isoZ/20);
    game.debug.text(pos2, 2, 60, "#a7aebe");
}

$(function () {
    $('#version').text(VERSION);

    game = new Phaser.Game($('#render').innerWidth(), window.innerHeight - 50, Phaser.CANVAS, 'render', { preload: preload, create: create, render: render, update: update});
});
