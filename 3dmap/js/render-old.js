Polygon = function(p1, p2, p3, color) {

    var poly = {
        points: [p1, p2, p3],
        rotatedPoints: [p1, p2, p3],
        color: color,

        initSylvester: function() {
            this.plane = $P(p1, p2, p3);
            this.normal = this.plane.normal;
            if(!this.color)
                this.color = Math.min(Math.abs(this.getColor(light)),1);
        },

        getColor: function(light) {
            return light.dot(this.normal);
        },

        phaserPoints: function() {
            return _(this.rotatedPoints).map(function (point) {
                return new Phaser.Point(point.elements[0], point.elements[1]);
            });
        },

        rotate: function(angle, angle2) {
            var axis1 = $L([575,575,0], [0,0,1]);
            var axis2 = $L([575,575,250], [1,0,0]);
            this.rotatedPoints = _(this.points).map(function (point) {
                return point.rotate(angle2, axis1).rotate(angle, axis2);
            });
        }
    };

    poly.initSylvester();

    return poly;
};

var game;

var polygons = [];
var graphics;
var angle = Math.PI/4;
var angle2 = Math.PI/4;
var light = $V([-0.5,-0.5,1]);
var cursors;
var keys;

function preload() {
    game.load.image('cube', 'assets/cube.png');

    // Add and enable the plug-in.
    game.plugins.add(new Phaser.Plugin.Isometric(game));

    // This is used to set a game canvas-based offset for the 0, 0, 0 isometric coordinate - by default
    // this point would be at screen coordinates 0, 0 (top left) which is usually undesirable.
    game.iso.anchor.setTo(0, 0);
}

var isoGroup;

function create() {
    game.world.setBounds(-2500, -2500, 5000, 5000);

    graphics = game.add.graphics(0, 0);
    cursors = game.input.keyboard.createCursorKeys();
    keys = {
        w: game.input.keyboard.addKey(Phaser.Keyboard.W),
        s: game.input.keyboard.addKey(Phaser.Keyboard.S),
        a: game.input.keyboard.addKey(Phaser.Keyboard.A),
        d: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };
}

var cursorPos;

function createISO() {
    game.world.setBounds(-10000, -10000, 20000, 20000);

    game.time.advancedTiming = true;
    // Create a group for our tiles, so we can use Group.sort
    isoGroup = game.add.group();

    var routeMap = {};
    if(path){
        _(path).each(function (p) {
            routeMap[p.y+'_'+p.x] = true;
        });
    }

    var scaleDown = $('#precision').val();
    var size = 40/scaleDown;

    for(var i = 0; i < map.length - 1; i++) {
        for (var j = 0; j < map[i].length - 1; j++) {
            var x = Math.round(map[i][j][0]/size)*size;
            var y = Math.round(map[i][j][1]/size)*size;
            var z = Math.round(map[i][j][2]/size/6*2)*size/2;

            var color = routeMap[i+'_'+j] ? 0xFF0000 : null;

            var cube = game.add.isoSprite(x, y, z, 'cube', 0, isoGroup);

            if(color)cube.tint = color;
            cube.scale.x = 1/scaleDown;
            cube.scale.y = 1/scaleDown;
            cube.inputEnabled = true;
            cube.autoCull = true;
            cube.anchor.set(0.5);
        }
    }

    game.camera.scale.x = game.camera.scale.y = 4;

    // Let's make a load of cubes on a grid, but do it back-to-front so they get added out of order.
    /*var cube;
    for (var xx = 256; xx > 0; xx -= 48) {
        for (var yy = 256; yy > 0; yy -= 48) {
            // Create a cube using the new game.add.isoSprite factory method at the specified position.
            // The last parameter is the group you want to add it to (just like game.add.sprite)
            cube = game.add.isoSprite(xx, yy, xx/3, 'cube', 0, isoGroup);
            cube.anchor.set(0.5);
        }
    }*/
    //game.iso.simpleSort(isoGroup);

    cursors = game.input.keyboard.createCursorKeys();
    keys = {
        w: game.input.keyboard.addKey(Phaser.Keyboard.W),
        s: game.input.keyboard.addKey(Phaser.Keyboard.S),
        a: game.input.keyboard.addKey(Phaser.Keyboard.A),
        d: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };

    cursorPos = new Phaser.Plugin.Isometric.Point3();
}

var unprojectZ = 0;

function update() {
    if (keys.w.isDown){
        game.camera.y -= 4;
    }
    if (keys.s.isDown){
        game.camera.y += 4;
    }
    if (keys.d.isDown){
        game.camera.x += 4;
    }
    if (keys.a.isDown){
        game.camera.x -= 4;
    }

    if(graphics){
        if (cursors.up.isDown) {
            angle += Math.PI/100;
            _(polygons).each(function (poly) {
                poly.rotate(angle, angle2);
            });
        }
        if (cursors.down.isDown) {
            angle -= Math.PI/100;
            _(polygons).each(function (poly) {
                poly.rotate(angle, angle2);
            });
        }
        if (cursors.right.isDown) {
            angle2 -= Math.PI/100;
            _(polygons).each(function (poly) {
                poly.rotate(angle, angle2);
            });
        }
        if (cursors.left.isDown) {
            angle2 += Math.PI/100;
            _(polygons).each(function (poly) {
                poly.rotate(angle, angle2);
            });
        }

        graphics.clear();

        _(polygons).each(function (polygon) {
            var color = polygon.color;
            graphics.beginFill(Phaser.Color.getColor(255*color,255*color,255*color));
            graphics.drawPolygon(polygon.phaserPoints());
            graphics.endFill();
        });
    }

    if(false && isoGroup){

        isoGroup.forEach(function (tile) {

            var inBounds = tile.input.pointerOver();

            if (!tile.selected && inBounds) {
                tile.selected = true;
                tile.tint = 0x86bfda;
            }
            else if (tile.selected && !inBounds) {
                tile.selected = false;
                tile.tint = 0xffffff;
            }
        });
    }
}

function render() {
    //game.debug.cameraInfo(game.camera, 32, 500);
    game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
    //var pos = game.input.activePointer.worldX + " - " + game.input.activePointer.worldY;
    //game.debug.text(pos, 2, 30, "#a7aebe");
}

function updatePolys() {
    var pointMap = _(map).map(function (row) {
        return _(row).map(function (values) {
            return $V([values[1],values[0],Math.round(values[2]/5/20)*20]);
        });
    });

    polygons = [];

    var routeMap = {};
    if(path){
        _(path).each(function (p) {
            routeMap[p.y+'_'+p.x] = true;
        });
    }

    for(var i = 0; i < pointMap.length - 2; i++) {
        for (var j = 0; j < pointMap[i].length - 2; j++) {

            var color = routeMap[i+'_'+j] ? 0xFF0000 : null;

            polygons.push(new Polygon(pointMap[i][j], pointMap[i+1][j], pointMap[i+1][j+1], color));
            polygons.push(new Polygon(pointMap[i][j], pointMap[i][j+1], pointMap[i+1][j+1], color));
        }
    }

    _(polygons).each(function (poly) {
        poly.rotate(angle, angle2);
    });
}

$(function () {
    $('#renderButton').click(function(){

        updatePolys();

        game = new Phaser.Game($('#render').parent().innerWidth(), 2000, Phaser.CANVAS, 'render', { create: create, update: update, render: render });
    });

    $('#isoButton').click(function(){
        game = new Phaser.Game(1920, 1080, Phaser.CANVAS, 'render', { preload: preload, create: createISO, render: render, update: update });
    });
});

