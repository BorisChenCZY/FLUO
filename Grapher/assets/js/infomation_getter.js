function get_channels(team_id, fn) {
    console.log('get channels inside')
    $.get('channels/' + team_id, function (dict) {
        $('#channel_group').attr("label", team_id)
        for(var key in dict) {
          var value = dict[key];

          // do something with "key" and "value" variables

            console.log('changed!');
            console.log(value);
             $('#channel_group').append('<option value="'+key+'">'+value+'</option>')
        }
    })
}

function get_return(ret){
    return ret;
}
