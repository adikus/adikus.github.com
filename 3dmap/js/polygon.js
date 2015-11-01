Polygon = function(p1, p2, p3, p4) {

    var poly = {
        i: p1.elements[0],
        j: p1.elements[1],
        points: [p1, p2, p3, p4],

        initSylvester: function() {
            this.plane1 = $P(p1, p2, p3);
            this.plane2 = $P(p1, p3, p4);
            this.color = this.getColor(this.plane1.normal);
            this.color2 = this.getColor(this.plane2.normal);

            this.z = _(this.getValues()).min();
            this.top = _(this.getValues()).max();
        },

        getColor: function(normal) {
            var color = Math.min(Math.abs(light.dot(normal)/2),1);
            color = 0.90*color+0.10;
            return Phaser.Color.getColor(0.2*255*color,255*color,0.5*255*color);
        },

        getValues: function() { return _(this.points).map(function(p) { return p.elements[2]; }); },

        getNormalizedValues: function() { return _(this.getValues()).map(function(v) { return _([v - this.z, 4]).min(); }, this) },

        getType: function() {
            return this.getNormalizedValues().join('');
        }
    };

    poly.initSylvester();

    return poly;
};
