Loading = function(game) {};

Loading.prototype = {
    init: function(settings) {
        this.settings = settings;
    },

    preload: function() {
        if(this.settings.fromHeightMap){
            game.load.image('map', 'assets/height_map600.png');

            localStorage.landPercentage = $('#land_percentage').val();
        } else {
            localStorage.seed = $('#seed').val();
            localStorage.landPercentage = $('#land_percentage').val();
            localStorage.chunkCount = $('#chunk_count').val();
            localStorage.isIsland = $('#island').is(':checked') ? 'true' : 'false';
        }

        this.settings.chunkSize = game.device.desktop ? 20 : 10;
    },

    create: function() {
        var light = $V([0,0.5,1]);
        game.isoProjector = new IsoProjector(game, light);

        var terrainGroup = game.add.group();
        var terrainOverlayGroup = game.add.group();
        var uiGroup = game.add.group();

        game.map = new Map(game, terrainGroup);

        if(this.settings.fromHeightMap){
            game.map.initFromHeightMap(this.settings.chunkSize, game.cache.getImage('map'), 75);
        }else{
            var count = parseInt(localStorage.chunkCount);
            game.map.init(this.settings.chunkSize, count, localStorage.seed);

            game.map.generator.addLayer(200, 4);
            game.map.generator.addLayer(80, 7);
            game.map.generator.addLayer(20, 15);
            game.map.generator.addLayer(5, 100);
        }

        game.minimap = new Minimap(game, uiGroup);

        if(localStorage.isIsland == 'true' && !this.settings.fromHeightMap) {
            game.map.generator.addIslandLayer(game.map.chunkSize * game.map.chunkCount);
        }

        game.map.generateAll();

        game.map.generator.normalizeWater(localStorage.landPercentage);
        if(!this.settings.fromHeightMap){
            game.map.generator.normalizeHeight();
            game.map.generator.applyHeightCurve();
        }

        this.settings.groups = {
            terrain: terrainGroup,
            overlay: terrainOverlayGroup,
            ui: uiGroup
        };
    },

    update: function() {
        if(this.game.map.initializeChunks(this.game.map.chunkCount)){
            game.state.start('game', false, false, this.settings);
        }
    }
};