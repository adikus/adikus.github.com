var game;
var isoGroup;
var cursors;
var polygons;
var polygonCounts;

var scaleDown = 3;
var size = 40/scaleDown;

function preload() {
    game.load.image('cube', 'assets/cube.png');

    //game.add.plugin(Phaser.Plugin.Debug);

    game.plugins.add(new Phaser.Plugin.Isometric(game));

    game.iso.anchor.setTo(0, 0);
}

function create() {
    game.world.setBounds(-10000, -10000, 20000, 20000);

    game.time.advancedTiming = true;

    cursors = game.input.keyboard.createCursorKeys();

    //isoGroup = game.add.group();
    isoGroup = new Phaser.Group(game, null);
    //map.forEach(function (v, i, j) {
    //    var x = i*size;
    //    var y = j*size;
    //    var z = (v + detailMap.get(i, j))*size/2;
    //
    //    var cube = game.add.isoSprite(x, y, z, 'cube', 0, isoGroup);
    //
    //    cube.scale.x = 1/scaleDown;
    //    cube.scale.y = 1/scaleDown;
    //    //cube.inputEnabled = true;
    //    cube.autoCull = true;
    //    cube.anchor.set(0.5);
    //});

    var i = 1;
    _(polygonCounts).chain().keys().sort().each(function(key) {
        drawTile(key, (i++)*80, 100);
    });

    _(polygons).each(function(poly) {
        var x = poly.i*size;
        var y = poly.j*size;
        var z = poly.z*size/2;
        //var z = 0;

        var cube = game.add.isoSprite(x, y, z, null, 0, isoGroup);
        //var cube = new Phaser.Plugin.Isometric.IsoSprite(game, x, y, z, null, 0);

        cube.texture = textures[poly.getType()];
        //cube.texture = textures['0000'];
        cube.scale.x = 1/scaleDown;
        cube.scale.y = 1/scaleDown;
        //cube.inputEnabled = true;
        cube.autoCull = true;
        cube.anchor.set(0.5);
    });

    game.iso.simpleSort(isoGroup);

    // draw graphics to renderTexture
    var renderTexture = game.add.renderTexture(isoGroup.width, isoGroup.height);
    renderTexture.renderXY(isoGroup, -isoGroup.getBounds().x, -isoGroup.getBounds().y, true);

    var sprite = this.game.add.sprite(0, 0);
    sprite.texture = renderTexture;

    //renderTexture.destroy();
    //isoGroup.destroy();
}

var textures = {};

function drawTile(key, x, y) {
    var graphics = new Phaser.Graphics(game, x, y)
    //var graphics = game.add.graphics(x, y);
    var polygon = polygonCounts[key].poly;
    polygon.isoRotate();
    var color = 0.90*polygon.color+0.10;
    var points = polygon.phaserPoints();
    graphics.beginFill(Phaser.Color.getColor(0.2*55*color,255*color,0.5*255*color));
    graphics.drawPolygon(points.slice(0,3));
    graphics.endFill();
    color = 0.90*polygon.color2+0.10;
    graphics.beginFill(Phaser.Color.getColor(0.2*255*color,255*color,0.5*255*color));
    graphics.drawPolygon(points[0], points[2], points[3]);
    graphics.endFill();
    //game.add.text(x - 40, y - 40, key, {fill: 'white'});

    var renderTexture = game.add.renderTexture(200, 200);
    renderTexture.renderXY(graphics, 100, 100, true);
    textures[key] = renderTexture;
    graphics.visible = false;
}

function update() {
    if (cursors.up.isDown){
        game.camera.y -= 4;
    }
    if (cursors.down.isDown){
        game.camera.y += 4;
    }
    if (cursors.right.isDown){
        game.camera.x += 4;
    }
    if (cursors.left.isDown){
        game.camera.x -= 4;
    }
}

function render() {
    game.debug.text(game.time.fps || '--', 2, 14, "#a7aebe");
}

function getPoint(i, j) {
    return $V([i, j, (map.get(i, j) + detailMap.get(i, j))/2]);
}

function createPolygons() {
    polygons = [];
    polygonCounts = {};

    window.light = $V([0.5,0.5,1]);

    map.forEach(function (v, i, j) {
        if(i >= map.width - 1 || j >= map.height - 1)return;
        var polygon = new Polygon(getPoint(i, j), getPoint(i + 1, j), getPoint(i + 1, j + 1), getPoint(i, j + 1));
        polygons.push(polygon);
        var type = polygon.getType();
        if(!polygonCounts[type])polygonCounts[type] = {poly: polygon, count: 0};
        polygonCounts[type].count++;
    });
}

$(function () {
    window.map = new Map(241,241, 24, '1234567');
    window.detailMap = new Map(241,241, 4, 'abcdefg');;
    map.normalize(8);
    detailMap.normalize(100);

    createPolygons();

    game = new Phaser.Game($('#render').innerWidth(), 800, Phaser.CANVAS, 'render', { preload: preload, create: create, render: render, update: update});
});
