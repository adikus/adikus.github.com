function getCubicBezierPoint(points, t) {
    return [
        Math.pow((1-t),3)*points[0] + 3*t*Math.pow((1-t),2)*points[2] + 3*(1-t)*Math.pow(t,2)*points[4] + Math.pow(t,3)*points[6],
        Math.pow((1-t),3)*points[1] + 3*t*Math.pow((1-t),2)*points[3] + 3*(1-t)*Math.pow(t,2)*points[5] + Math.pow(t,3)*points[7]
    ];
}

function generateMap(W, H, seed) {
    var rows = [];
    var heights = [];
    for(var j = 0; j<W; j++) {
        for (var i = 0; i < H; i++) {
            // Initialize randomness based on the seed
            Math.seedrandom(seed.toString() + i + j);

            var prevHeight = heights[i - 1];
            var prevHeight2 = heights[i - 2];

            var neighbourHeight = rows[j-1] && rows[j-1][i];
            var neighbourHeight2 = rows[j-2] && rows[j-2][i];

            var slopeV = prevHeight && prevHeight2 && (prevHeight - prevHeight2) || 0.1;
            var slopeH = neighbourHeight && neighbourHeight2 && (neighbourHeight - neighbourHeight2) || 0.1;

            var hH = prevHeight || neighbourHeight || 200;
            var hV = neighbourHeight || 200;

            var p0 = (hH + 50) / 300;
            var p1 = (hV + 50) / 300;
            var rand1 = Math.random() * 300 - 150;
            var rand2 = Math.random() * 300 - 150;
            var p2 = (slopeV + rand1 + 100) / 200;
            var p3 = (slopeH + rand2 + 100) / 200;
            var slopeChangeSize = 100;
            var slopeChange1 = Math.random() * (slopeChangeSize - (slopeChangeSize * (p0 + p2)));
            var slopeChange2 = Math.random() * (slopeChangeSize - (slopeChangeSize * (p1 + p3)));

            if(Math.abs(slopeV + slopeH) > 150){
                slopeV = slopeV / 5;
                slopeH = slopeH / 5;
            }

            heights[i] = (hH + hV + slopeV + slopeH + slopeChange1 + slopeChange2 + rand1 + rand2)/2;
        }
        rows[j] = $.extend([], heights);
    }
    return rows;
}

function interpolateMap(map, s, steps) {
    var result = [];
    var columns = [];
    for(var i = 0; i < map.length; i++){
        columns.push(interpolateColumn(map[i], s, steps));
    }
    for(i = 0; i < columns[0].length; i++){
        var row = _(columns).map(function(column, j){ return [column[i][0], j*s, column[i][1]]; });
        result.push(interpolateRow(row, s, steps));
    }
    return result;
}

function interpolateRow(row, s, steps) {
    var N = row.length;
    var result = [];

    for(var i = 0; i < N-1; i++){
        var height2 = row[i][2];
        var height3 = row[i+1][2];
        var height1 = (row[i-1] && row[i-1][2]) || height2;
        var height4 = (row[i+2] && row[i+2][3]) || height3;

        var y2 = row[i][1];
        var y3 = row[i+1][1];
        var y1 = row[i-1] && row[i-1][1] || row[i][1] - (s/steps);
        var y4 = row[i+2] && row[i+2][1] || row[i+1][1] + (s/steps);

        var anchor1 = [y2+(y3-y1)/8,height2+(height3-height1)/8];
        var anchor2 = [y3+(y2-y4)/8,height3+(height2-height4)/8];

        result.push([row[i][0], y2, height2]);
        for(var j = 1; j < steps; j++){
            var point = this.getCubicBezierPoint([y2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], y3, height3], 1.0/steps*j);
            point.unshift(row[i][0]);
            result.push(point);
        }
    }
    result.push([row[0][0], (N-1)*s, row[N-1][2]]);
    return result;
}

function interpolateColumn(row, s, steps) {
    var N = row.length;
    var result = [];

    for(var i = 0; i < N-1; i++){
        var height2 = row[i];
        var height3 = row[i+1];
        var height1 = row[i-1] || height2;
        var height4 = row[i+2] || height3;

        var x1 = i*s - s;
        var x2 = i*s;
        var x3 = i*s + s;
        var x4 = i*s + s*2;

        var anchor1 = [x2+(x3-x1)/8,height2+(height3-height1)/8];
        var anchor2 = [x3+(x2-x4)/8,height3+(height2-height4)/8];

        result.push([x2, height2]);
        for(var j = 1; j < steps; j++){
            result.push(this.getCubicBezierPoint([x2, height2, anchor1[0], anchor1[1], anchor2[0], anchor2[1], x3, height3], 1.0/steps*j));
        }
    }
    result.push([(N-1)*s, row[N-1]]);
    return result;
}

var queue = [];
var min = 9e99;

function calcCost(map, x1, y1, x2, y2){
    var p1 = map[x1][y1];
    var p2 = map[x2][y2];
    return Math.sqrt(Math.pow(p1[0] - p2[0],2) + Math.pow(p1[1] - p2[1],2) + 100*Math.pow(p1[2] - p2[2],2));
}

function floodFill(path, map, cb) {

    var i = 0;

    var t = new Date();
    while(queue.length && i++ < 1000){
        var point = queue.shift();
        var x = point.x;
        var y = point.y;

        var cost = point.cost;

        //var fx = map.length - 1;
        //var fy = map[0].length - 1;
        //var dist = cost + 10*Math.sqrt(Math.pow(map[x][y][0] - map[fx][fy][0],2) + Math.pow(map[x][y][1] - map[fx][fy][1],2));
        //var dist = /*cost + 5000 **/ calcCost(map, x, y, map.length-2, map[0].length-2);
        //if(dist > 1.2*min)continue;
        //if(dist < min)min = dist;
        //console.log(calcCost(map, x, y, map.length-2, map[0].length-2));

        //console.log(x, y, cost);

        if(!path[x])path[x] = [];
        if(!path[x][y] || cost < path[x][y].cost){
            path[x][y] = {x: x, y: y, cost: cost, prevx: point.prevx, prevy: point.prevy};

            //drawPolygon(x, y, 'rgba('+255+',0,0,1)');
            //window.renderContext.strokeText(Math.round(cost/100).toString(), map[x][y][1], map[x][y][0] + 10);

            addToQueue(x, y, 1, 0, cost);
            addToQueue(x, y, -1, 0, cost);
            addToQueue(x, y, 0, 1, cost);
            addToQueue(x, y, 0, -1, cost);
        }
    }
    var now = new Date();

    for(i = 0; i < path.length - 1; i++) {
        for (var j = 0; j < path[i].length-1; j++) {
            drawPolygon(i, j, 'rgba('+255+',0,0,1)');
            window.renderContext.strokeText(Math.round(path[i][j].cost/100).toString(), map[i][j][1], map[i][j][0] + 10);
        }
    }

    $('#debug').text('t: ' + (now.getTime() - t.getTime()) + '   L: ' + queue.length);
    if(queue.length == 0)return cb();
    setTimeout(function(){floodFill(path, map, cb)},1);
}

function addToQueue(x, y, ox, oy, cost) {
    if(!map[x+ox] || !map[x+ox][y+oy] || !map[x+ox+1] || !map[x+ox+1][y+oy+1])return;
    var cost = cost + calcCost(map, x, y, x+ox, y+oy);
    if(!(path[x+ox] && path[x+ox][y+oy]) || path[x+ox][y+oy].cost > cost)queue.push({x: x+ox, y: y+oy, cost: cost, prevx: x, prevy: y});
}

function drawPolygon(i, j, color){
    var ctx = window.renderContext;

    ctx.fillStyle = color;
    ctx.beginPath();
    //console.log(i, j, i+1, j+1, map[i][j], map[i+1][j+1]);
    ctx.moveTo(map[i][j][1], map[i][j][0]);
    ctx.lineTo(map[i+1][j][1], map[i+1][j][0]+1);
    ctx.lineTo(map[i+1][j+1][1]+1, map[i+1][j+1][0]+1);
    ctx.lineTo(map[i][j+1][1]+1, map[i][j+1][0]);
    ctx.closePath();
    ctx.fill();
}

function createMap(seed, size, precision) {
    var s = size;

    var $canvas = $('#canvas');
    $canvas[0].width = $canvas.parent().innerWidth();
    var W = Math.floor($canvas.parent().innerWidth() / s);
    var H = W;
    $canvas[0].height = H * s;
    window.renderContext = $canvas[0].getContext('2d');

    var columns = generateMap(W, H, seed);
    window.map = interpolateMap(columns, s, precision);

    drawMap();
}

function drawMap() {
    for(var i = 0; i < map.length - 1; i++) {
        for (var j = 0; j < map[i].length-1; j++) {
            var color = Math.round((map[i][j][2] + 100) / 900 * 255);
            drawPolygon(i, j, 'rgba(' + color + ',' + color + ',' + color + ',1)');
        }
    }
}

window.zCost = 1000;

function findRoute() {
    //path = [];
    //queue = [{x: 0, y:0, cost: 0, prevx: 0, prevy: 0}];
    //min = 9e99;
    //floodFill(path, map, function() {
    //    drawMap();
    //
    //    var point = path[path.length-1][path[0].length-1];
    //    while(point.x > 0 || point.y > 0){
    //        drawPolygon(point.x, point.y, 'rgba(255, 0, 0, 0.3)');
    //        point = path[point.prevx][point.prevy];
    //    }
    //});

    var easystar = new EasyStar.js();
    easystar.setGrid(map);
    easystar.enableDiagonals();
    easystar.enableCornerCutting();
    //easystar.setIterationsPerCalculation(100);
    easystar.findPath(0, 0, map[0].length-3, map.length-3, function(path){
        if(!path)return;
        //drawMap();

        window.path = path;

        for(var i = 0; i < path.length; i++){
            if(map[path[i].y+1] && map[path[i].y+1][path[i].x+1])
                drawPolygon(path[i].y, path[i].x, 'rgba(255, 0, 0, 0.3)');
        }
    });
    //setInterval(function(){easystar.calculate();},10)
    easystar.calculate();

}

$(
    function() {
        $('#seed').val('13245678912345');
        $('#size').val(40);
        $('#precision').val(4);
        $('#draw').click(function(){
            createMap($('#seed').val(), parseInt($('#size').val()), parseInt($('#precision').val()));
        });
        $('#route').click(function(){
            findRoute();
        });
    }
);