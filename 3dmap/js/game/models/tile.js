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

Triangle.colorMapKeys = [-15, 0, 1, 10, 32, 42, 65, 1000];
Triangle.colorMap = [
    [18, 29, 99], // Deep blue
    [53, 145, 176], // Light blue
    [214, 199, 84], //Sand
    [22, 115, 14], // Green
    [12, 59, 8], // Dark green
    [115, 100, 84], // Brown grey
    [120, 120, 120], // Grey
    [255,255,255] // White
];
Triangle.gradientMap = [
    false,
    14, //Light blue to deep blue
    false,
    4, // Green to sand
    20, // Dark green to green
    5, // Brown to green
    2, // Grey to brown
    3 // White to grey
];
Triangle.heightColorMap = {};
Triangle.shadeMap = {};

Triangle.prototype = {
    initSylvester: function() {
        this.plane = $P(this.points[0], this.points[1], this.points[2]);
    },

    getShade: function(light) {
        if(this.top <= 0)return this.getWaterShade(light);
        var type = this.getType();
        if(Triangle.shadeMap[type])return Triangle.shadeMap[type];
        this.initSylvester();
        var shade = Math.min(Math.abs(light.dot(this.plane.normal)/2),1);
        Triangle.shadeMap[type] = 0.80*shade+0.20;
        return Triangle.shadeMap[type];
    },

    getWaterShade: function(light) {
        if(Triangle.shadeMap['w'])return Triangle.shadeMap['w'];
        var shade = Math.min(Math.abs(light.dot($V([0,0,1]))/2),1);
        Triangle.shadeMap['w'] = 0.80*shade+0.20;
        return Triangle.shadeMap['w'];
    },

    getColor: function(shade) {
        var color;
        if(Triangle.heightColorMap[this.top]){
            color = Triangle.heightColorMap[this.top];
        }else{
            var keys = Triangle.colorMapKeys;
            var i = 0;
            while(parseInt(keys[i]) < this.top){ i++; }
            color = _(Triangle.colorMap[i]).map(function(v, j) {
                if(!Triangle.gradientMap[i])return v;
                var c = Triangle.colorMap[i - 1][j];
                var g = Triangle.gradientMap[i];
                var r_v = Math.min(g, this.top - keys[i - 1]);
                var r_c = Math.max(0, keys[i - 1] + g - this.top);
                return (v*r_v + c*r_c)/g;
            }, this);
        }

        Triangle.heightColorMap[this.top] = color;

        var rgb = [color[0]*shade, color[1]*shade, color[2]*shade];

        return Phaser.Color.getColor.apply(null, rgb);
    },

    getValues: function() {
        return [this.points[0].elements[2], this.points[1].elements[2], this.points[2].elements[2]];
    },

    getTerrainValues: function() {
        return [Math.max(this.points[0].elements[2], 0), Math.max(this.points[1].elements[2], 0), Math.max(this.points[2].elements[2], 0)];
    },

    getNormalizedValues: function() {
        return [
            Math.min(this.points[0].elements[2] - this.bottom, 4),
            Math.min(this.points[1].elements[2] - this.bottom, 4),
            Math.min(this.points[2].elements[2] - this.bottom, 4)
        ];
    },

    getTerrainNormalizedValues: function() {
        var min = Math.max(0, this.bottom);
        return [
            Math.min(Math.max(this.points[0].elements[2],0) - min, 4),
            Math.min(Math.max(this.points[1].elements[2],0) - min, 4),
            Math.min(Math.max(this.points[2].elements[2],0) - min, 4)
        ];
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
        return [this.points[0].elements[2], this.points[1].elements[2], this.points[2].elements[2], this.points[2].elements[3]];
    },

    getTerrainValues: function() {
        return [
            Math.max(this.points[0].elements[2], 0),
            Math.max(this.points[1].elements[2], 0),
            Math.max(this.points[2].elements[2], 0),
            Math.max(this.points[3].elements[2], 0)
        ];
    },

    getNormalizedValues: function() {
        return [
            Math.min(this.points[0].elements[2] - this.bottom, 4),
            Math.min(this.points[1].elements[2] - this.bottom, 4),
            Math.min(this.points[2].elements[2] - this.bottom, 4),
            Math.min(this.points[3].elements[2] - this.bottom, 4)
        ];
    },

    getTerrainNormalizedValues: function() {
        var min = Math.max(0, this.bottom);
        return [
            Math.min(Math.max(this.points[0].elements[2],0) - min, 4),
            Math.min(Math.max(this.points[1].elements[2],0) - min, 4),
            Math.min(Math.max(this.points[2].elements[2],0) - min, 4),
            Math.min(Math.max(this.points[3].elements[2],0) - min, 4)
        ];
    },

    getType: function() {
        return this.getNormalizedValues().join('');
    },

    getTerrainType: function() {
        return this.getTerrainNormalizedValues().join('');
    },

    isBeach: function() {
        return (this.bottom <= 0) && (this.top > 0);
    },

    globalX: function() {
        return this.x+this.chunk.x*this.chunk.size;
    },

    globalY: function() {
        return this.y+this.chunk.y*this.chunk.size;
    }
};
