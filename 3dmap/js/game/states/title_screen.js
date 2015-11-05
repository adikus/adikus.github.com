TitleScreen = function(game) {};

TitleScreen.prototype = {
    preload: function() {
        var $seed = $('#seed');
        var $heightOffset = $('#height_offset');
        var $chunkCount = $('#chunk_count');


        if($seed.val() == '')$seed.val(localStorage.seed || '123456789');
        if($heightOffset.val() == '')$heightOffset.val(localStorage.offset || '-50');
        if($chunkCount.val() == '')$chunkCount.val(localStorage.chunkCount || '20');
    },

    create: function() {
        $('.start-button').click(function(){
            var settings = {fromHeightMap: $(this).attr('id') !== 'start'};
            $('.start').hide();

            game.state.start('loading', true, false, settings);
        });
    }
};