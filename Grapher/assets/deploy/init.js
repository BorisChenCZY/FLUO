console.log("123")
$.get("/teams", function (ret) {
    console.log(ret)
    for (var key in ret) {
        $("#team_list").append(
            '<option value="' + key + '">' + ret[key]["name"] + '</option>'
        );
    }
    console.log('finished');
});

$("#team_list").change(function () {
    var value = $("#team_list option:selected").val();
    var name = $("#team_list option:selected").text();
    get_channels(value, name);
    if ($('#collapseTwo').attr('class').indexOf("in") === -1) {
        $("#filter_button").click();
    }

});

$("#channel_group").on('select2:select', function (e) {
    console.log(e.params.data);
});


$('#daterange-1').on('apply.daterangepicker', function(ev, picker) {
  //do something, like clearing an input
  console.log(picker.startDate.format('YYYY-MM-DD'));
  console.log(picker.endDate.format('YYYY-MM-DD'));
  console.log(picker.startDate)
});

function open_sidebar(open_id, close_id) {
    if ($("#"+close_id).attr('class').indexOf('open') !== -1){
        $('#' + close_id).pxSidebar('toggle');
        $('#' + close_id).pxSidebar('update');
    }
    $('#' + open_id).pxSidebar('toggle');
    $('#' + open_id).pxSidebar('update');
    console.log('toggle version2')
}
