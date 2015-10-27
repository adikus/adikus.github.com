Polygon = function(p1, p2, p3, p4) {

    var poly = {
        i: p1.elements[0],
        j: p1.elements[1],
        z: 0,
        points: [p1, p2, p3, p4],
        rotatedPoints: [p1, p2, p3, p4],

        initSylvester: function() {
            this.plane1 = $P(p1, p2, p3);
            this.plane2 = $P(p1, p3, p4);
            this.normal1 = this.plane1.normal;
            this.normal2 = this.plane2.normal;
            this.color = Math.min(Math.abs(this.getColor(light)/2),1);
            this.color2 = Math.min(Math.abs(this.getColor2(light)/2),1);
        },

        getColor: function(light) {
            return light.dot(this.normal1);
        },

        getColor2: function(light) {
            return light.dot(this.normal2);
        },

        getType: function() {
            var values = _(this.points).map(function(p) { return p.elements[2]*2; });
            var min = _(values).min();
            this.z = min;
            return _(values).map(function(v) { return _([v - min, 4]).min(); }).join('');
        },

        phaserPoints: function() {
            var x = 0;//this.rotatedPoints[0].elements[0];
            var y = 0;//this.rotatedPoints[0].elements[1];
            return _(this.rotatedPoints).map(function (point) {
                return new Phaser.Point((point.elements[0]-x), (point.elements[1]-y));
            });
        },

        isoRotate: function() {
            var x = $V(p1.elements);
            x.elements[2] = _(_(this.points).map(function(p) { return p.elements[2]; })).min();
            //var x = p1.elements[0];
            //var y = p1.elements[1];

            var axis1 = $L([0,0,0], [0,0,1]);
            var axis2 = $L([0,0,0], [1,0,0]);
            this.rotatedPoints = _(this.points).map(function (point) {
                return point.subtract(x).x(51).rotate(Math.PI/4, axis1).rotate(Math.PI/3, axis2);
            });
        }
    };

    poly.initSylvester();

    return poly;
};
