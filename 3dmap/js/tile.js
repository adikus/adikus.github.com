Triangle = function(p1, p2, p3, type) {
    this.points = [p1, p2, p3];

    this.bottom = _(this.getValues()).min();
    this.top = _(this.getValues()).max();

    this._type = type;
    this.pointMap = Triangle.pointMap[type];
};

Triangle.pointMap = {
    r: [0,1,2],
    l: [2,3,0],
    t: [3,0,1],
    b: [1,2,3]
};

Triangle.colorMapKeys = [-15, 0, 3, 10, 25, 35, 1000];
Triangle.colorMap = [
    [18, 29, 99], // Deep blue
    [53, 145, 176], // Light blue
    [214, 199, 84], //Sand
    [22, 115, 14], // Green
    [15, 74, 10], // Dark green
    [115, 100, 84], // Brown grey
    [255,255,255] // White
];
Triangle.gradientMap = [
    false,
    13, //Light blue to deep blue
    false,
    3, // Green to sand
    9, // Dark green to green
    4, // Brown to green
    3 // White to brown
];

Triangle.prototype = {
    initSylvester: function() {
        this.plane = $P(this.points[0], this.points[1], this.points[2]);
    },

    getShade: function(light) {
        var shade = Math.min(Math.abs(light.dot(this.plane.normal)/2),1);
        return 0.90*shade+0.10;
    },

    getColor: function(shade) {
        var keys = Triangle.colorMapKeys;
        var i = 0;
        while(parseInt(keys[i]) < this.top){ i++; }
        var rgb = _(Triangle.colorMap[i]).map(function(v, j) {
            if(!Triangle.gradientMap[i])return v*shade;
            var c = Triangle.colorMap[i - 1][j];
            var g = Triangle.gradientMap[i]
            var r_v = Math.min(g, this.top - keys[i - 1]);
            var r_c = Math.max(0, keys[i - 1] + g - this.top);
            return (v*r_v + c*r_c)/g*shade;
        }, this);

        this._color = Phaser.Color.getColor.apply(null, rgb);
        return this._color;
    },

    getValues: function() {
        return _(this.points).map(function(p) { return p.elements[2]; });
    },

    getTerrainValues: function() {
        return _(this.getValues()).map(function(p) { return _([p, 0]).max(); });
    },

    getNormalizedValues: function() {
        return _(this.getValues()).map(function(v) { return _([v - this.bottom, 4]).min(); }, this);
    },

    getTerrainNormalizedValues: function() {
        var min = _([0, this.bottom]).max();
        return _(this.getTerrainValues()).map(function(v) { return _([v - min, 4]).min(); }, this);
    },

    getType: function() {
        return this._type + this.getNormalizedValues().join('');
    },

    getTerrainType: function() {
        return this._type + this.getTerrainNormalizedValues().join('');
    }
};

Tile = function(chunk, p1, p2, p3, p4) {
    this.chunk = chunk;
    this.points = [p1, p2, p3, p4];

    this.x = p1.elements[0];
    this.y = p1.elements[1];

    this.bottom = _(this.getValues()).min();
    this.top = _(this.getValues()).max();

    var normalizedPoints = this.isBeach() ? this.getTerrainNormalizedValues() : this.getNormalizedValues();

    var types = ['l', 'r'];

    if(normalizedPoints[1] == normalizedPoints[3]){
        types = ['t', 'b'];
    }

    this.triangles = [];
    _(types).each(function(type) {
        var map = Triangle.pointMap[type];
        this.triangles.push(new Triangle(this.points[map[0]], this.points[map[1]], this.points[map[2]], type));
    }, this);
};

Tile.prototype = {
    getValues: function() {
        return _(this.points).map(function(p) { return p.elements[2]; });
    },

    getTerrainValues: function() {
        return _(this.getValues()).map(function(p) { return _([p, 0]).max(); });
    },

    getNormalizedValues: function() {
        return _(this.getValues()).map(function(v) { return _([v - this.bottom, 4]).min(); }, this);
    },

    getTerrainNormalizedValues: function() {
        var min = _([0, this.bottom]).max();
        return _(this.getTerrainValues()).map(function(v) { return _([v - min, 4]).min(); }, this);
    },

    getType: function() {
        return this.getNormalizedValues().join('');
    },

    getTerrainType: function() {
        return this.getTerrainNormalizedValues().join('');
    },

    isBeach: function() {
        return (this.bottom <= 0) &&  (this.top > 0);
    }
};
