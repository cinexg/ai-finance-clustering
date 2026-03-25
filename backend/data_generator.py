import uuid
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# Seed for reproducibility during development
random.seed(42)
np.random.seed(42)

# Vendor definitions: each entry is (display variants, amount sampler)
# Variants simulate the noisy vendor strings seen in real bank exports.
VENDOR_PROFILES = [
    {
        "variants": ["Netflix", "NETFLIX.COM", "NETFLIX *1"],
        "amount": lambda: round(random.choice([15.49, 15.99, 22.99]), 2),
    },
    {
        "variants": ["Spotify", "SPOTIFY USA", "Spotify Premium"],
        "amount": lambda: round(random.choice([9.99, 10.99]), 2),
    },
    {
        "variants": ["Amazon", "AMZN Mktp US", "Amazon.com*1A2B3C", "AMZ*Digital"],
        "amount": lambda: round(random.uniform(8.99, 189.99), 2),
    },
    {
        "variants": ["Uber", "UBER *TRIP", "Uber Trip", "UBER* PENDING"],
        "amount": lambda: round(random.uniform(9.50, 52.00), 2),
    },
    {
        "variants": ["Uber Eats", "UBER* EATS", "UberEATS"],
        "amount": lambda: round(random.uniform(18.00, 65.00), 2),
    },
    {
        "variants": ["Starbucks", "STARBUCKS #1234", "Starbucks Coffee"],
        "amount": lambda: round(random.uniform(5.25, 14.75), 2),
    },
    {
        "variants": ["Steam", "STEAM GAMES", "Valve/Steam"],
        "amount": lambda: round(random.choice([4.99, 9.99, 19.99, 29.99, 59.99]), 2),
    },
    {
        "variants": ["Whole Foods", "WHOLE FOODS MKT", "WFM *Online"],
        "amount": lambda: round(random.uniform(22.00, 145.00), 2),
    },
    {
        "variants": ["Target", "TARGET #0456", "Target.com"],
        "amount": lambda: round(random.uniform(15.00, 210.00), 2),
    },
    {
        "variants": ["Shell", "SHELL OIL 57442", "Shell Gas Station"],
        "amount": lambda: round(random.uniform(35.00, 95.00), 2),
    },
    {
        "variants": ["Chase ATM", "ATM WITHDRAWAL", "ATM FEE"],
        "amount": lambda: round(random.choice([20.00, 40.00, 60.00, 100.00, 200.00]), 2),
    },
    {
        "variants": ["Planet Fitness", "PLANET FITNESS*", "PLANET FIT #0023"],
        "amount": lambda: round(random.choice([10.00, 24.99]), 2),
    },
    {
        "variants": ["CVS Pharmacy", "CVS/PHARMACY #8812", "CVS PHARM"],
        "amount": lambda: round(random.uniform(4.99, 55.00), 2),
    },
]

TODAY = datetime(2026, 3, 25)
NINETY_DAYS_AGO = TODAY - timedelta(days=90)


def _random_date() -> str:
    delta = (TODAY - NINETY_DAYS_AGO).days
    random_day = NINETY_DAYS_AGO + timedelta(days=random.randint(0, delta))
    return random_day.strftime("%Y-%m-%d")


def generate_transactions(n: int = 200) -> list[dict]:
    rows = []
    for i in range(n):
        profile = random.choice(VENDOR_PROFILES)
        vendor = random.choice(profile["variants"])
        amount = profile["amount"]()
        date = _random_date()

        # Inject ~2-3 intentional data quality issues spread across the 200 rows.
        # Issue 1: null amount on row 47
        if i == 47:
            amount = None
        # Issue 2: malformed date string on row 113 (missing leading zero, non-ISO)
        if i == 113:
            date = "3/5/2026"
        # Issue 3: null vendor on row 178
        if i == 178:
            vendor = None

        rows.append(
            {
                "transaction_id": str(uuid.uuid4()),
                "date": date,
                "vendor": vendor,
                "amount": amount,
            }
        )

    return rows


def generate_transactions_df(n: int = 200) -> pd.DataFrame:
    """Return transactions as a cleaned DataFrame (used by ML layer later)."""
    df = pd.DataFrame(generate_transactions(n))
    # Coerce dates — handles both ISO and M/D/YYYY formats
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    return df
