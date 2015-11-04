VERSION = '0.2.2-b';

var game;
var isoGroup;
var cursors;
var isoBounds;

var scaleDown = 3;
var size = 40/scaleDown;
var sprite;

var previousPointerPosition;

var renderedChunks = [];

var cube;
var selectedTile;

var zoomOnPinchStart;

var minimap;
var minimapOverlay;
var minimapTexture;

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
    var zoom = Phaser.Math.clamp(s*scale, 0.3, 2);

    game.camera.scale.setTo(zoom);

    game.camera.x = x*game.camera.scale.x - game.camera.view.halfWidth;
    game.camera.y = y*game.camera.scale.y - game.camera.view.halfHeight;

    var bounds = isoGroup.getLocalBounds();
    game.world.setBounds(isoBounds.x*zoom, isoBounds.y*zoom, isoBounds.width*zoom, isoBounds.height*zoom);
}

function create() {
    game.time.advancedTiming = true;

    cursors = game.input.keyboard.createCursorKeys();
    game.input.mouse.mouseWheelCallback = function(event) {
        if((event.wheelDelta || event.deltaY) > 0){
            zoom(1.05);
        }else{
            zoom(1/1.05);
        }

        event.preventDefault();
    };

    var mc = new Hammer($('#render')[0]);
    var pinch = new Hammer.Pinch();
    mc.add([pinch]);
    mc.on("pinchstart", function() {
        zoomOnPinchStart = game.camera.scale.x;
    });
    mc.on("pinch", function(event) {
        zoom(event.scale / game.camera.scale.x * zoomOnPinchStart);
    });

    window.light = $V([0,0.5,1]);

    localStorage.seed = $('#seed').val();
    localStorage.offset = $('#height_offset').val();

    window.heightOffset = parseInt(localStorage.offset);
    if(game.device.desktop){
        window.map = new Map(15, 25, localStorage.seed);
    }else{
        window.map = new Map(5, 30, localStorage.seed);
    }
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

    var size = map._chunkCount*map._chunkSize;
    minimapTexture = game.make.bitmapData(size, size);
    minimap = game.add.sprite(0, 0, minimapTexture);
    minimap.fixedToCamera = true;
    minimap.cameraOffset.setTo(game.camera.width - size, 0);
    minimapOverlay = game.add.graphics(0,0);
    minimapOverlay.fixedToCamera = true;
    minimapOverlay.cameraOffset.setTo(game.camera.width - size, 0);
    // TODO: minimapOverlay.mask

    game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;

    $('#fullscreen').click(function() {
        if (game.scale.isFullScreen) {
            game.scale.stopFullScreen();
        } else {
            game.scale.startFullScreen(true);
        }
    });

    var x1 = -2*map._chunkSize*40;
    var x2 = (map._chunkCount+4)*map._chunkSize*40;
    var cornerA3 = new Phaser.Plugin.Isometric.Point3(x1, x2, 0);
    var cornerA = game.iso.project(cornerA3);
    var cornerB3 = new Phaser.Plugin.Isometric.Point3(x1, x1, 0);
    var cornerB = game.iso.project(cornerB3);
    var cornerC3 = new Phaser.Plugin.Isometric.Point3(x2, x1, 0);
    var cornerC = game.iso.project(cornerC3);
    var cornerD3 = new Phaser.Plugin.Isometric.Point3(x2, x2, 0);
    var cornerD = game.iso.project(cornerD3);
    isoBounds = {x: cornerA.x, y: cornerB.y, width: cornerC.x - cornerA.x, height: cornerD.y - cornerB.y};

    zoom(0.3);

    var centerX = map._chunkCount * map._chunkSize * 20;
    var center = new Phaser.Plugin.Isometric.Point3(centerX, centerX, 0);
    var position = game.iso.project(center);

    game.camera.x = position.x*game.camera.scale.x - game.camera.view.halfWidth;
    game.camera.y = position.y*game.camera.scale.y - game.camera.view.halfHeight;
}

var chunksRendered = 0;
var stepsSinceLastRender = Infinity;

function findTile(x, y) {
    var point = new Phaser.Point(x, y);
    var foundTile = null;
    for(var j = 100; j > -100; j--){
        var point3 = game.iso.unproject(point, undefined, j*20);
        var x = Math.floor(point3.x/40);
        var y = Math.floor(point3.y/40);
        var chunk = map.getChunk(Math.floor(x/map._chunkSize), Math.floor(y/map._chunkSize));
        if(!chunk)continue;
        var tile = chunk._tiles[x % map._chunkSize] && chunk._tiles[x % map._chunkSize][y % map._chunkSize];
        if(tile && tile.bottom <= j && tile.top >= j){
            foundTile = tile;
            break;
        }
    }

    return foundTile;
}

function update() {
    minimap.scale.setTo(1/game.camera.scale.x);
    minimapOverlay.scale.setTo(1/game.camera.scale.x);

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

    var x = (game.camera.x + game.camera.view.halfWidth)/game.world.scale.x;
    var y = (game.camera.y + game.camera.view.halfHeight)/game.world.scale.y;
    var centerTile = findTile(x, y);
    var activeChunk = centerTile ? centerTile.chunk : null;

    var x1 = game.camera.x/game.world.scale.x;
    var x2 = (game.camera.x + game.camera.view.width)/game.world.scale.x;
    var y1 = game.camera.y/game.world.scale.y;
    var y2 = (game.camera.y + game.camera.view.height)/game.world.scale.y;

    var pointA = new Phaser.Point(x1, y1);
    var pointA3 = game.iso.unproject(pointA, undefined, 0);
    var pointB = new Phaser.Point(x2, y1);
    var pointB3 = game.iso.unproject(pointB, undefined, 0);
    var pointC = new Phaser.Point(x2, y2);
    var pointC3 = game.iso.unproject(pointC, undefined, 0);
    var pointD = new Phaser.Point(x1, y2);
    var pointD3 = game.iso.unproject(pointD, undefined, 0);

    minimapOverlay.clear();
    minimapOverlay.lineStyle(2, Phaser.Color.getColor(0,0,0), 1);
    minimapOverlay.moveTo(pointA3.x/40, pointA3.y/40);
    minimapOverlay.lineTo(pointB3.x/40, pointB3.y/40);
    minimapOverlay.lineTo(pointC3.x/40, pointC3.y/40);
    minimapOverlay.lineTo(pointD3.x/40, pointD3.y/40);
    minimapOverlay.lineTo(pointA3.x/40, pointA3.y/40);

    var pointer = game.input.activePointer;
    var px = pointer.worldX/game.world.scale.x;
    var py = pointer.worldY/game.world.scale.y;
    var selectedTile = findTile(px, py);
    if(selectedTile){
        //console.log(selectedTile);
        cube.isoX = (selectedTile.x + selectedTile.chunk._x * map._chunkSize)*40;
        cube.isoY = (selectedTile.y + selectedTile.chunk._y * map._chunkSize)*40;
        cube.isoZ = selectedTile.bottom*20;
    }

    if(stepsSinceLastRender > 1 && activeChunk){
        var toBeShown = null;
        var minD = 10;
        map.forEachChunkCoord(function(i, j){
            var d = Phaser.Math.distance(activeChunk._x, activeChunk._y, i, j);
            var chunk = map.getChunk(i, j);
            if(d < minD && chunk.hidden){
                minD = d;
                toBeShown = chunk;
            }
            else if(d > 10)map.getChunk(i, j).hide();
        });

        if(toBeShown){ toBeShown.show(); }

        stepsSinceLastRender = 0;
    }else{ stepsSinceLastRender++; }
}

function render() {
    game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
    game.debug.text(chunksRendered, 2, 30, "#a7aebe");
    var pointer = game.input.activePointer;
    var pos = pointer.worldX/game.world.scale.x + ", " + pointer.worldY/game.world.scale.y;
    game.debug.text(pos, 2, 45, "#a7aebe");
    var pos2 = Math.round(cube.isoX/40) + ", " + Math.round(cube.isoY/40) + ", " + Math.round(cube.isoZ/20);
    game.debug.text(pos2, 2, 60, "#a7aebe");
    if(selectedTile){
        game.debug.text(selectedTile.getType(), 2, 75, "#a7aebe");
    }
}

$(function () {
    $('#version').text(VERSION);

    if($('#seed').val() == '')$('#seed').val(localStorage.seed || '123456789');
    if($('#height_offset').val() == '')$('#height_offset').val(localStorage.offset || '-80');

    var started = false;

    $('#start').click(function(){
        if(!started){
            game = new Phaser.Game($('#render').innerWidth(), window.innerHeight - 50, Phaser.CANVAS, 'render', { preload: preload, create: create, render: render, update: update});
        }
        started = true;
        $('.start').hide();
    });
});
