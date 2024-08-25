

window.hasTakenNewPhoto = false;

function loadRobotImageList() {
    boilerplate = $("#template").html()
    $.get("/api/v1/list/all", success = function (result) {
        robot_image_list = "";
        for (i = 0; i < result.length; i++) {
            this_robot_card = $("<div>").html(boilerplate
                .replaceAll("{robot_name}", result[i]['name'])
                .replaceAll("{id}", result[i]['id'])
            )
            robot_image_list += this_robot_card.html();
        }
        $("#robot-image-list").html(robot_image_list);
    });
}
loadRobotImageList();
// var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
// var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
//     return new bootstrap.Tooltip(tooltipTriggerEl)
// })



$(document).on("click", ".robot-image-list-item", function (event) {
    cur_target = event.target;
    while (1) {
        if (!cur_target.classList.contains("robot-image-list-item")) {
            cur_target = cur_target.parentElement;
        }
        else {
            break;
        }
    }
    $("#photo").attr("src", $(cur_target).children("img").attr("src"));
    $("#current-id").text($(cur_target).children(".card-body").children("#id").text());
    $("#video-preview").removeClass("hidden");
    $("#photo-preview").addClass("hidden");
    $("#clear-photo-container").addClass("hidden");
    $("#noimage-alert").addClass("hidden");
    window.hasTakenNewPhoto = false;

});
$("#clear-photo-button").click(function (ev) {
    $("#video-preview").removeClass("hidden");
    $("#photo-preview").addClass("hidden");
    $("#noimage-alert").addClass("hidden");
    window.hasTakenNewPhoto = false;
});
$("#upload-image-button").on("click", function (event) {
    // console.log("upload-image-button")
    if (window.hasTakenNewPhoto) {
        $.ajax({
            type: "POST",
            url: "/api/v1/images/save/" + $("#current-id").text(),
            data: {
                imgBase64: document.getElementsByTagName("canvas")[0].toDataURL("image/png")
            }
        }).done(function (o) {
            console.log('saved');
            // If you want the file to be visible in the browser 
            // - please modify the callback in javascript. All you
            // need is to return the url to the file, you just saved 
            // and than put the image in your browser.
        });
        // dismiss modal
        $('#image-capture-modal').modal('hide');
        setTimeout(updateSpecificRobotCard, 750);
    }
    else {
        $("#noimage-alert").removeClass("hidden");
        ev.preventDefault();
    }
})
function updateSpecificRobotCard() {
    id = $("#current-id").text();
    $(".robot-image-list-item").each(function (i, obj) {
        if ($(this).children(".card-body").children("#id").text() == id) {
            src = $(this).children("img").attr("src");
            fetch(src, { cache: 'reload', mode: 'no-cors' })
            $(this).children("img").attr("src", "");
            $(this).children("img").attr("src", src);
        }
    });
}
function updateAvailableVideoDevices() {
    document.querySelector('select#video-source-list').innerHTML = "";
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        for (var i = 0; i < devices.length; i++) {
            var device = devices[i];
            // console.log(devices)
            if (device.kind === 'videoinput') {
                var option = document.createElement('option');
                // console.log(device.deviceId, device.label)
                option.value = device.deviceId.toString();
                option.text = device.label || 'camera ' + (i + 1);
                document.querySelector('select#video-source-list').appendChild(option);
            }
        };
    });
}
updateAvailableVideoDevices();
navigator.mediaDevices.ondevicechange = (event) => {
    updateAvailableVideoDevices();
};
(() => {
    // The width and height of the captured photo. We will set the
    // width to the value defined here, but the height will be
    // calculated based on the aspect ratio of the input stream.

    const width = 1920; // We will scale the photo width to this
    let height = 1080; // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.

    let streaming = false;

    // The various HTML elements we need to configure or control. These
    // will be set by the startup() function.

    let video = null;
    let canvas = null;
    let photo = null;
    let startbutton = null;
    let deviceselector = null;

    function showViewLiveResultButton() {
        if (window.self !== window.top) {
            // Ensure that if our document is in a frame, we get the user
            // to first open it in its own tab or window. Otherwise, it
            // won't be able to request permission for camera access.
            document.querySelector(".contentarea").remove();
            const button = document.createElement("button");
            button.textContent = "View live result of the example code above";
            document.body.append(button);
            button.addEventListener("click", () => window.open(location.href));
            return true;
        }
        return false;
    }

    function startup() {
        if (showViewLiveResultButton()) {
            return;
        }
        video = document.getElementById("video-stream");
        canvas = document.getElementById("temp-canvas");
        photo = document.getElementById("photo");
        startbutton = document.getElementById("photo-button");
        deviceselector = document.getElementById("video-source-list")



        video.addEventListener(
            "canplay",
            (ev) => {
                if (!streaming) {
                    height = video.videoHeight / (video.videoWidth / width);

                    // Firefox currently has a bug where the height can't be read from
                    // the video, so we will make assumptions if this happens.

                    if (isNaN(height)) {
                        height = width / (4 / 3);
                    }


                    canvas.setAttribute("width", width);
                    canvas.setAttribute("height", height);
                    streaming = true;
                }
            },
            false,
        );
        deviceselector.addEventListener("change", (ev) => {
            // console.log(ev.target.value);
            navigator.mediaDevices
                .getUserMedia({ video: ev.target.value ? { deviceId: ev.target.value } : undefined, audio: false })
                .then((stream) => {
                    video.srcObject = stream;
                    video.play();
                })
                .catch((err) => {
                    console.error(`An error occurred: ${err}`);
                });

        });

        navigator.mediaDevices
            .getUserMedia({ video: deviceselector.children[0].value ? { deviceId: deviceselector.children[0].value } : undefined, audio: false })
            .then((stream) => {
                video.srcObject = stream;
                video.play();
            })
            .catch((err) => {
                console.error(`An error occurred: ${err}`);
            });

        startbutton.addEventListener(
            "click",
            (ev) => {
                takepicture();
                ev.preventDefault();
                $("#video-preview").addClass("hidden");
                $("#photo-preview").removeClass("hidden");
                $("#clear-photo-container").removeClass("hidden");
                $("#noimage-alert").addClass("hidden");
                window.hasTakenNewPhoto = true;
            },
            false,
        );

        clearphoto();
    }

    // Fill the photo with an indication that none has been
    // captured.

    function clearphoto() {
        // const context = canvas.getContext("2d");
        // context.fillStyle = "#AAA";
        // context.fillRect(0, 0, canvas.width, canvas.height);

        // const data = canvas.toDataURL("image/png");
        // photo.setAttribute("src", data);

    }

    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.

    function takepicture() {
        const context = canvas.getContext("2d");
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);

            const data = canvas.toDataURL("image/png");
            photo.setAttribute("src", data);
        } else {
            clearphoto();
        }
    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    window.addEventListener("load", startup, false);
})();
document.addEventListener("DOMContentLoaded", function () {
    var lazyloadImages;

    if ("IntersectionObserver" in window) {
        lazyloadImages = document.querySelectorAll(".lazy");
        var imageObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var image = entry.target;
                    image.src = image.dataset.src;
                    image.classList.remove("lazy");
                    imageObserver.unobserve(image);
                }
            });
        });

        lazyloadImages.forEach(function (image) {
            imageObserver.observe(image);
        });
    } else {
        var lazyloadThrottleTimeout;
        lazyloadImages = document.querySelectorAll(".lazy");

        function lazyload() {
            if (lazyloadThrottleTimeout) {
                clearTimeout(lazyloadThrottleTimeout);
            }

            lazyloadThrottleTimeout = setTimeout(function () {
                var scrollTop = window.pageYOffset;
                lazyloadImages.forEach(function (img) {
                    if (img.offsetTop < (window.innerHeight + scrollTop)) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                    }
                });
                if (lazyloadImages.length == 0) {
                    document.removeEventListener("scroll", lazyload);
                    window.removeEventListener("resize", lazyload);
                    window.removeEventListener("orientationChange", lazyload);
                }
            }, 20);
        }

        document.addEventListener("scroll", lazyload);
        window.addEventListener("resize", lazyload);
        window.addEventListener("orientationChange", lazyload);
    }
})

