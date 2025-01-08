import challonge
import io
import base64

from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, JSONResponse, Response, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request
from PIL import Image

from helpers import *
from sensitivedata import *

ch_cache_last_updated = datetime.datetime(1970, 1, 1)
ch_cache_data = {}

robots = load_persisted()

queue: dict[Color, dict[QueuePosition, dict[Field, str]]] = {
    Color.red: {pos: EMPTY_ROBOT for pos in QueuePosition},
    Color.blue: {pos: EMPTY_ROBOT for pos in QueuePosition},
}

app = FastAPI(redoc_url="/redoc", openapi_tags=TAGS_META,
              swagger_ui_parameters={"deepLinking": False})
app.mount("/static", StaticFiles(directory="static"), name="static")
print("Current IP address:", get_ip())

app.title = "ArenaCommand"
app.version = "1.6.0"
app.summary = "BattleBots Control software"


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        summary=app.summary,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "/banner_inverse.png"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


def challonge_cache(data_type: ChDataType | None = None):
    global ch_cache_last_updated, ch_cache_data
    # if challonge hasn't been updated in the past 30sec, update cached data
    if datetime.datetime.now() - ch_cache_last_updated > datetime.timedelta(seconds=30):
        tournaments = challonge.tournaments.index()
        matches = challonge.matches.index(active_tournament["id"])
        participants = challonge.participants.index(active_tournament["id"])
        ch_cache_data[ChDataType.tournaments] = tournaments
        ch_cache_data[ChDataType.matches] = matches
        ch_cache_data[ChDataType.participants] = participants
        print("Challonge cache updated! Last update",
              datetime.datetime.now() - ch_cache_last_updated, "ago.")
        ch_cache_last_updated = datetime.datetime.now()
    else:  # use cached data
        tournaments = ch_cache_data[ChDataType.tournaments]
        matches = ch_cache_data[ChDataType.matches]
        participants = ch_cache_data[ChDataType.participants]

    # return data based on selector
    if data_type == ChDataType.tournaments:
        return tournaments
    if data_type == ChDataType.matches:
        return matches
    if data_type == ChDataType.participants:
        return participants


# credentials loaded from sensitivedata.py
challonge.set_credentials(get_challonge_username(), get_challonge_api_key())
tournaments = challonge.tournaments.index()  # list tournaments to begin
# start with the first tournament in account as the selected tournament
active_tournament = tournaments[0]


def get_robot_record_id(id: str):
    """returns a w-l-t record loaded from challonge based on the name of the \
        robot and the currently selected tournament"""
    c_parts = challonge_cache(ChDataType.participants)
    c_matcs = challonge_cache(ChDataType.matches)

    participants = {  # pare down challonge data and add w/l/t slots for keeping track
        p["id"]: {
            "id": p["id"],
            "name": p["name"],
            "wins": 0,
            "losses": 0,
            "ties": 0
        } for p in c_parts}
    matches = [
        {
            "id": m["id"],
            "player1_id": m["player1_id"],
            "player2_id": m["player2_id"],
            "winner_id": m["winner_id"],
            "loser_id": m["loser_id"],
            "state": m["state"],
        } for m in c_matcs
    ]

    # print(participants, matches)

    for m in matches:
        if m['state'] != "complete":  # make sure match completed
            continue
        if m["winner_id"] != None and m["loser_id"] != None:
            participants[m["winner_id"]]["wins"] += 1
            participants[m["loser_id"]]["losses"] += 1
        else:
            participants[m["player1_id"]]["ties"] += 1
            participants[m["player2_id"]]["ties"] += 1

    if id in [robot[1][Field.id] for robot in robots.items()]:
        current_name = robots[id][Field.name]
    else:
        return ""  # will return if id does not resolve to a robot, such as for a grudge match

    text = ""  # will return if robot name does not exist in selected challonge tournament
    for id in participants.keys():
        p = participants[id]
        # print(p)
        if current_name == p["name"]:
            text = "-".join([str(p["wins"]), str(p["losses"]), str(p["ties"])])
    return text


def robot_exists_in_cur_ch_tournament(id: str) -> bool:
    """returns boolean value of whether the current internal id exists in the challonge tournament"""
    c_parts = challonge_cache(ChDataType.participants)
    # pare down challonge data to just names
    p_names = [p["name"] for p in c_parts]
    if id in [robot[1][Field.id] for robot in robots.items()]:
        current_name = robots[id][Field.name]
        for name in p_names:
            if current_name == name:
                return True
    return False


@app.exception_handler(RequestValidationError)
async def override_config_page_errors_to_404_page(request: Request, exc):
    """override config page `not found` errors to redirect to 404.html, otherwise re raise exception"""
    if "/config" in str(request.url):
        with open("./static/404.html", "r") as f:
            content = f.read().replace("{header}", get_header(WebPage.home))
            return HTMLResponse(content=content, status_code=404)
    else:
        raise exc


@app.get("/", tags=["configpages"], responses={307: {"content": {"text/html": {}}}}, response_class=RedirectResponse)
def index() -> RedirectResponse:
    """Redirects to `config/home`"""
    return RedirectResponse("/config/home", status_code=307)


@app.get("/config/{webpage}", tags=["configpages"], responses={200: {"content": {"text/html": {}}}}, response_class=HTMLResponse)
def html_page(webpage: WebPage) -> HTMLResponse:
    """Return HTML for one of the available configuration pages. default is home."""
    with open(f"./static/{webpage.name}.html", "r") as f:
        content = f.read()
        if webpage == WebPage.home:
            content = content.replace("{markdown}", readme_to_html())
        return HTMLResponse(content=content.replace("{header}", get_header(webpage)).replace("{appname}", app.title).replace("{footer}", get_footer(webpage, "2024", "Robot Smashing Leaque, LLC", app.title, app.version)))


@app.get("/api/v1/active/{queue_pos}/{color}/image", tags=["activerobot"])
def get_robot_image_json(color: Color, queue_pos: QueuePosition, transform: ImageTransform | None = None, max_size: int | None = None) -> JSONResponse:
    """returns the stored image url for selected robot"""
    id = queue[color][queue_pos][Field.id]
    return {"field": "imageurl", "text": f"http://{get_ip()}/api/v1/images/get/{id}"}


@app.get("/api/v1/active/{queue_pos}/{color}/record", tags=["activerobot"])
def get_robot_record_json(queue_pos: QueuePosition, color: Color) -> JSONResponse:
    """ returns the record (W-L-T) of the selected robot"""
    id = queue[color][queue_pos][Field.id]
    text = get_robot_record_id(id)
    return {"field": Field.record, "text": text, "format": "W-L-T"}


@app.get("/api/v1/active/{queue_pos}/{color}/{field}", tags=["activerobot"])
def get_robot_field_json(color: Color, field: Field, queue_pos: QueuePosition) -> JSONResponse:
    """get other field of the current robot"""
    return {"field": field, "text": queue[color][queue_pos][field]}


@app.get("/api/v1/list/{weightclass}", tags=["robotlist"], deprecated=True,
         description="Get list of robots selected by weightclass. Deprecated, please use `api/v1/robots/list/{weightclass}` instead")
@app.get("/api/v1/robots/list/{weightclass}", tags=["robotlist"])
async def get_robot_list(weightclass: Weightclass, sort: Field | None = Field.name, reverse: bool | None = False):
    """Get list of robots selected by weightclass"""
    global robots
    # print(robots.items())
    if weightclass != Weightclass.all:
        returnable = [
            robot for key, robot in robots.items() if robot[Field.weightclass] == weightclass]
    else:
        returnable = [robot[1] for robot in robots.items()]
        # print(returnable)
    for robot in returnable:
        robot[Field.record] = get_robot_record_id(robot[Field.id])
        robot[Field.existsinchallonge] = robot_exists_in_cur_ch_tournament(
            robot[Field.id])
    return sort_robots_by_field(returnable, sort, reverse)


@app.post("/api/v1/queue/advance", tags=["utilities"])
def advance_standby_robot():
    """advance robots in queue"""
    global queue
    for color in Color:
        queue[color][QueuePosition.current] = queue[color][QueuePosition.next]
        queue[color][QueuePosition.next] = queue[color][QueuePosition.standby]
        queue[color][QueuePosition.standby] = queue[color][QueuePosition.extra1]
        queue[color][QueuePosition.extra1] = queue[color][QueuePosition.extra2]
        queue[color][QueuePosition.extra2] = EMPTY_ROBOT


@app.post("/api/v1/queue/remove/{queue_pos}", tags=["utilities"])
def remove_from_queue(queue_pos: QueuePosition):
    global queue
    for color in Color:
        if queue_pos == QueuePosition.current:
            return
        elif queue_pos == QueuePosition.next:
            queue[color][QueuePosition.next] = queue[color][QueuePosition.standby]
            queue[color][QueuePosition.standby] = queue[color][QueuePosition.extra1]
            queue[color][QueuePosition.extra1] = queue[color][QueuePosition.extra2]
        elif queue_pos == QueuePosition.standby:
            queue[color][QueuePosition.standby] = queue[color][QueuePosition.extra1]
            queue[color][QueuePosition.extra1] = queue[color][QueuePosition.extra2]
        elif queue_pos == QueuePosition.extra1:
            queue[color][QueuePosition.extra1] = queue[color][QueuePosition.extra2]
        queue[color][QueuePosition.extra2] = EMPTY_ROBOT


@app.post("/api/v1/set/{queue_pos}/{color}", tags=["activerobot"])
def set_robot_by_name(queue_pos: QueuePosition, color: Color, robot_id: RobotId):
    """set active or next robot by it's id"""
    global queue
    new_robot = robots[robot_id.robot_id]
    queue[color][queue_pos] = new_robot


@app.post("/api/v1/special/{type}/{weightclass}", tags=["utilities"])
def start_special_match(type: SpecialMatchType, weightclass: Weightclass):
    """activate special match type"""
    global queue
    if type == SpecialMatchType.grudge:
        queue[Color.red][QueuePosition.current] = grudge_match(weightclass)
        queue[Color.blue][QueuePosition.current] = grudge_match(weightclass)
    elif type == SpecialMatchType.rumble:
        queue[Color.red][QueuePosition.current] = rumble(weightclass)
        queue[Color.blue][QueuePosition.current] = rumble(weightclass)


@app.get("/api/v1/images/get/{id}", tags=["images"], responses={200: {"content": {"image/png": {}}}}, response_class=Response)
def get_image_by_id(id: str, transform: ImageTransform | None = None, max_size: int | None = None):
    # crop = True if crop is not None else False
    if id in [robot[1][Field.id] for robot in robots.items()]:
        image_status = robots[id][Field.imagestatus]
    else:
        image_status = ImageStatus.error

    if image_status == ImageStatus.error:
        return return_image_from_id(id, transform=transform, max_size=max_size)
    elif image_status == ImageStatus.warn:
        return return_image_from_id(id, transform=transform, max_size=max_size)
    elif image_status == ImageStatus.ok:
        return return_image_from_id(id, transform=transform, max_size=max_size)


@app.post("/api/v1/images/save/{id}", tags=["images"])
async def handle_image_save(id, request: Request):
    form_data = await request.form()
    if form_data["imgBase64"].find("image/png") > 0:
        data = form_data["imgBase64"].replace("data:image/png;base64,", "")
        # print(data[0:100], "...", data[-100:-1])
        image_data = base64.b64decode(data)
        image = Image.open(io.BytesIO(image_data))
        image.save(f"./images/{id}.png")
        robots[id][Field.imagestatus] = ImageStatus.ok
        persist(robots)
    else:
        raise TypeError(
            f"File type {form_data["imgBase64"].split(";")[0].split(":")[-1]} not supported")

# @app.post("/api/v2/images/save/{id}",tags=["images"])
# async def handle_image_json_save(id: str, ):


@app.post("/api/v1/robots/edit/{id}", tags=["robot"])
async def edit_robot(id: str, request: Request):
    global robots
    json = await request.json()
    if id in [robot[Field.id] for key, robot in robots.items()]:
        # print(robots[<>[id]])
        robots[id][Field.name] = json["name"].strip().rstrip()
        robots[id][Field.teamname] = json["teamname"]
        robots[id][Field.weightclass] = str(json["weightclass"]).lower()
        robots[id][Field.flavortext] = json["flavortext"]
        # print(robots[<>[id]])
    persist(robots)


@app.post("/api/v1/robots/new", tags=["robot"])
async def add_robot(robot: NewRobot):
    global robots
    name: str = robot.name.strip()
    id: str = name_to_id(name)
    flavortext: str = robot.flavortext.strip()
    if flavortext.startswith("\"") or flavortext.startswith("\'"):
        flavortext = flavortext[1:]
    if flavortext.endswith("\"") or flavortext.endswith("\'"):
        flavortext = flavortext[:-1]
    robots.update({id: {
        Field.id: id,
        Field.name: name,
        Field.teamname: robot.teamname.strip(),
        Field.weightclass: robot.weightclass,
        Field.flavortext: flavortext,
        Field.imagestatus: ImageStatus.ok if image_exists(id) else ImageStatus.error,
    }})
    persist(robots)
    return robots[id]
    print(robot)


@app.delete("/api/v1/robots/delete/{id}", tags=["robot"])
def delete_robot(id: str):
    if id in [robot[1][Field.id] for robot in robots.items()]:
        robots.pop(id)
    persist(robots)


@app.post("/api/v1/robots/list/{mode}", tags=["robotlist"])
async def replace_robot_list(mode: RobotListMode, request: Request):
    global robots
    if mode == RobotListMode.replace:
        robots = {}
    # TODO: implement append mode
    assert mode == RobotListMode.replace
    data = await request.json()
    if data["has_headers"]:
        data["content"].pop(0)  # remove headers from robot list
    for robot in data["content"]:
        name: str = robot[data["key"]["robot_name"]].strip()
        id: str = name_to_id(name)
        flavortext: str = robot[data["key"]["flavortext"]].strip()
        if flavortext.startswith("\"") or flavortext.startswith("\'"):
            flavortext = flavortext[1:]
        if flavortext.endswith("\"") or flavortext.endswith("\'"):
            flavortext = flavortext[:-1]
        robots[id] = {
            Field.id: id,
            Field.name: name,
            Field.teamname: robot[data["key"]["team_name"]].strip(),
            Field.weightclass: Weightclass[robot[data["key"]["weightclass"]].strip().lower()],
            Field.flavortext: flavortext,
            Field.imagestatus: ImageStatus.ok if image_exists(id) else ImageStatus.error,
        }
    # print(robots)
    persist(robots)


@app.delete("/api/v1/robots/list/clear", tags=["robotlist"])
async def clear_robot_list():
    global robots
    persist({})
    robots = load_persisted()


@app.get("/api/v1/tournaments/list", tags=["tournaments"])
async def get_tournaments():
    tournaments = challonge_cache(ChDataType.tournaments)
    # return [{"name": tournament["name"], "id": tournament["id"]} for tournament in tournaments]
    return tournaments


@app.post("/api/v1/tournaments/active", tags=["tournaments"])
async def set_active_tournament(request: Request):
    global active_tournament, ch_cache_last_updated
    # force cache update because new tournament
    json = await request.json()
    tournaments = challonge_cache(ChDataType.tournaments)
    for t in tournaments:
        if int(json["id"]) == int(t['id']):
            active_tournament = t
    ch_cache_last_updated = datetime.datetime(1970, 1, 1)


@app.get("/api/v1/tournaments/active", tags=["tournaments"])
def get_active_tournament():
    return active_tournament


@app.get("/api/v1/tournaments/active/participants", tags=["tournaments"])
def get_active_tournament_pariticipants():
    global active_tournament
    participants = challonge_cache(ChDataType.participants)
    return participants


@app.get("/api/v1/tournaments/active/matches", tags=["tournaments"])
def get_active_tournament_matches():
    global active_tournament
    matches = challonge_cache(ChDataType.matches)
    return matches


app.mount("/", StaticFiles(directory="./icons",
          check_dir=True), name="icons")


def return_image_from_id(image_name, transform: ImageTransform | None, max_size: int | None = None) -> Response:
    if (image_name in [robot[1][Field.id] for robot in robots.items()]) or image_name == "rsl-logo":
        # image_name = robots[<>[image_id]]["name"]
        try:
            with open(f"./images/{image_name}.png", "rb") as f:
                image_pil = Image.open(f, "r")
                if transform == ImageTransform.crop:
                    crop_size = min(image_pil.width, image_pil.height)
                    left = int(image_pil.size[0] / 2 - crop_size / 2)
                    upper = int(image_pil.size[1] / 2 - crop_size / 2)
                    right = left + crop_size
                    lower = upper + crop_size

                    new_image = image_pil.crop(
                        (left, upper, right, lower))
                elif transform == ImageTransform.pad:
                    if image_pil.height < image_pil.width:
                        new_image = Image.new(
                            image_pil.mode,
                            (image_pil.width, image_pil.width),
                            (255, 255, 255),
                        )
                        new_image.paste(
                            image_pil,
                            (0, int((image_pil.width - image_pil.height) / 2)),
                        )
                    else:
                        new_image = Image.new(
                            image_pil.mode,
                            (image_pil.height, image_pil.height),
                            (255, 255, 255),
                        )
                        new_image.paste(
                            image_pil,
                            (int((image_pil.height - image_pil.width) / 2), 0),
                        )
                else:
                    new_image = image_pil
                if max_size:
                    # print(max_size)
                    if new_image.width > max_size:
                        factor = max_size / new_image.width
                        # print(factor)
                        new_image = new_image.resize(
                            (int(new_image.width * factor), int(new_image.height * factor)))
                        # print(new_image.width, new_image.height)
                return_image = io.BytesIO()
                new_image.save(return_image, "png")
                return Response(
                    content=return_image.getvalue(),
                    media_type="image/png",
                    headers=NOCACHE_HEADERS,
                )
        except FileNotFoundError:
            print("File not found")
    # return FileResponse("./images/no-image.png", headers=NOCACHE_HEADERS)
    with open(f"./images/no-image.png", "rb") as f:
        new_image = Image.open(f, "r")
        if max_size:
            # print(max_size)
            if new_image.width > max_size:
                factor = max_size / new_image.width
                # print(factor)
                new_image = new_image.resize(
                    (int(new_image.width * factor), int(new_image.height * factor)))
                # print(new_image.width, new_image.height)
        return_image = io.BytesIO()
        new_image.save(return_image, "png")
        return Response(
            content=return_image.getvalue(),
            media_type="image/png",
            headers=NOCACHE_HEADERS,
        )
