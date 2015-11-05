Loading = function(game) {};

Loading.prototype = {
    init: function(settings) {
        this.settings = settings;
    },

    preload: function() {
        if(this.settings.fromHeightMap){
            game.load.image('map', 'assets/height_map600.png');

            this.settings.heightOffset = 10;
        } else {
            localStorage.seed = $('#seed').val();
            localStorage.offset = $('#height_offset').val();
            localStorage.chunkCount = $('#chunk_count').val();

            this.settings.heightOffset = parseInt(localStorage.offset);
        }

        this.settings.chunkSize = game.device.desktop ? 20 : 10;
    },

    create: function() {
        var light = $V([0,0.5,1]);
        game.isoProjector = new IsoProjector(game, light);

        if(this.settings.fromHeightMap){
            game.map = Map.createFromHeightMap(game, this.settings.chunkSize, game.cache.getImage('map'), 50);
        }else{
            var count = parseInt(localStorage.chunkCount);
            game.map = new Map(game, this.settings.chunkSize, count, localStorage.seed);

            game.map.generator.addLayer(200, 4);
            game.map.generator.addLayer(80, 7);
            game.map.generator.addLayer(20, 15);
            game.map.generator.addLayer(5, 100);
        }
        game.map.generator.heightOffset = this.settings.heightOffset;

        game.minimap = new Minimap(game);

        game.map.generateAll();
    },

    update: function() {
        if(this.game.map.initializeChunks(this.game.map.chunkCount)){
            game.state.start('game', false, false, this.settings);
        }
    }
};