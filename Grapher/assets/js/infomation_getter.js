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

function get_person(id) {
    $.getJSON('/person/' + id, function (ret) {
        console.log(ret)
        var image = ret["img_192"];
        $("#person_profile .image").attr('src', image);
        $("#person_profile .name").html(ret["first_name"] + ' ' + ret["last_name"]);
        $("#person_profile .id").html('@' + ret["username"]);
        $("#person_profile .message_number strong").html(Object.keys(ret["messages"]).length);
        $("#person_profile .mention strong").html(ret['mention']);
        $("#person_profile .weight strong").html(new Intl.NumberFormat('en-US', {minimumFractionDigits: 3}).format(ret['weight']));

        var messge_list = "";
        console.log(ret['mentions'])
        for (var message in (ret['messages'])) {
            if (!ret['messages'][message]['channel_name'])
                continue
            messge_list += '<div class="widget-messages-alt-item ">'
            var channel = (ret['messages'][message]['channel_name']);
            var text = String(ret['messages'][message]['text']);
            var ts = (ret['messages'][message]['ts']);
            var date = new Date(ts * 1e3)
            var options = { year: '2-digit', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit' };
            var americanDateTime = new Intl.DateTimeFormat('en-US', options).format;

                date = americanDateTime(date);

            messge_list += '<img src="' + image + '" class="widget-messages-alt-avatar"/>'+
                "<div>"+text+'</div>'+
            '<div class="widget-messages-alt-description">from <a href="#">' + channel + '</a></div>'+
            '<div class="widget-messages-alt-date">'+date+ '</div>'
            messge_list += '</div>'
        }
        $("#person_profile .message_list").html(messge_list);
    });
}
