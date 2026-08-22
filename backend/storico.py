from datetime import datetime, timezone
from decimal import Decimal
import os
import re
import time

import boto3
from boto3.dynamodb.conditions import Key


AWS_REGION = os.environ.get("AWS_REGION", "eu-south-1")
TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "EcoTrack_viaggi")
CO2_AUTO_STANDARD = 0.120

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)


def safe_float(value):
    try:
        if value is None:
            return 0.0
        if isinstance(value, (int, float, Decimal)):
            return float(value)

        normalized = str(value).replace(",", ".")
        normalized = re.sub(r"[^\d.]", "", normalized)
        return float(normalized) if normalized else 0.0
    except (TypeError, ValueError):
        return 0.0


def registra_viaggio(username, co2, km, mezzo, start, end):
    try:
        item = {
            "username": str(username).lower().strip(),
            "timestamp": str(int(time.time())),
            "data": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "co2": Decimal(str(co2)),
            "km": Decimal(str(km)),
            "mezzo": str(mezzo),
            "partenza": str(start),
            "arrivo": str(end),
        }
        table.put_item(Item=item)
        return True
    except Exception:
        return False


def get_storico_completo(username):
    try:
        query_args = {"KeyConditionExpression": Key("username").eq(str(username).lower().strip())}
        items = []

        while True:
            response = table.query(**query_args)
            items.extend(response.get("Items", []))
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break
            query_args["ExclusiveStartKey"] = last_key

        trips = []
        for item in items:
            trip = item.copy()
            trip["co2"] = safe_float(trip.get("co2"))
            trip["km"] = safe_float(trip.get("km"))
            trips.append(trip)

        trips.sort(key=lambda trip: trip.get("timestamp", "0"), reverse=True)
        return {"ok": True, "viaggi": trips}
    except Exception:
        return {"ok": False, "viaggi": []}


def genera_wrapped(username):
    trips = get_storico_completo(username).get("viaggi", [])
    if not trips:
        return None

    total_km = 0
    total_saved_co2 = 0
    transport_counts = {}

    for trip in trips:
        km = safe_float(trip.get("km"))
        emitted_co2 = safe_float(trip.get("co2"))
        transport = trip.get("mezzo", "sconosciuto")

        total_km += km
        transport_counts[transport] = transport_counts.get(transport, 0) + 1
        total_saved_co2 += max(0, km * CO2_AUTO_STANDARD - emitted_co2)

    favorite_transport = max(transport_counts, key=transport_counts.get)
    return {
        "viaggi_totali": len(trips),
        "co2_risparmiata": round(total_saved_co2, 2),
        "km_totali": round(total_km, 2),
        "mezzo_preferito": favorite_transport,
    }


def get_classifica_risparmio():
    scan_args = {}
    items = []

    while True:
        response = table.scan(**scan_args)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        scan_args["ExclusiveStartKey"] = last_key

    totals = {}
    for item in items:
        username = item.get("username", "anonimo")
        emitted_co2 = safe_float(item.get("co2"))
        km = safe_float(item.get("km"))
        totals[username] = totals.get(username, 0.0) + max(0, km * CO2_AUTO_STANDARD - emitted_co2)

    ranking = [
        {
            "username": username,
            "co2": round(total, 2),
            "risparmio": round(total, 2),
            "score": int(round(total, 2) * 10),
            "regione": "Global",
            "avatar": username[0].upper() if username else "?",
        }
        for username, total in totals.items()
    ]
    ranking.sort(key=lambda entry: entry["co2"], reverse=True)
    return ranking[:10]
