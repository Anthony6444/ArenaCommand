var fields = [
    "name",
    "teamname",
    "flavortext",
    "weightclass",
    // "record",
]
var buttonPushedId = null;
var fightcardSelectedId = null;
function getCurrentRobotDetails(color) {
    for (i = 0; i < fields.length; i++) {
        $.ajax({
            url: "/api/v1/active/current/" + color + "/" + fields[i],
            success: function (result) {
                $("#" + color + "-" + result["field"]).html(result["text"]);
            }
        });
    }
}
function getUpNextRobotDetails(color) {
    for (i = 0; i < fields.length - 3; i++) {
        $.ajax({
            url: "/api/v1/active/next/" + color + "/" + fields[i],
            success: function (result) {
                $("#next-" + color + "-" + result["field"]).html(result["text"]);
            }
        });
    }
}
function populateRobotList() {
    $.get("/api/v1/list/all", success = function (result) {
        for (j = 0; j < result.length; j++) {
            button = $("<span>", { "id": "card" + j, "class": "card selector-card m-2 clickable row" });
            // console.log(result[j]["weightclass"])
            if (result[j]["weightclass"] == "antweight") {
                button.html("<p class=\"no-padding\"><i class=\"fa fa-car\" aria-hidden=\"true\"></i>&nbsp;" + result[j]["name"] + "</p>")
                $("#ant-list").append(button)
            } else if (result[j]["weightclass"] == "beetleweight") {
                button.html("<p class=\"no-padding\"><i class=\"fa fa-truck\" aria-hidden=\"true\"></i>&nbsp;" + result[j]["name"] + "</p>")
                $("#beetle-list").append(button)
            }
            // console.log(button)
            // $("#beetle-list").append($("<button>", ))
            // button.text(result[j]["name"])

        }
    })
}
function waitForRobotSelectedUpdateFightcard() {
    if (buttonPushedId != null) {
        // console.log(buttonPushedId, ";", fightcardSelectedId, ";")
        robot_name = $("#" + buttonPushedId).text();
        if (fightcardSelectedId == "current-blue") {
            $.jpost("/api/v1/set/current/blue", data = { "robot_name": robot_name })
        }
        else if (fightcardSelectedId == "current-red") {
            $.jpost("/api/v1/set/current/red", data = { "robot_name": robot_name })
        }
        else if (fightcardSelectedId == "next-blue") {
            $.jpost("/api/v1/set/next/blue", data = { "robot_name": robot_name })
        }
        else if (fightcardSelectedId == "next-red") {
            $.jpost("/api/v1/set/next/red", data = { "robot_name": robot_name })
        }
        else {
            console.log("invalid fightcard selected")
        }
        buttonPushedId = null;
        fightcardSelectedId = null;
        updateRobotDetails();
    } else {
        setTimeout(waitForRobotSelectedUpdateFightcard, 250)
    }
}
$(document).on("click", ".fightcard", function (event) {
    id = event.target.id.toString();
    if (event.target.tagName != "DIV") {
        id = event.target.parentElement.id.toString();
    }
    // console.log(id);
    fightcardSelectedId = id;
    openOverlay();
    waitForRobotSelectedUpdateFightcard();
});
$(document).on("click", ".clickable", function (event) {
    id = event.target.id.toString();
    if (event.target.tagName == "P") {
        id = event.target.parentElement.id.toString();
    }
    else if (event.target.tagName == "I") {
        id = event.target.parentElement.parentElement.id.toString();
    }
    // console.log(id);
    buttonPushedId = id;
    closeOverlay();
});
$(document).on("click", ".fightcard", function (event) {
    openOverlay();
});
$("#shiftbutton").on("click", function () {
    $.post("/api/v1/advance", success = function () {
        updateRobotDetails();
    })
})
$("#grudge-button").on("click", function(event) {
    $.post("/api/v1/special/grudge/"+$("#special-match-weightclass").val());
    updateRobotDetails();
});
$("#rumble-button").on("click", function(event) {
    $.post("/api/v1/special/rumble/"+$("#special-match-weightclass").val());
    updateRobotDetails();
});
function openOverlay() {
    document.getElementById('bot-selector').classList.add('active');
}

function closeOverlay() {
    document.getElementById('bot-selector').classList.remove('active');
}
function updateRobotDetails() {
    getCurrentRobotDetails("blue");
    getCurrentRobotDetails("red");
    getUpNextRobotDetails("blue");
    getUpNextRobotDetails("red");
    if ($("#red-weightclass").text() != $("#blue-weightclass").text()) {
        $("#weightclass-top").text("");
        // $("#weight-mismatch-main").removeClass("hidden");
    } else {
        // $("#weightclass-top").text($("#red-weightclass").text());
        $("#weight-mismatch-main").addClass("hidden");
    }
}
updateRobotDetails();
populateRobotList();
$.extend({
    jpost: function (url, body) {
        return $.ajax({
            type: 'POST',
            url: url,
            data: JSON.stringify(body),
            contentType: "application/json",
            dataType: 'json'
        });
    }
});