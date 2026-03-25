import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler

N_CLUSTERS = 5

# Keywords used to assign human-readable names to clusters post-fit.
# Ordered by priority — first category to exceed 0 hits wins; ties broken
# by whichever keyword list has the most matches.
_CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("Subscriptions", ["netflix", "spotify", "hulu", "prime", "digital", "premium", "plus"]),
    ("Transport", ["uber", "lyft", "trip", "shell", "gas", "fuel", "oil", "atm", "withdrawal"]),
    ("Food & Dining", ["eats", "starbucks", "coffee", "food", "doordash", "grubhub", "restaurant"]),
    ("Shopping", ["amazon", "amzn", "target", "whole foods", "wfm", "cvs", "pharmacy", "mktp"]),
    ("Entertainment & Health", ["steam", "valve", "game", "fitness", "planet", "gym", "sport"]),
]


def _assign_label(vendor_texts: list[str]) -> str:
    """Score each category against the aggregated vendor text in a cluster."""
    combined = " ".join(v.lower() for v in vendor_texts if v)
    best_label = "Misc"
    best_score = 0
    for label, keywords in _CATEGORY_KEYWORDS:
        score = sum(kw in combined for kw in keywords)
        if score > best_score:
            best_score = score
            best_label = label
    return best_label


def cluster_transactions(transactions: list[dict]) -> list[dict]:
    """
    Clean raw transaction dicts, engineer features, run K-Means clustering,
    and return the original records augmented with `cluster_id` and `cluster_name`.
    """
    if len(transactions) < N_CLUSTERS:
        return transactions

    df = pd.DataFrame(transactions)

    # ------------------------------------------------------------------ #
    # 1. Data Cleaning                                                     #
    # ------------------------------------------------------------------ #
    # Coerce dates: handles both ISO "YYYY-MM-DD" and non-standard "M/D/YYYY"
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # Coerce amounts and fill nulls with the column median
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    median_amount = df["amount"].median()
    df["amount"] = df["amount"].fillna(median_amount)

    # Null vendors become "Unknown" so they don't break the vectorizer
    df["vendor"] = df["vendor"].fillna("Unknown")

    # ------------------------------------------------------------------ #
    # 2. Feature Engineering                                               #
    # ------------------------------------------------------------------ #
    # Character n-gram TF-IDF: robust to noisy vendor strings and
    # abbreviations (e.g. "AMZN Mktp" ≈ "Amazon", "UBER *TRIP" ≈ "Uber Trip")
    tfidf = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 4),
        max_features=60,
        sublinear_tf=True,
    )
    vendor_matrix = tfidf.fit_transform(df["vendor"])  # sparse (n, 60)

    scaler = StandardScaler()
    amount_scaled = scaler.fit_transform(df[["amount"]])  # dense (n, 1)

    # Combine: convert sparse TF-IDF to dense then stack horizontally
    features = np.hstack([vendor_matrix.toarray(), amount_scaled])  # (n, 61)

    # ------------------------------------------------------------------ #
    # 3. K-Means Clustering                                                #
    # ------------------------------------------------------------------ #
    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init="auto")
    df["cluster_id"] = kmeans.fit_predict(features)

    # ------------------------------------------------------------------ #
    # 4. Human-Readable Cluster Labels (unique per cluster)               #
    # ------------------------------------------------------------------ #
    # Score every cluster against every category, then greedily assign
    # labels highest-score-first so no two clusters share the same name.
    scored: list[tuple[int, list[tuple[int, str]]]] = []
    for cluster_id in range(N_CLUSTERS):
        mask = df["cluster_id"] == cluster_id
        combined = " ".join(
            v.lower() for v in df.loc[mask, "vendor"].tolist() if v
        )
        ranking = sorted(
            ((sum(kw in combined for kw in kws), label) for label, kws in _CATEGORY_KEYWORDS),
            reverse=True,
        )
        scored.append((cluster_id, ranking))

    # Process clusters that have the strongest keyword signal first
    scored.sort(key=lambda x: x[1][0][0], reverse=True)

    used_labels: set[str] = set()
    cluster_labels: dict[int, str] = {}
    for cluster_id, ranking in scored:
        for _, label in ranking:
            if label not in used_labels:
                cluster_labels[cluster_id] = label
                used_labels.add(label)
                break
        else:
            # All named categories taken — fall back to a numbered Misc slot
            fallback = next(
                f"Misc {i}" if i else "Misc"
                for i in range(N_CLUSTERS)
                if (f"Misc {i}" if i else "Misc") not in used_labels
            )
            cluster_labels[cluster_id] = fallback
            used_labels.add(fallback)

    df["cluster_name"] = df["cluster_id"].map(cluster_labels)

    # ------------------------------------------------------------------ #
    # 5. Merge results back onto the original transaction dicts            #
    # ------------------------------------------------------------------ #
    result = []
    for i, original in enumerate(transactions):
        enriched = dict(original)
        enriched["cluster_id"] = int(df.at[i, "cluster_id"])
        enriched["cluster_name"] = df.at[i, "cluster_name"]
        result.append(enriched)

    return result
