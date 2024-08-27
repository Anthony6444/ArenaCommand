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
        "name": "users",
        "description": "Operations with users. The **login** logic is also here.",
    },
    {
        "name": "items",
        "description": "Manage items. So _fancy_ they have their own docs.",
        "externalDocs": {
            "description": "Items external docs",
            "url": "https://fastapi.tiangolo.com/",
        },
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
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        # doesn't even have to be reachable
        s.connect(('10.254.254.254', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


def name_to_id(name: str) -> str:
    return str(sha1(name.encode("utf-8")).hexdigest())


def image_exists(id: str) -> bool:
    return file_exists(f"./images/{id}.png")


class StrEnum(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        """override default enum value so fastapi can work with strings.
because of this, `auto` will return the name of the field instead of an integer value"""
        return name.lower()


class WebPage(StrEnum):
    home = auto()
    imageintake = auto()
    judgingpanel = auto()
    roboteditor = auto()
    streamcontrol = auto()
    settings = auto()


class RobotName(BaseModel):
    robot_name: str


class QueuePosition(StrEnum):
    current = auto()
    next = auto()


class Color(StrEnum):
    red = auto()
    blue = auto()


class Field(StrEnum):
    id = auto()
    name = auto()
    teamname = auto()
    flavortext = auto()
    weightclass = auto()
    record = auto()
    imagestatus = auto()
    existsinchallonge = auto()
    all = auto()


class Weightclass(StrEnum):
    fairyweight = auto()
    antweight = auto()
    beetleweight = auto()
    mantisweight = auto()
    hobbyweight = auto()
    featherweight = auto()
    all = auto()


class ImageStatus(StrEnum):
    error = auto()
    warn = auto()
    ok = auto()


class ImageTransform(StrEnum):
    crop = auto()
    pad = auto()
    none = auto()


class RobotListMode(StrEnum):
    replace = auto()
    append = auto()


class SpecialMatchType(StrEnum):
    grudge = auto()
    rumble = auto()


class ChDataType(StrEnum):
    matches = auto()
    participants = auto()
    tournaments = auto()


class ChCacheAction(StrEnum):
    read = auto()
    refresh = auto()


def get_header(webpage: WebPage):
    with open("./static/header.html", "r") as f:
        content = f.read()
        for page in WebPage:
            if page == webpage:
                content = content.replace(f"{{{page.name}}}", "active")
            else:
                content = content.replace(f"{{{page.name}}}", "")
        return content


def get_footer(webpage: WebPage):
    with open("./static/footer.html", "r") as f:
        content = f.read()
        for page in WebPage:
            if page == webpage:
                content = content.replace(f"{{{page.name}}}", "active")
            else:
                content = content.replace(f"{{{page.name}}}", "")
        return content


def readme_to_html():
    with open("./README.md", "r") as f:
        return markdown.markdown(f.read())


EMPTY_ROBOT = {
    Field.id: "rsl-logo",
    Field.name: "",
    Field.teamname: "",
    Field.weightclass: Weightclass.antweight,
    Field.flavortext: "",
    Field.imagestatus: ImageStatus.error,
}

DELETED_ROBOT = {
    Field.id: "rsl-logo",
    Field.name: "DELETED",
    Field.teamname: "DELETED",
    Field.weightclass: Weightclass.antweight,
    Field.flavortext: "DELETED",
    Field.imagestatus: ImageStatus.error,
}


def grudge_match(weightclass: Weightclass):
    return {
        Field.id: "grudge",
        Field.name: "GRUDGE MATCH",
        Field.teamname: "",
        Field.weightclass: weightclass,
        Field.flavortext: "",
        Field.imagestatus: ImageStatus.error,
    }


def rumble(weightclass: Weightclass):
    return {
        Field.id: "rumble",
        Field.name: f"{weightclass.upper()} RUMBLE",
        Field.teamname: "",
        Field.weightclass: weightclass,
        Field.flavortext: "",
        Field.imagestatus: ImageStatus.error,
    }


def persist(robots, id_lookup, name_lookup):
    with open("database.json", "w") as f:
        json.dump({
            "robots": robots,
            "id_lookup": id_lookup,
            "name_lookup": name_lookup
        }, f)


def load_persisted() -> tuple[list[dict[Field, str | ImageStatus]], dict[str, int], dict[str, int]]:
    if os.path.exists("database.json"):
        with open("database.json") as f:
            data: dict = json.load(f)
            returndata = []
            for field in ["robots", "id_lookup", "name_lookup"]:
                if field in data.keys():
                    returndata.append(data[field])
        if len(returndata) >= 3:
            return returndata
    return [], {}, {}


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError("Type %s not serializable" % type(obj))
