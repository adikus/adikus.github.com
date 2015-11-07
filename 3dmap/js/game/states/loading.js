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
            localStorage.mapSize = $('#map_size').val();
            localStorage.isIsland = $('#island').is(':checked') ? 'true' : 'false';
        }
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
            var mapSize = localStorage.mapSize;
            this.settings.allowCaching = mapSize <= (game.device.desktop ? 400 : 200);
            var baseChunkSize = game.device.desktop ? 20 : 10;
            var optimalChunkSize = ALLOW_PRELOAD ? baseChunkSize*2 : baseChunkSize;
            this.settings.chunkCount = Math.round(mapSize / optimalChunkSize);
            this.settings.chunkSize = Math.round(mapSize / this.settings.chunkCount);

            game.map.allowPreload = this.settings.allowCaching && ALLOW_PRELOAD;
            game.map.allowCaching = this.settings.allowCaching;
            game.map.init(this.settings.chunkSize, this.settings.chunkCount, localStorage.seed);

            this.globalScale = Math.min(this.settings.chunkSize*this.settings.chunkCount/400, 1);
            game.map.generator.addLayer(Math.round(200*this.globalScale), 4);
            game.map.generator.addLayer(Math.round(80*this.globalScale), 7);
            game.map.generator.addLayer(Math.round(20*this.globalScale), 15);
            game.map.generator.addLayer(Math.round(5*this.globalScale), 100);
        }

        game.minimap = new Minimap(game, uiGroup);

        if(localStorage.isIsland == 'true' && !this.settings.fromHeightMap) {
            game.map.generator.addIslandLayer(game.map.chunkSize * game.map.chunkCount);
        }

        this.loadingPhase = 0;

        this.settings.groups = {
            terrain: terrainGroup,
            overlay: terrainOverlayGroup,
            ui: uiGroup
        };

        this.text = game.add.text(250, 250, 'Loading...', { fill: '#ffffff' }, uiGroup);
        this.text.fixedToCamera = true;
    },

    update: function() {
        if(this.loadingPhase === 0){
            console.log('Generating terrain');
            this.text.text = 'Generating terrain...';
            game.map.generateAll();
            this.loadingPhase++;
        } else if(this.loadingPhase === 1){
            console.log('Normalizing terrain');
            this.text.text = 'Normalizing terrain...';
            game.map.generator.normalizeWater(localStorage.landPercentage);
            if(!this.settings.fromHeightMap){
                game.map.generator.normalizeHeight(this.globalScale);
                game.map.generator.applyHeightCurve();
            }

            this.loadingPhase++;
        } else if(this.loadingPhase === 2){
            console.log('Initializing chunks');
            this.text.text = 'Initializing chunks...';
            if(this.game.map.initializeChunks(this.game.map.chunkCount)) {
                if(game.map.allowPreload){
                    this.loadingPhase++;

                    game.world.setBounds(-10000, -10000, 20000, 20000);
                    game.camera.x = -500;
                    game.camera.y = -500;
                }else{
                    this.loadingPhase = 7;
                }
            }
        } else if(this.loadingPhase > 2 && this.loadingPhase < 7){
            game.isoProjector.rotate(Math.PI/2);
            console.log('Pre-rendering chunks at', game.isoProjector.angle);
            this.text.text = 'Pre-rendering chunks '+ (this.loadingPhase - 2) +'/4';

            game.map.forEachChunkCoord(function (i, j) {
                var chunk = game.map.getChunk(i, j);
                chunk.rotate();
                chunk.show();
            });
            game.map.terrainGroup.sort('depth');
            var nextPhase = this.loadingPhase + 1;
            var self = this;

            setTimeout(function() { self.loadingPhase = nextPhase; }, 50);
            this.loadingPhase = 99;
        } else if(this.loadingPhase === 7){
            game.map.terrainGroup.sort('depth');
            this.text.destroy();

            game.state.start('game', false, false, this.settings);
        }
    }
};