define(function(){
    $('#filterOpen').click(function(){

        if($('.drawer').hasClass('is-visible')){
            $('.drawer').removeClass('is-visible');
            $('#filterOpen').removeClass('filter-open');
        }
        else{
            $('.drawer').addClass('is-visible');
            $('#filterOpen').addClass('filter-open');
        }
    });
});