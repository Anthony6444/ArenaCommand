import datetime
from enum import Enum, auto
import json
import socket
import os
import markdown
from pydantic import BaseModel
from hashlib import sha1
from os.path import exists as file_exists

TAGS_META = [
    {
        "name": "configpages",
        "description": "This section is comprised of interface and config pages and should be acesssed through a web browser.",
    },
    {
        "name": "activerobot",
        "description": "Endpoints to get and manage the current and next up robots. These return json data.",
    },
    {
        "name": "robotlist",
        "description": "Endpoints that deal with lists of robots.",
    },
    {
        "name": "robot",
        "description": "Endpoints that deal with a single robot, addressed by id or name",
    },
    {
        "name": "tournaments",
        "description": "Operactions that deal with challonge data and tournaments.",
    },
    {
        "name": "images", 
        "description": "Endpoints that deal with robot images."
    },
    {
        "name": "utilities", 
        "description": "General utilites that make the program run."
    },
]


NOCACHE_HEADERS = {
    "Pragma-Directive": "no-cache",
    "Cache-Directive": "no-cache",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


def get_ip():
    """
    Returns the current machine's IP address, or 127.0.0.1 if not available.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        # doesn't even have to be reachable
        s.connect(("10.254.254.254", 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def name_to_id(name: str) -> str:
    """
    Converts a robot name to a unique SHA-1 hash string ID.
    """
    return str(sha1(name.strip().rstrip().encode("utf-8")).hexdigest())


def image_exists(id: str) -> bool:
    """
    Checks if an image file exists for the given robot ID.
    """
    return file_exists(f"./images/{id}.png")


class StrEnum(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        """Override default enum value so fastapi can work with strings.
        Because of this, `auto` will return the name of the field instead of an integer value.
        """
        return name.lower()


class WebPage(StrEnum):
    """Enumeration of web page names."""

    home = auto()
    imageintake = auto()
    judgingpanel = auto()
    roboteditor = auto()
    streamcontrol = auto()
    settings = auto()


class RobotId(BaseModel):
    """Pydantic model for robot ID payloads."""

    robot_id: str


class QueuePosition(StrEnum):
    """Enumeration of queue positions for robots."""

    current = auto()
    next = auto()
    standby = auto()
    extra1 = auto()
    extra2 = auto()
    extra3 = auto()
    extra4 = auto()
    extra5 = auto()


class Color(StrEnum):
    """Enumeration of robot colors."""

    red = auto()
    blue = auto()


class Field(StrEnum):
    """Enumeration of robot data fields."""

    id = auto()
    name = auto()
    teamname = auto()
    flavortext = auto()
    weightclass = auto()
    record = auto()
    imagestatus = auto()
    existsinchallonge = auto()
    all = auto()
    rank = auto()
    elo = auto()
    last_tournament = auto()
    record_career = auto()
    record_year = auto()


class Weightclass(StrEnum):
    """Enumeration of robot weight classes."""

    fairyweight = auto()
    antweight = auto()
    beetleweight = auto()
    mantisweight = auto()
    hobbyweight = auto()
    featherweight = auto()
    plastic_ant = auto()
    unset = auto()
    all = auto()


class NewRobot(BaseModel):
    """Pydantic model for creating a new robot."""

    name: str
    teamname: str
    flavortext: str
    weightclass: Weightclass
    rank: str = "na"
    elo: str = "na"
    last_tournament: str = ""
    record_career: str = "0-0"
    record_year: str = "0-0"


class ImageStatus(StrEnum):
    """Enumeration of image status values."""

    error = auto()
    warn = auto()
    ok = auto()


class ImageTransform(StrEnum):
    """Enumeration of image transformation types."""

    crop = auto()
    pad = auto()
    none = auto()


class RobotListMode(StrEnum):
    """Enumeration of robot list update modes."""

    replace = auto()
    append = auto()


class SpecialMatchType(StrEnum):
    """Enumeration of special match types."""

    grudge = auto()
    rumble = auto()


class ChDataType(StrEnum):
    """Enumeration of Challonge data types."""

    matches = auto()
    participants = auto()
    tournaments = auto()


class ChCacheAction(StrEnum):
    """Enumeration of Challonge cache actions."""

    read = auto()
    refresh = auto()


def get_header(webpage: WebPage):
    """
    Reads and returns the header HTML for the given web page, marking the active page.
    """
    with open("./static/header.html", "r") as f:
        content = f.read()
        for page in WebPage:
            if page == webpage:
                content = content.replace(f"{{{page.name}}}", "active")
            else:
                content = content.replace(f"{{{page.name}}}", "")
        return content


def get_footer(
    webpage: WebPage,
    year: str = "1999",
    author: str = "Author",
    program: str = "Name",
    version: str = "0.0.1a",
):
    """
    Reads and returns the footer HTML for the given web page, marking the active page and filling in metadata.
    """
    with open("./static/footer.html", "r") as f:
        content = f.read()
        for page in WebPage:
            if page == webpage:
                content = content.replace(f"{{{page.name}}}", "active")
            else:
                content = content.replace(f"{{{page.name}}}", "")
        content = content.replace("{year}", year)
        content = content.replace("{author}", author)
        content = content.replace("{program}", program)
        content = content.replace("{version}", version)
        return content


def readme_to_html():
    """
    Reads the README.md file and returns its contents as HTML.
    """
    with open("./README.md", "r") as f:
        return markdown.markdown(f.read())


def sort_robots_by_field(
    robots: dict[str, dict[Field, str | ImageStatus]],
    sort: Field = Field.name,
    reverse: bool | None = False,
) -> dict[str, dict[Field, str | ImageStatus]]:
    """
    Sorts a list of robots by the specified field.
    """

    def findkey(subdict: dict):
        return subdict[sort]

    return sorted(robots, key=findkey, reverse=reverse | False)


EMPTY_ROBOT: dict[Field, str | Weightclass | ImageStatus] = {
    Field.id: "rsl-logo",
    Field.name: "",
    Field.teamname: "",
    Field.weightclass: Weightclass.unset,
    Field.flavortext: "",
    Field.imagestatus: ImageStatus.error,
    Field.rank: "na",
    Field.elo: "na",
    Field.last_tournament: "",
    Field.record_career: "0-0",
    Field.record_year: "0-0",
}

DELETED_ROBOT = {
    Field.id: "DELETED",
    Field.name: "DELETED",
    Field.teamname: "DELETED",
    Field.weightclass: Weightclass.unset,
    Field.flavortext: "DELETED",
    Field.imagestatus: ImageStatus.error,
    Field.rank: "DELETED",
    Field.elo: "DELETED",
    Field.last_tournament: "DELETED",
    Field.record_career: "DELETED",
    Field.record_year: "DELETED",
}


def grudge_match(
    weightclass: Weightclass,
) -> dict[Field, str | Weightclass | ImageStatus]:
    """
    Returns a dictionary representing a grudge match robot for the given weight class.
    """
    return {
        Field.id: "grudge",
        Field.name: "GRUDGE MATCH",
        Field.teamname: "",
        Field.weightclass: weightclass,
        Field.flavortext: "",
        Field.imagestatus: ImageStatus.error,
        Field.rank: "",
        Field.elo: "",
        Field.last_tournament: "",
        Field.record_career: "",
        Field.record_year: "",
    }


def rumble(weightclass: Weightclass) -> dict[Field, str | Weightclass | ImageStatus]:
    """
    Returns a dictionary representing a rumble match robot for the given weight class.
    """
    return {
        Field.id: "rumble",
        Field.name: f"{weightclass.upper()} RUMBLE",
        Field.teamname: "",
        Field.weightclass: weightclass,
        Field.flavortext: "",
        Field.imagestatus: ImageStatus.error,
        Field.rank: "",
        Field.elo: "",
        Field.last_tournament: "",
        Field.record_career: "",
        Field.record_year: "",
    }


def persist(robots):
    """
    Persists the robots dictionary to the database.json file.
    """
    with open("database.json", "w") as f:
        json.dump({"robots": robots}, f)


def load_persisted() -> dict[str, dict[Field, str | ImageStatus]]:
    """
    Loads and returns the robots dictionary from the database.json file, if it exists.
    """
    if os.path.exists("database.json"):
        with open("database.json") as f:
            data: dict = json.load(f)
            if "robots" in data.keys():
                return data["robots"]
    return {}


def json_serial(obj):
    """
    JSON serializer for objects not serializable by default json code.
    """
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError("Type %s not serializable" % type(obj))
