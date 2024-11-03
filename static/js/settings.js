function updateAvailableTournaments() {
  $.getJSON("/api/v1/tournaments/list", function (result) {
    result.forEach((result_item) => {
      $("#active-tournament-id").append(
        $("<option>").val(result_item["id"]).text(result_item["name"])
      );
    });
  });
  $.getJSON("/api/v1/tournaments/active", function (result) {
    $("#active-tournament-id").val(result["id"]);
  });
}
updateAvailableTournaments();

function cFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getAvailableWeightclasses() {
  $.getJSON("/api/v1/weightclasses/list", function (result) {
    result.forEach((r) => {
      $("#enabled-weightclasses").append(
        //<input type="checkbox" class="btn-check" id="btncheck1" autocomplete="off">
        //<label class="btn btn-outline-primary" for="btncheck1">Checkbox 1</label>
        $("<input>", {
          type: "checkbox",
          class: "btn-check",
          id: `btn-w-${r["weightclass"]}`,
          "data-wc": r["weightclass"],
          autocomplete: "off",
          checked: r["active"],
        }),
        $("<label>", {
          class: "btn btn-outline-light",
          for: `btn-w-${r["weightclass"]}`,
        }).text(r["weightclass"])
      );
      if (r["active"]) {
      $("#new-t-selector").append(
          // <h5 class="w-auto py-2 mb-0 pb-0 mt-auto">{WC} Finals</h5>
          // <select id="wc-final-tournament-id" class="form-select w-50 d-inline"></select>
          $("<div>", {class: "row d-flex justify-content-between align-items-baseline m-2"}).append(
            $("<h5>", {class: "w-auto py-2 mb-0 pb-0 mt-auto", "data-note": "(disabled)"}).text(`${cFirstLetter(r["weightclass"])}`),
            $("<select>", {id: `${r["wc"]}-t-id`, class: "form-select w-50 d-inline", disabled: ""})
          ),
          $("<div>", {class: "row d-flex justify-content-between align-items-baseline m-2"}).append(
            $("<h5>", {class: "w-auto py-2 mb-0 pb-0 mt-auto", "data-note": "(disabled)"}).text(`${cFirstLetter(r["weightclass"])} Finals`),
            $("<select>", {id: `${r["wc"]}-f-t-id`, class: "form-select w-50 d-inline", disabled: ""})
          )
        );
      }
    });
  });
}

var statuses = {};
$("#enabled-weightclasses").on("change", function (ev) {
  items = $("#enabled-weightclasses input");
  for (i = 0; i < items.length; i++) {
    statuses[items.eq(i).attr("id")] = items.eq(i).prop("checked");
  }
  console.log(statuses);
  if ($(ev.target).prop("checked") === false) {
    $.jpost(`/api/v1/weightclasses/disable/${$(ev.target).attr("data-wc")}`);
  } else {
    $.jpost(`/api/v1/weightclasses/enable/${$(ev.target).attr("data-wc")}`);
  }
});

getAvailableWeightclasses();
$("#active-tournament-id").change(function (ev) {
  ev.preventDefault();
  $.ajax({
    type: "POST",
    url: "/api/v1/tournaments/active",
    data: JSON.stringify({ id: $("#active-tournament-id").val() }),
    contentType: "application/json",
    dataType: "json",
  });
});

$.extend({
  jpost: function (url, body) {
    return $.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(body),
      contentType: "application/json",
      dataType: "json",
    });
  },
});
