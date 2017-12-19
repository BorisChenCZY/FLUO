function get_channels(team_id, team_name, fn) {
    console.log('get channels inside')
    $('#channel_group').html("");
    $('#status_bar').html("retriving" + team_name);
    $('#status_bar_large').html("retriving" + team_name);
    $('#channel_group').select2({'placeholder': 'retriving data, please wait....'}).trigger('change');
    $('#channel_group').append('<optgroup label="' + 'retriving data, please wait....' + '">').trigger('change');
    $('#channel_group').append('</optgroup>').trigger('change');
    $.get('channels/' + team_id, function (dict) {
        $('#channel_group').html("");
        $('#channel_group').select2('close');
        $('#channel_group').val(null).trigger('change');
        $('#channel_group').append('<optgroup label="' + team_name + '">').trigger('change');
        var length = Object.keys(dict).length;
        if (length === 0){
            $('#channel_group').select2({'placeholder': 'No channels found'})
            $('#channel_group').append('<option value="NULL" disabled>' + 'No channels found' + '</option>').trigger('change');
        }else {
            $('#channel_group').select2({'placeholder': 'Select value'}).trigger('change');
            for (var key in dict) {
                var value = dict[key];
                $('#channel_group').append('<option value="' + key + '">' + value + '</option>').trigger('change');
            }
            ;
        }

        $('#channel_group').append('</optgroup>').trigger('change');
        console.log('refreshed', team_id)
        $('#status_bar').html(team_name);
        $('#status_bar_large').html(team_name);
    })
}

function get_return(ret) {
    return ret;
}
