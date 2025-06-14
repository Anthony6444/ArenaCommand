function updateAvailableTournaments() {
  $.getJSON("/api/v1/tournaments/list", function (result) {
    ["#active-tournament-id-1", "#active-tournament-id-2"].forEach(function (
      selectId
    ) {
      $(selectId).empty();
      result.forEach((result_item) => {
        $(selectId).append(
          $("<option>").val(result_item["id"]).text(result_item["name"])
        );
      });
    });
  });
  $.getJSON("/api/v1/tournaments/active", function (result) {
    if (Array.isArray(result) && result.length > 0) {
      $("#active-tournament-id-1").val(result[0]["id"]);
      if (result.length > 1) {
        $("#active-tournament-id-2").val(result[1]["id"]);
      }
    }
  });
}
updateAvailableTournaments();

$("#active-tournament-id-1, #active-tournament-id-2").change(function (ev) {
  ev.preventDefault();
  const id1 = $("#active-tournament-id-1").val();
  const id2 = $("#active-tournament-id-2").val();
  const ids = [id1];
  if (id2 && id2 !== id1) ids.push(id2);
  $.ajax({
    type: "POST",
    url: "/api/v1/tournaments/active",
    data: JSON.stringify({ ids: ids }),
    contentType: "application/json",
    dataType: "json",
  });
});
