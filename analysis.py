import pandas as pd
import requests
from ast import literal_eval
from datetime import datetime
import os
import json

# Load draw data - Who has which teams
from draw import draw

draw = pd.DataFrame(list(draw.items()), columns=["team", "name"])

# Create or load the past prices and subtitles data
subtitles_file = "assets/data/subtitles.csv"
if not os.path.exists(subtitles_file):
    subtitles = pd.DataFrame(columns=["date valid", "subtitle"])
else:
    subtitles = pd.read_csv(subtitles_file)

prices_file = "assets/data/prices.csv"
if not os.path.exists(prices_file):
    existing_prices = pd.DataFrame(
        columns=["team", "price", "date valid", "date generated"]
    )
else:
    existing_prices = pd.read_csv(prices_file)
existing_prices

# Retrieve odds from Polymarket API
response = requests.get("https://gamma-api.polymarket.com/events/slug/world-cup-winner")
event = response.json()

generated_at = datetime.now().isoformat()  # This is the time we generated these odds
valid_at = event["updatedAt"]  # This is the time these odds are valid for

# This is he odds for each team
markets = [
    {
        "team": team.get("groupItemTitle"),
        "price": float(literal_eval(team.get("outcomePrices", "[0,1]"))[0]),
        "date valid": valid_at,
        "date generated": generated_at,
    }
    for team in event["markets"]
    if team.get("groupItemTitle") in list(draw["team"])
]

# Tack the nre prices onto the existing prices data to extednt he record over time
prices = pd.DataFrame(markets)
extended_prices = pd.concat([existing_prices, prices], ignore_index=True)
extended_prices["date valid"] = pd.to_datetime(
    extended_prices["date valid"], format="ISO8601"
)
extended_prices.to_csv("assets/data/prices.csv", index=False)

# Normalise prices by date
extended_prices["price"] = extended_prices.groupby("date generated")["price"].transform(
    lambda x: x / x.sum()
)

# Join on the draw to caluclate the value of each player's stake
combined = pd.merge(extended_prices, draw, on="team")

# Grouping by player and date to caluclate the values
values = (
    combined.groupby(["name", "date generated"])["price"]
    .sum()
    .reset_index(name="price")
)
# The total pot is £140, with the champion getting £120 and the runner up getting £20
values["champion"] = values["price"] * 120
values["runner up"] = values["price"] * 20
values["total"] = values["champion"] + values["runner up"]
values["date"] = pd.to_datetime(values["date generated"], format="ISO8601")
values = values.sort_values(["date", "total"])

# Extend the subtitles data
subtitles = pd.concat(
    [
        subtitles,
        pd.DataFrame(
            [
                {
                    "date": valid_at,
                    "subtitle": event["eventMetadata"]["context_description"],
                }
            ]
        ),
    ],
    ignore_index=True,
)
subtitles.to_csv("assets/data/subtitles.csv", index=False)

# Write subtitle and chart data to a single json file for the frontend to consume
dates = sorted(values["date"].dt.strftime("%Y-%m-%dT%H:%M:%S").unique().tolist())
datasets = [
    {
        "name": name,
        "total": group.sort_values("date")["total"].round(2).tolist(),
        "champion": group.sort_values("date")["champion"].round(2).tolist(),
    }
    for name, group in values.groupby("name")
]

with open("assets/data/data.json", "w") as f:
    json.dump(
        {
            "subtitle": event["eventMetadata"]["context_description"],
            "labels": dates,
            "datasets": datasets,
        },
        f,
    )
