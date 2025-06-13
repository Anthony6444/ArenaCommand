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
    "extra2",
    "extra3",
    "extra4",
    "extra5"
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


//  function fetchRobotListFromServer() {
//     $.get("/api/v1/list/all", success = function (result) {
//         for (j = 0; j < result.length; j++) {
//             robots[j] = result[j];
//             // console.log(row);
//             // console.log(button)
//             // $("#beetle-list").append($("<button>", ))
//             // button.text(result[j]["name"])

//         }
//     });
//     console.log(robots);
//     populateRobotList(robots);
//  }

function fetchRobotListFromServer() {
    return $.get("/api/v1/list/all").then(function(result) {
        robots = result; // Update the global robots array
        populateRobotList(robots);
    }).catch(function(error) {
        console.error("Error fetching robot list:", error);
    });
}

// function populateRobotList(robotArray = robots) {
//     $("#bot-list").html("");
//     for (i=0; i<robotArray.length; i++) {
//         row = $("<tr>", { "id": "row" + i, "class": "", "data-robot-id": robotArray[i]["id"], "tabindex": "0", "data-row-index": i});
//         char = robotArray[i]["weightclass"].charAt(0).toUpperCase();
//         row.html(`<td data-wc="${char}" class="${char == "A" ? "ant" : "beetle"}"></td><td>${robotArray[i]["name"]}</td><td>${robotArray[i]["teamname"]}</td>`);
//         $("#bot-list").append(row);
//     }
// }

function populateRobotList(robotArray = robots) {
    $("#bot-list").empty(); // Clear the list
    if (!robotArray || robotArray.length === 0) {
        console.warn("No robots to populate");
        return;
    }

    robotArray.forEach((robot, i) => {
        const char = robot.weightclass.charAt(0).toUpperCase();
        const row = $("<tr>", {
            "id": "row" + i,
            "class": "",
            "data-robot-id": robot.id,
            "tabindex": "0",
            "data-row-index": i
        });
        row.html(`
            <td data-wc="${char}" class="${char === "A" ? "ant" : "beetle"}"></td>
            <td>${robot.name}</td>
            <td>${robot.teamname}</td>
        `);
        $("#bot-list").append(row);
    });
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

// function waitForRobotSelectedUpdateFightcard() {
//     if (selectedRobotId != null) {
//         console.log(selectedRobotId, ";", fightcardSelectedId, ";")
//         robot_id= selectedRobotId;
//         if (fightcardSelectedId == "current-blue") {
//             $.jpost("/api/v1/set/current/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "current-red") {
//             $.jpost("/api/v1/set/current/red", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "next-blue") {
//             $.jpost("/api/v1/set/next/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "next-red") {
//             $.jpost("/api/v1/set/next/red", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "standby-blue") {
//             $.jpost("/api/v1/set/standby/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "standby-red") {
//             $.jpost("/api/v1/set/standby/red", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra1-blue") {
//             $.jpost("/api/v1/set/extra1/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra1-red") {
//             $.jpost("/api/v1/set/extra1/red", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra2-blue") {
//             $.jpost("/api/v1/set/extra2/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra2-red") {
//             $.jpost("/api/v1/set/extra2/red", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra3-blue") {
//             $.jpost("/api/v1/set/extra3/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra3-red") {
//             $.jpost("/api/v1/set/extra3/red", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra4-blue") {
//             $.jpost("/api/v1/set/extra4/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra4-red") {
//             $.jpost("/api/v1/set/extra4/red", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra5-blue") {
//             $.jpost("/api/v1/set/extra5/blue", data = { "robot_id": robot_id })
//         }
//         else if (fightcardSelectedId == "extra5-red") {
//             $.jpost("/api/v1/set/extra5/red", data = { "robot_id": robot_id })
//         }
//         else {
//             console.log("invalid fightcard selected")
//         }
//         selectedRobotId = null;
//         fightcardSelectedId = null;
//         updateRobotDetails();
//     } else {
//         setTimeout(waitForRobotSelectedUpdateFightcard, 350)
//     }
// }

function waitForRobotSelectedUpdateFightcard() {
    if (selectedRobotId != null) {
        const [position, color] = fightcardSelectedId.split('-');
        $.jpost(`/api/v1/set/${position}/${color}`, {
            "robot_id": selectedRobotId
        });
        selectedRobotId = null;
        fightcardSelectedId = null;
        updateRobotDetails();
    } else {
        setTimeout(waitForRobotSelectedUpdateFightcard, 350)
    }
}

// $(document).on("click", ".fightcard", function (event) {
//     id = event.target.id.toString();
//     if (event.target.tagName != "DIV") {
//         id = event.target.parentElement.id.toString();
//     }
//     // console.log(id);
//     fightcardSelectedId = id;
//     $("#botselectormodal").modal("toggle");
//     waitForRobotSelectedUpdateFightcard();
// });

function refreshRobotList() {
    if (!robots || robots.length === 0) {
        fetchRobotListFromServer();
    } else {
        populateRobotList(robots);
    }
}

$(document).ready(function() {
    // Fight card click handler
    positions.forEach(position => {
        colors.forEach(color => {
            $(`#${position}-${color}`).on("click", function() {
                fightcardSelectedId = `${position}-${color}`;
                $("#botselectormodal").modal("show");
            });
        });
    });

    // Robot selection click handler
    $("#bot-list").on("click", "tr", function() {
        selectedRobotId = $(this).attr("data-robot-id");
        
        // Only proceed if we have both IDs
        if (selectedRobotId && fightcardSelectedId) {
            const [position, color] = fightcardSelectedId.split('-');
            
            $.ajax({
                type: 'POST',
                url: `/api/v1/set/${position}/${color}`,
                data: JSON.stringify({ "robot_id": selectedRobotId }),
                contentType: "application/json",
                dataType: 'json'
            })
            .done(function() {
                $("#botselectormodal").modal("hide");
                setTimeout(updateRobotDetails, 100); // Give the server a moment to update
                selectedRobotId = null;
                fightcardSelectedId = null;
            })
            .fail(function(error) {
                console.error("Error setting robot:", error);
            });
        }
    });

    // Modal shown handler
    $("#botselectormodal").on("shown.bs.modal", function() {
        $("#search-term").val("").focus();
        fetchRobotListFromServer(); // Always get fresh list
        currentFightcardRowIndex = -1;
    });

    // Initial setup
    fetchRobotListFromServer();
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
$("#skip-extra1-match").on("click", function () {
    $.post("/api/v1/queue/remove/extra1", success = function () {
        updateRobotDetails();
    })
});
$("#skip-extra2-match").on("click", function () {
    $.post("/api/v1/queue/remove/extra2", success = function () {
        updateRobotDetails();
    })
});
$("#skip-extra3-match").on("click", function () {
    $.post("/api/v1/queue/remove/extra3", success = function () {
        updateRobotDetails();
    })
});
$("#skip-extra4-match").on("click", function () {
    $.post("/api/v1/queue/remove/extra4", success = function () {
        updateRobotDetails();
    })
});
$("#skip-extra5-match").on("click", function () {
    $.post("/api/v1/queue/remove/extra5", success = function () {
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

// $("#botselectormodal").on("shown.bs.modal", () => {
//     $("#search-term").focus();
//     $("#search-term").val("");
//     populateRobotList(robots);
// })

$("#botselectormodal").on("shown.bs.modal", function() {
    $("#search-term").val("").focus();
    fetchRobotListFromServer(); // Always get fresh list
    currentFightcardRowIndex = -1;
});

// function updateRobotDetails() {
//     getAllRobotDetails(); 
//     setTimeout(
//         function(){
//             for (i=0; i < positions.length; i++) {
//                 if ($(`#${positions[i]}-blue-weightclass`).text() == $(`#${positions[i]}-red-weightclass`).text() 
//                         || $(`#${positions[i]}-blue-weightclass`).text() == "unset"
//                         || $(`#${positions[i]}-red-weightclass`).text() == "unset") {
//                     // console.log(`#${positions[i]}-mismatch`)
//                     $(`#${positions[i]}-mismatch`).addClass("hidden");
//                 } else {
//                     $(`#${positions[i]}-mismatch`).removeClass("hidden");
//                 }
//             }
//         }, 500);
//     }

function updateRobotDetails() {
    positions.forEach(position => {
        colors.forEach(color => {
            // Update all fields for each position/color combination
            fields.forEach(field => {
                $.get(`/api/v1/active/${position}/${color}/${field}`, function(data) {
                    // Update the element with the field data
                    $(`#${position}-${color}-${field}`).text(data.text || '');
                    
                    // Special handling for weightclass
                    if (field === 'weightclass' && data.text) {
                        const wci = data.text.charAt(0).toUpperCase();
                        $(`#${position}-${color}`).attr("data-sc-wc", wci === "U" ? "" : wci);
                    }
                });
            });
        });

        // Check weight class mismatch after updating
        setTimeout(() => checkWeightMismatch(position), 200);
    });
}

function checkWeightMismatch(position) {
    const blueWeight = $(`#${position}-blue-weightclass`).text();
    const redWeight = $(`#${position}-red-weightclass`).text();
    
    if (blueWeight && redWeight && 
        blueWeight !== "unset" && redWeight !== "unset" && 
        blueWeight !== redWeight) {
        $(`#${position}-mismatch`).removeClass("hidden");
    } else {
        $(`#${position}-mismatch`).addClass("hidden");
    }
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

// $("#bot-list").on("click", function(ev) {
//     // $(this).closest("tr").focus();
//     currentFightcardRowIndex = parseInt($(ev.target).closest("tr").attr("data-row-index"), 10);
//     setTimeout(() => {
//         $("#bot-list tr").eq(currentFightcardRowIndex).focus();
//     }, 30);
//     selectedRobotId = $(ev.target).closest("tr").attr("data-robot-id");
//     $("#botselectormodal").modal("toggle");
// })

$("#bot-list").on("click", "tr", function(ev) {
    currentFightcardRowIndex = parseInt($(this).attr("data-row-index"), 10);
    selectedRobotId = $(this).attr("data-robot-id");
    
    const position = fightcardSelectedId.split('-')[0];
    const color = fightcardSelectedId.split('-')[1];
    
    // Make the API call directly instead of using waitFor...
    $.jpost(`/api/v1/set/${position}/${color}`, {
        "robot_id": selectedRobotId
    }).then(() => {
        $("#botselectormodal").modal("hide");
        updateRobotDetails();
        selectedRobotId = null;
        fightcardSelectedId = null;
    }).catch(error => {
        console.error("Error setting robot:", error);
    });
});

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
