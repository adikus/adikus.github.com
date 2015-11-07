TitleScreen = function(game) {};

TitleScreen.prototype = {
    preload: function() {
        var $seed = $('#seed');
        var $landPercentage = $('#land_percentage');
        var $mapSize = $('#map_size');


        if($seed.val() == '')$seed.val(localStorage.seed || '123456789');
        if($landPercentage.val() == '')$landPercentage.val(localStorage.landPercentage || '75');
        if($mapSize.val() == '')$mapSize.val(localStorage.mapSize || '400');
        $('#island').prop('checked', localStorage.isIsland == 'true');
    },

    create: function() {
        $('.start-button').click(function(){
            var settings = {fromHeightMap: $(this).attr('id') !== 'start'};
            $('.start').hide();

            game.state.start('loading', true, false, settings);
        });
    }
};