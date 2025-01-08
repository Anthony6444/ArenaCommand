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
    "standby",
    "extra1",
    "extra2"
]
var colors = [
    "red",
    "blue"
]

var robots = [];

var selectedRobotId = null;
var fightcardSelectedId = null;
let currentFightcardRowIndex=-1;

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


 function fetchRobotListFromServer() {
    $.get("/api/v1/list/all", success = function (result) {
        for (j = 0; j < result.length; j++) {
            robots[j] = result[j];
            // console.log(row);
            // console.log(button)
            // $("#beetle-list").append($("<button>", ))
            // button.text(result[j]["name"])

        }
    });
    console.log(robots);
    populateRobotList(robots);
 }

function populateRobotList(robotArray = robots) {
    $("#bot-list").html("");
    for (i=0; i<robotArray.length; i++) {
        row = $("<tr>", { "id": "row" + i, "class": "", "data-robot-id": robotArray[i]["id"], "tabindex": "0", "data-row-index": i});
        char = robotArray[i]["weightclass"].charAt(0).toUpperCase();
        row.html(`<td data-wc="${char}" class="${char == "A" ? "ant" : "beetle"}"></td><td>${robotArray[i]["name"]}</td><td>${robotArray[i]["teamname"]}</td>`);
        $("#bot-list").append(row);
    }
}

function populateRobotListSortOnSearchTerm(searchTerm) {
    const options = {
        includeScore: true,          // Include score to sort by similarity
        threshold: 0.3,              // Fuzzy matching sensitivity
        ignoreLocation: true,
        keys: ["name", "teamname"]               // Only search within the "name" property
    };

    // Initialize Fuse with the array and options
    const fuse = new Fuse(robots, options);

    // Perform the fuzzy search
    const results = fuse.search(searchTerm);
    // Extract sorted array of objects based on search term
    const sortedArray = results.map(result => result.item);

    console.log(sortedArray);
    populateRobotList(sortedArray);
}

function waitForRobotSelectedUpdateFightcard() {
    if (selectedRobotId != null) {
        console.log(selectedRobotId, ";", fightcardSelectedId, ";")
        robot_id= selectedRobotId;
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
        else if (fightcardSelectedId == "extra1-blue") {
            $.jpost("/api/v1/set/extra1/blue", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "extra1-red") {
            $.jpost("/api/v1/set/extra1/red", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "extra2-blue") {
            $.jpost("/api/v1/set/extra2/blue", data = { "robot_id": robot_id })
        }
        else if (fightcardSelectedId == "extra2-red") {
            $.jpost("/api/v1/set/extra2/red", data = { "robot_id": robot_id })
        }
        else {
            console.log("invalid fightcard selected")
        }
        selectedRobotId = null;
        fightcardSelectedId = null;
        updateRobotDetails();
    } else {
        setTimeout(waitForRobotSelectedUpdateFightcard, 350)
    }
}
$(document).on("click", ".fightcard", function (event) {
    id = event.target.id.toString();
    if (event.target.tagName != "DIV") {
        id = event.target.parentElement.id.toString();
    }
    // console.log(id);
    fightcardSelectedId = id;
    $("#botselectormodal").modal("toggle");
    waitForRobotSelectedUpdateFightcard();
});
$("#shift-all-button").on("click", function () {
    $.post("/api/v1/queue/advance", success = function () {
        updateRobotDetails();
    })
});

$("#skip-next-match").on("click", function () {
    $.post("/api/v1/queue/remove/next", success = function () {
        updateRobotDetails();
    })
});
$("#skip-standby-match").on("click", function () {
    $.post("/api/v1/queue/remove/standby", success = function () {
        updateRobotDetails();
    })
});

$("#grudge-button").on("click", function(event) {
    $.post("/api/v1/special/grudge/"+$("#special-match-weightclass").val());
    updateRobotDetails();
});
$("#rumble-button").on("click", function(event) {
    $.post("/api/v1/special/rumble/"+$("#special-match-weightclass").val());
    updateRobotDetails();
});

$("#botselectormodal").on("shown.bs.modal", () => {
    $("#search-term").focus();
    $("#search-term").val("");
    populateRobotList(robots);
})

function updateRobotDetails() {
    getAllRobotDetails(); 
    setTimeout(
        function(){
            for (i=0; i < positions.length; i++) {
                if ($(`#${positions[i]}-blue-weightclass`).text() == $(`#${positions[i]}-red-weightclass`).text() 
                        || $(`#${positions[i]}-blue-weightclass`).text() == "unset"
                        || $(`#${positions[i]}-red-weightclass`).text() == "unset") {
                    // console.log(`#${positions[i]}-mismatch`)
                    $(`#${positions[i]}-mismatch`).addClass("hidden");
                } else {
                    $(`#${positions[i]}-mismatch`).removeClass("hidden");
                }
            }
        }, 500);
    }
updateRobotDetails();
// setInterval(updateRobotDetails, 10000)
fetchRobotListFromServer();

$("#bot-list").on("keydown", function(ev) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        var items = $("#bot-list tr")
        ev.preventDefault();
        if (currentFightcardRowIndex == 0 && ev.key === "ArrowUp") {
            setTimeout(() => {$("#search-term").focus()}, 30); // wacky i know but apparently the timeout is necessary
        } else if (currentFightcardRowIndex == (items.length - 1) && ev.key === "ArrowDown") {
            // nothing
        } else {
            currentFightcardRowIndex = currentFightcardRowIndex + ( ev.key === "ArrowDown" ? 1 : -1 );
        }
        items.eq(currentFightcardRowIndex).focus();
    } else if (ev.key == "Enter") {
        selectedRobotId = $(ev.target).attr("data-robot-id");
        $("#botselectormodal").modal("toggle");
    }
});

$("#bot-list").on("click", function(ev) {
    // $(this).closest("tr").focus();
    currentFightcardRowIndex = parseInt($(ev.target).closest("tr").attr("data-row-index"), 10);
    setTimeout(() => {
        $("#bot-list tr").eq(currentFightcardRowIndex).focus();
    }, 30);
    selectedRobotId = $(ev.target).closest("tr").attr("data-robot-id");
    $("#botselectormodal").modal("toggle");
})

$("#search-term").on("keydown", (ev) => {
    if (ev.key === "ArrowDown") {
        ev.preventDefault();
        currentFightcardRowIndex = 0;
        $("#bot-list tr").eq(0).focus();
    } else if ($("#search-term").val() == "") {
        populateRobotList(robots);
    }else if (ev.key == "Enter") {
        selectedRobotId = $("#bot-list tr").eq(0).attr("data-robot-id");
        $("#botselectormodal").modal("toggle");
    } else {
        populateRobotListSortOnSearchTerm($("#search-term").val());
    }
})

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
