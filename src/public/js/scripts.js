$('#spinner-loading').hide()

$('form').submit(() => {
    spinngLoading(true)
});

function spinngLoading(status){
    $('#app-root').attr('disabled', status);
    if(status == true){
        $("div").on("keydown keypress keyup click contextmenu", false);
        $('#spinner-loading').show()
    }else{
        $( "div" ).off();
        $('#spinner-loading').hide()
    }
}