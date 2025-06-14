$(document).on("mouseover mouseout", "tr", function (event) {
  if (event.type == "mouseover") {
    cur_target = event.target;
    while (1) {
      if (cur_target.tagName != "TR") {
        cur_target = cur_target.parentElement;
      } else {
        break;
      }
    }
    // console.log(cur_target);
    // console.log($(cur_target).children(".rle-edit-button-container").children("button.edit-button"))
    $(
      $(cur_target)
        .children(".rle-edit-button-container")
        .children("button.edit-button")
    ).removeClass("invisible");
  } else if (event.type == "mouseout") {
    cur_target = event.target;
    while (1) {
      if (cur_target.tagName != "TR") {
        cur_target = cur_target.parentElement;
      } else {
        break;
      }
    }
    $(
      $(cur_target)
        .children(".rle-edit-button-container")
        .children("button.edit-button")
    ).addClass("invisible");
  }
});
$(document).on("click", ".edit-button", function (event) {
  cur_target = event.target;
  while (1) {
    if (cur_target.tagName != "BUTTON") {
      cur_target = cur_target.parentElement;
    } else {
      break;
    }
  }
  tr = cur_target.parentElement.parentElement;

  $("#form-robot-name").val(
    $("#" + tr.id + "-robot-name")
      .text()
      .trim()
  );
  $("#form-title-robot-name").text(
    $("#" + tr.id + "-robot-name")
      .text()
      .trim()
  );
  $("#form-team-name").val(
    $("#" + tr.id + "-team-name")
      .text()
      .trim()
  );
  $("#form-flavortext").val(
    $("#" + tr.id + "-flavortext")
      .text()
      .trim()
  );
  $("#form-weightclass").val(
    $("#" + tr.id + "-weightclass")
      .text()
      .trim()
  );
  $("#form-rank").val(
    $("#" + tr.id + "-rank")
      .text()
      .trim()
  );
  $("#form-elo").val(
    $("#" + tr.id + "-elo")
      .text()
      .trim()
  );
  $("#form-last-tournament").val(
    $("#" + tr.id + "-last-tournament")
      .text()
      .trim()
  );
  $("#form-record-career").val(
    $("#" + tr.id + "-record-career")
      .text()
      .trim()
  );
  $("#form-record-year").val(
    $("#" + tr.id + "-record-year")
      .text()
      .trim()
  );
  $("#form-id").val(
    $("#" + tr.id + "-id")
      .text()
      .trim()
  );
});
function populateRobotEditableList() {
  $.get(
    "/static/rle-boilerplate.html",
    (success = function (result) {
      rle_boilerplate = result;
      $.get(
        "/api/v1/list/all",
        (success = function (result) {
          robot_editable_list = "";
          for (i = 0; i < result.length; i++) {
            this_robot = $("<div>").html(
              rle_boilerplate
                .replaceAll("{i}", i.toString())
                .replaceAll("{robot_name}", result[i]["name"])
                .replaceAll("{id}", result[i]["id"])
                .replaceAll("{team_name}", result[i]["teamname"])
                .replaceAll(
                  "{weightclass}",
                  result[i]["weightclass"].toUpperCase()
                )
                .replaceAll("{flavortext}", result[i]["flavortext"])
                .replaceAll(
                  "{record}",
                  result[i]["record"]
                    ? result[i]["record"].split("-").slice(0, 2).join("-")
                    : ""
                )
                .replaceAll("{rank}", result[i]["rank"])
                .replaceAll("{elo}", result[i]["elo"])
                .replaceAll("{last_tournament}", result[i]["last_tournament"])
                .replaceAll("{record_career}", result[i]["record_career"])
                .replaceAll("{record_year}", result[i]["record_year"])
            );
            // console.log(this_robot.html());
            if (result[i]["imagestatus"] == "ok") {
              this_robot
                .children("tr")
                .children("td")
                .children("#rle-image-ok")
                .removeClass("hidden");
            } else if (result[i]["imagestatus"] == "warn") {
              this_robot
                .children("tr")
                .children("td")
                .children("#rle-image-warn")
                .removeClass("hidden");
            } else if (result[i]["imagestatus"] == "error") {
              this_robot
                .children("tr")
                .children("td")
                .children("#rle-image-error")
                .removeClass("hidden");
            } else {
            }
            if (result[i]["existsinchallonge"]) {
              this_robot
                .children("tr")
                .children("td")
                .children("#rle-ch-ok")
                .removeClass("hidden");
            } else {
              this_robot
                .children("tr")
                .children("td")
                .children("#rle-ch-error")
                .removeClass("hidden");
            }
            robot_editable_list += this_robot.html();
          }
          $("#rle-container").html(robot_editable_list);
          var tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
          );
          var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
          });
        })
      );
    })
  );
}
populateRobotEditableList();

function updateColumnHeadersIfExist() {
  if ($("#csv-file").prop("files").length > 0) {
    var fileReader = new FileReader();
    var data;
    fileReader.onload = function () {
      data = fileReader.result;
      csvdata = $.csv.toArrays(data);
      //   console.log(csvdata)
      $(".csv-header-select").each(function (index, element) {
        $(this).text("");
        csvdata[0].forEach((row) => {
          new_option = $("<option>");
          new_option
            .val(row)
            .text(row.length < 50 ? row : row.slice(0, 50) + "...");
          element.append(new_option[0]);
        });
      });
    };
    fileReader.readAsText($("#csv-file").prop("files")[0]);
  }
}

$("#csv-file").change(function (event) {
  updateColumnHeadersIfExist();
});

$("#csv-replace-list").click(function (event) {
  if ($("#csv-file").prop("files").length > 0) {
    var fileReader = new FileReader();
    var data;
    fileReader.onload = function () {
      data = fileReader.result;
      csvdata = $.csv.toArrays(data);
      send_data = {};
      send_data["has_headers"] = $("#csv-has-headers").is(":checked");
      send_data["key"] = {
        robot_name: csvdata[0].indexOf($("#select-robot-name").val()),
        team_name: csvdata[0].indexOf($("#select-team-name").val()),
        weightclass: csvdata[0].indexOf($("#select-weightclass").val()),
        flavortext: csvdata[0].indexOf($("#select-flavortext").val()),
        rank: csvdata[0].indexOf($("#select-rank").val()),
        elo: csvdata[0].indexOf($("#select-elo").val()),
        last_tournament: csvdata[0].indexOf($("#select-last-tournament").val()),
        record_career: csvdata[0].indexOf($("#select-career-record").val()),
        record_year: csvdata[0].indexOf($("#select-year-record").val()),
      };
      send_data["content"] = csvdata;
      console.log(send_data);
      $.ajax({
        type: "POST",
        url: "/api/v1/robots/list/replace",
        data: JSON.stringify(send_data),
        contentType: "application/json",
        dataType: "json",
      });
    };
    fileReader.readAsText($("#csv-file").prop("files")[0]);
    setTimeout(populateRobotEditableList, 250);
    $("#load-csv-modal").modal("toggle");
  } else {
  }
});

$("#edit-save-robot").click(function (event) {
  $.ajax({
    type: "POST",
    contentType: "application/json",
    dataType: "json",
    url: "/api/v1/robots/edit/" + $("#form-id").val(),
    data: JSON.stringify({
      name: $("#form-robot-name").val(),
      teamname: $("#form-team-name").val(),
      flavortext: $("#form-flavortext").val(),
      weightclass: $("#form-weightclass").val(),
      rank: $("#form-rank").val(),
      elo: $("#form-elo").val(),
      last_tournament: $("#form-last-tournament").val(),
      record_career: $("#form-record-career").val(),
      record_year: $("#form-record-year").val(),
    }),
  });
  $("#edit-robot-modal").modal("toggle");
  populateRobotEditableList();
});

$("#new-save-robot").click(function (event) {
  $.ajax({
    type: "POST",
    contentType: "application/json",
    dataType: "json",
    url: "/api/v1/robots/new",
    data: JSON.stringify({
      name: $("#new-form-robot-name").val(),
      teamname: $("#new-form-team-name").val(),
      flavortext: $("#new-form-flavortext").val(),
      weightclass: $("#new-form-weightclass").val(),
      rank: $("#new-form-rank").val(),
      elo: $("#new-form-elo").val(),
      last_tournament: $("#new-form-last-tournament").val(),
      record_career: $("#new-form-record-career").val(),
      record_year: $("#new-form-record-year").val(),
    }),
  });
  $("#new-robot-modal").modal("toggle");
  populateRobotEditableList();
});

$("#edit-delete-robot").click(function (event) {
  $.ajax({
    type: "DELETE",
    url: "/api/v1/robots/delete/" + $("#form-id").val(),
  });
  $("#edit-robot-modal").modal("toggle");
  populateRobotEditableList();
});

$("#action-clear").click(function (event) {
  $.ajax({
    type: "DELETE",
    url: "/api/v1/robots/list/clear",
  });
  populateRobotEditableList();
});
