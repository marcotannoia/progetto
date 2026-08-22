import os
import urllib.parse

import requests


SHARED_API_KEY = os.environ.get("GOOGLE_API_KEY")
DIRECTIONS_API_KEY = os.environ.get("GOOGLE_MAPS_DIRECTIONS_API_KEY") or SHARED_API_KEY
REQUEST_TIMEOUT_SECONDS = 10


def get_google_distance(partenza, arrivo):
    if not DIRECTIONS_API_KEY:
        return None

    try:
        response = requests.get(
            "https://maps.googleapis.com/maps/api/directions/json",
            params={
                "origin": partenza,
                "destination": arrivo,
                "key": DIRECTIONS_API_KEY,
                "units": "metric",
                "language": "it",
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError):
        return None

    if data.get("status") != "OK" or not data.get("routes"):
        return None

    percorso = data["routes"][0]["legs"][0]
    return {
        "distanza_testo": percorso["distance"]["text"],
        "distanza_valore": percorso["distance"]["value"],
        "durata": percorso["duration"]["text"],
        "start_address": percorso["start_address"],
        "end_address": percorso["end_address"],
    }


def get_maps_link(partenza, destinazione):
    if not partenza or not destinazione:
        return None

    query_string = urllib.parse.urlencode(
        {
            "origin": partenza,
            "destination": destinazione,
            "travelmode": "driving",
        }
    )
    return f"https://www.google.com/maps/dir/?api=1&{query_string}"
