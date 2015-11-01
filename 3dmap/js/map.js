Map = function(chunkSize, chunkCount, seed) {
    this.generator = new MapGenerator(seed);

    this._initializeChunks(chunkSize, chunkCount);
};

Map.prototype = {
    _initializeChunks: function(chunkSize, chunkCount) {
        this._chunks = [];

        this._chunkSize = chunkSize;
        this._chunkCount = chunkCount;

        this.forEachChunkCoord(function (i, j) {
            if(!this._chunks[i])this._chunks[i] = [];
            this._chunks[i][j] = new Chunk(this.generator, this._chunkSize, i, j);
        }, this);
    },

    forEachChunkCoord: function(call, ctx) {
        for(var i = 0; i < this._chunkCount; i++) {
            for (var j = 0; j < this._chunkCount; j++) {
                call.call(ctx || this, i, j);
            }
        }
    },

    getChunk: function(x, y){
        return this._chunks[x] && this._chunks[x][y];
    }
};
