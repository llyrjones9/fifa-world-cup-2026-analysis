import pandas as pd
import requests
from ast import literal_eval
from datetime import datetime
import os
import json

# Load draw data - Who has which teams
from draw import draw

date_retrieved = datetime.now().isoformat()

draw = pd.DataFrame(list(draw.items()), columns=["team", "name"])

# Create or load the past prices and subtitles data
subtitles_file = "assets/data/subtitles.csv"
if not os.path.exists(subtitles_file):
    subtitles = pd.DataFrame(
        columns=[
            "date-retrieved",
            "date-generated-win",
            "subtitle-win",
            "date-generated-final",
            "subtitle-final",
        ]
    )
else:
    subtitles = pd.read_csv(subtitles_file)

prices_file = "assets/data/prices.csv"
if not os.path.exists(prices_file):
    existing_prices = pd.DataFrame(
        columns=[
            "team",
            "date-retrieved",
            "price-win",
            "date-generated-win",
            "price-final",
            "date-generated-final",
        ]
    )
else:
    existing_prices = pd.read_csv(prices_file)


# Retrieve odds from Polymarket API
def get_event_data(slug: str, suffix: str) -> tuple[pd.DataFrame, str, str]:
    """Fetches the odds for a given event slug from the Polymarket API and returns the generated date and a DataFrame of team odds.
    inputs:
        slug: The slug of the event to fetch odds for (e.g., "world-cup-winner")
        suffix: The suffix to append to column names when merging DataFrames
    outputs:
        tuple[pd.DataFrame, str, str]: A tuple containing a DataFrame of teams odds, the date those odds were generated, and the market subtitle.
    """

    response = requests.get(f"https://gamma-api.polymarket.com/events/slug/{slug}")
    event = response.json()

    valid_at = event["updatedAt"]  # This is the time these odds are valid for

    # This is the odds for each team
    markets = [
        {
            "team": team.get("groupItemTitle"),
            f"price-{suffix}": float(
                literal_eval(team.get("outcomePrices", "[0,1]"))[0],
            ),
            f"date-valid-{suffix}": valid_at,
        }
        for team in event["markets"]
        if team.get("groupItemTitle") in list(draw["team"])
    ]

    prices = pd.DataFrame(markets)
    subtitle = (event["eventMetadata"]["context_description"],)
    return prices, valid_at, subtitle


# Retrieve odds for the winner and the nation to reach the final, along with the dates those odds are valid for
winner, winner_valid_at, winner_subtitle = get_event_data("world-cup-winner", "win")
to_reach_final, final_valid_at, final_subtitle = get_event_data(
    "world-cup-nation-to-reach-final", "final"
)

prices = pd.DataFrame({"team": list(draw["team"])})
prices = pd.merge(prices, winner, on="team", how="left")
prices = pd.merge(prices, to_reach_final, on="team", how="left")

# Missing values for dates will be filled with the mode (because they are all the same)
# Missing values for prices will be filled with 0
prices["date-valid-win"] = prices["date-valid-win"].fillna(
    prices["date-valid-win"].mode()[0]
)
prices["date-valid-final"] = prices["date-valid-final"].fillna(
    prices["date-valid-final"].mode()[0]
)
prices["price-win"] = prices["price-win"].fillna(0)
prices["price-final"] = prices["price-final"].fillna(0)
prices["date-retrieved"] = date_retrieved

# Tack the the prices onto the existing prices data to extend the record over time
# prices = pd.join()
pass

extended_prices = pd.concat([existing_prices, prices], ignore_index=True)
extended_prices["date-valid-win"] = pd.to_datetime(
    extended_prices["date-valid-win"], format="ISO8601"
)
extended_prices["date-valid-final"] = pd.to_datetime(
    extended_prices["date-valid-final"], format="ISO8601"
)
extended_prices.to_csv("assets/data/prices.csv", index=False)

# Normalise prices by date
extended_prices["price-win"] = extended_prices.groupby("date-valid-win")[
    "price-win"
].transform(lambda x: x / x.sum())

# Normalise prices by date
extended_prices["price-final"] = extended_prices.groupby("date-valid-final")[
    "price-final"
].transform(lambda x: 2 * x / x.sum())

extended_prices["price-runner-up"] = (
    extended_prices["price-final"] - extended_prices["price-win"]
)

# Join on the draw to calculate the value of each player's stake
combined = pd.merge(extended_prices, draw, on="team")

# Grouping by player and date to calculate the values
values_win = (
    combined.groupby(["name", "date-retrieved"])["price-win"]
    .sum()
    .reset_index(name="price-win")
)
values_runner_up = (
    combined.groupby(["name", "date-retrieved"])["price-runner-up"]
    .sum()
    .reset_index(name="price-runner-up")
)
values = pd.merge(values_win, values_runner_up, on=["name", "date-retrieved"])

# The total pot is £140, with the champion getting £120 and the runner up getting £20

values["champion"] = values["price-win"] * 120
values["runner up"] = values["price-runner-up"] * 20
values["total"] = values["champion"] + values["runner up"]
values["date"] = pd.to_datetime(values["date-retrieved"], format="ISO8601")
values = values.sort_values(["date", "total"])

# Extend the subtitles data
subtitles = pd.concat(
    [
        subtitles,
        pd.DataFrame(
            [
                {
                    "date-retrieved": date_retrieved,
                    "subtitle-win": winner_subtitle,
                    "subtitle-final": final_subtitle,
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

with open("assets/data/chart-data.json", "w") as f:
    json.dump(
        {
            "subtitle-win": winner_subtitle,
            "subtitle-final": final_subtitle,
            "labels": dates,
            "datasets": datasets,
        },
        f,
        indent=2,
    )
