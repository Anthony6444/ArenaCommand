var fields = [
    "name",
    "teamname",
    "flavortext",
    "weightclass",
    // "record",
]
var positions = [
    "current",
    "next",
    "standby"
]
var colors = [
    "red",
    "blue"
]
var buttonPushedId = null;
var fightcardSelectedId = null;

function getAllRobotDetails() { 
    for (k=0; k<colors.length; k++){    
        for (j=0; j < positions.length; j++) {
            for (i = 0; i < fields.length; i++) {
                const wrapper = {
                    color: colors[k],
                    position: positions[j],
                    field: fields[i],
                    fetchAndHandleData: function () {
                        $.ajax({
                            url: "/api/v1/active/"+ this.position +"/" + this.color + "/" + this.field,
                            success: $.proxy(function (result) {
                                $("#" + this.position + "-" + this.color + "-" + this.field).html(result["text"] == "" ? "&nbsp;" : result["text"]);
                                if (this.field == "weightclass") {
                                    wci = result["text"].charAt(0).toUpperCase();
                                    wci = wci == "U" ? "" : wci; 
                                    $("#" + this.position + "-" + this.color).attr("data-sc-wc", wci);
                                }
                            }, this)
                        });
                    }
                }
                wrapper.fetchAndHandleData();
            }
        }
    }
 }

function populateRobotList() {
    $.get("/api/v1/list/all", success = function (result) {
        for (j = 0; j < result.length; j++) {
            button = $("<div>", { "id": "card" + j, "class": "card selector-card m-2 clickable row", "data-robot-id": result[j]["id"]});
            // console.log(result[j]["weightclass"])
            if (result[j]["weightclass"].toLowerCase() == "antweight") {
                button.html("<p class=\"no-padding\"><i class=\"fa fa-car\" aria-hidden=\"true\"></i>&nbsp;" + result[j]["name"] + "</p>")
                $("#ant-list").append(button);
            } else if (result[j]["weightclass"].toLowerCase() == "beetleweight") {
                button.html("<p class=\"no-padding\"><i class=\"fa fa-truck\" aria-hidden=\"true\"></i>&nbsp;" + result[j]["name"] + "</p>")
                $("#beetle-list").append(button);
            }
            else {
                console.log("ERROR: " + result[j]["name"]);
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
        robot_id = $("#" + buttonPushedId).attr("data-robot-id");
        if (fightcardSelectedId == "current-blue") {
            $.jpost("/api/v1/set/current/blue", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "current-red") {
            $.jpost("/api/v1/set/current/red", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "next-blue") {
            $.jpost("/api/v1/set/next/blue", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "next-red") {
            $.jpost("/api/v1/set/next/red", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "standby-blue") {
            $.jpost("/api/v1/set/standby/blue", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "standby-red") {
            $.jpost("/api/v1/set/standby/red", data = { "robot_id": robot_id })
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
    getAllRobotDetails(); 
    setTimeout(
        function(){
            for (i=0; i < positions.length; i++) {
                if ($(`#${positions[i]}-blue-weightclass`).text() == $(`#${positions[i]}-red-weightclass`).text() 
                        || $(`#${positions[i]}-blue-weightclass`).text() == "unset"
                        || $(`#${positions[i]}-red-weightclass`).text() == "unset") {
                    console.log(`#${positions[i]}-mismatch`)
                    $(`#${positions[i]}-mismatch`).addClass("hidden");
                } else {
                    $(`#${positions[i]}-mismatch`).removeClass("hidden");
                }
            }
        }, 500);
    }
updateRobotDetails();
// setInterval(updateRobotDetails, 10000)
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