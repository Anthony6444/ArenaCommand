function updateAvailableTournaments() {
    $.getJSON(
        "/api/v1/tournaments/list",
        function (result) {
            result.forEach(result_item => {
                $("#active-tournament-id").append(
                    $("<option>").val(result_item["id"]).text(result_item["name"])
                )
            }
            );
        })
    $.getJSON(
        "/api/v1/tournaments/active",
        function(result) {
            $("#active-tournament-id").val(result["id"])
        }
    );
}
updateAvailableTournaments();

$("#active-tournament-id").change(function(ev){
    ev.preventDefault();
    $.ajax({
        type: "POST",
        url: "/api/v1/tournaments/active",
        data: JSON.stringify({id: $("#active-tournament-id").val()}),
        contentType: "application/json",
        dataType: "json",
    });
})