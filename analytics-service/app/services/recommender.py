import math

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CONTENT_WEIGHT = 0.75
POPULARITY_WEIGHT = 0.25


def _interaction_counts(interactions: list, exclude_ids: frozenset = frozenset()):
    counts = {}
    for interaction in interactions:
        product_id = interaction.get("product_id")
        if not product_id or str(product_id) in exclude_ids:
            continue
        quantity = max(1, int(interaction.get("quantity", 1)))
        key = str(product_id)
        counts[key] = counts.get(key, 0) + quantity
    return counts


def _popularity_ranking(
    interactions: list,
    products_df: pd.DataFrame,
    id_col: str,
    top_n: int,
    exclude_ids: frozenset = frozenset(),
):
    counts = _interaction_counts(interactions, exclude_ids)
    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))

    if ranked:
        max_count = max(count for _, count in ranked) or 1
        return [
            {"product_id": product_id, "score": round(count / max_count, 4), "reason": "popularity"}
            for product_id, count in ranked[:top_n]
        ]

    fallback = [
        str(product_id)
        for product_id in products_df[id_col].tolist()
        if str(product_id) not in exclude_ids and str(product_id) not in {"None", "", "nan"}
    ]
    return [{"product_id": product_id, "score": 0.5, "reason": "catalog"} for product_id in fallback[:top_n]]


def _tag_text(value) -> str:
    if isinstance(value, list):
        return " ".join(str(tag) for tag in value if tag)
    return ""


def _build_content(products_df: pd.DataFrame) -> pd.Series:
    tags = products_df["tags"] if "tags" in products_df.columns else pd.Series([[]] * len(products_df))
    tag_text = tags.apply(_tag_text)
    category = products_df["category"].fillna("").astype(str)
    title = products_df["title"].fillna("").astype(str)
    # Category and tags are duplicated so they carry more weight than title filler words.
    return title + " " + category + " " + category + " " + tag_text + " " + tag_text


def _select_diverse(
    ranked_indices,
    scores,
    products_df: pd.DataFrame,
    seen_ids: set,
    id_col: str,
    top_n: int,
):
    has_category = "category" in products_df.columns
    categories = (
        products_df["category"].fillna("uncategorized").astype(str).tolist()
        if has_category
        else [f"category-{index}" for index in range(len(products_df))]
    )
    per_category_cap = max(2, math.ceil(top_n / 4))

    selected = []
    deferred = []
    category_counts = {}
    for index in ranked_indices:
        product_id = str(products_df.iloc[index][id_col])
        if product_id in seen_ids:
            continue
        category = categories[index]
        if category_counts.get(category, 0) < per_category_cap:
            category_counts[category] = category_counts.get(category, 0) + 1
            selected.append(index)
        else:
            deferred.append(index)
        if len(selected) >= top_n:
            break

    for index in deferred:
        if len(selected) >= top_n:
            break
        selected.append(index)

    return [
        {"product_id": str(products_df.iloc[index][id_col]), "score": round(float(scores[index]), 4), "reason": "hybrid"}
        for index in selected[:top_n]
    ]


def recommend_products(interactions: list, products: list, user_id: str | None = None, top_n: int = 8):
    if not products:
        return {"recommendations": [], "strategy": "empty"}

    products_df = pd.DataFrame(products)
    id_col = next(
        (column for column in ("_id", "id", "product_id") if column in products_df.columns),
        None,
    )
    if id_col is None:
        products_df["_id"] = [f"prod-{index}" for index in range(len(products_df))]
        id_col = "_id"

    products_df = products_df[
        products_df[id_col].notna() & (products_df[id_col].astype(str) != "None")
    ].reset_index(drop=True)
    if products_df.empty:
        return {"recommendations": [], "strategy": "empty"}

    aggregate_scope = user_id is None
    if aggregate_scope:
        user_history = list(interactions)
        excluded_ids = set()
    else:
        user_history = [
            interaction
            for interaction in interactions
            if str(interaction.get("user_id")) == str(user_id)
        ]
        excluded_ids = {
            str(interaction.get("product_id"))
            for interaction in user_history
            if interaction.get("product_id")
        }

    profile_ids = {
        str(interaction.get("product_id"))
        for interaction in user_history
        if interaction.get("product_id")
    }

    if not user_history:
        return {
            "recommendations": _popularity_ranking(interactions, products_df, id_col, top_n),
            "strategy": "popularity",
        }

    seen_indices = products_df[products_df[id_col].astype(str).isin(profile_ids)].index.tolist()
    if not seen_indices:
        return {
            "recommendations": _popularity_ranking(
                interactions, products_df, id_col, top_n, exclude_ids=frozenset(excluded_ids)
            ),
            "strategy": "popularity",
        }

    content = _build_content(products_df)
    if content.str.strip().eq("").all():
        return {
            "recommendations": _popularity_ranking(
                interactions, products_df, id_col, top_n, exclude_ids=frozenset(excluded_ids)
            ),
            "strategy": "popularity",
        }

    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
        matrix = vectorizer.fit_transform(content)
        if matrix.shape[1] == 0:
            raise ValueError("empty vocabulary")
    except ValueError:
        return {
            "recommendations": _popularity_ranking(
                interactions, products_df, id_col, top_n, exclude_ids=frozenset(excluded_ids)
            ),
            "strategy": "popularity",
        }

    user_quantities = {}
    for interaction in user_history:
        product_id = str(interaction.get("product_id") or "")
        if product_id:
            user_quantities[product_id] = user_quantities.get(product_id, 0) + max(
                1, int(interaction.get("quantity", 1))
            )
    quantities = np.array(
        [
            user_quantities.get(str(products_df.iloc[index][id_col]), 1.0)
            for index in seen_indices
        ],
        dtype=float,
    )
    weighted_history = matrix[seen_indices].multiply(quantities.reshape(-1, 1))
    profile = np.asarray(weighted_history.sum(axis=0)) / float(quantities.sum())
    content_scores = cosine_similarity(profile, matrix).ravel()

    counts = _interaction_counts(interactions)
    max_count = max(counts.values()) if counts else 0
    popularity_scores = np.array(
        [
            (counts.get(str(product_id), 0) / max_count) if max_count else 0.0
            for product_id in products_df[id_col].astype(str).tolist()
        ],
        dtype=float,
    )

    if content_scores.max(initial=0.0) <= 0:
        return {
            "recommendations": _popularity_ranking(
                interactions, products_df, id_col, top_n, exclude_ids=frozenset(excluded_ids)
            ),
            "strategy": "popularity",
        }

    hybrid_scores = (CONTENT_WEIGHT * content_scores) + (POPULARITY_WEIGHT * popularity_scores)
    ranked_indices = np.argsort(-hybrid_scores, kind="stable").tolist()

    recommendations = _select_diverse(
        ranked_indices, hybrid_scores, products_df, excluded_ids, id_col, top_n
    )
    if not recommendations:
        return {
            "recommendations": _popularity_ranking(
                interactions, products_df, id_col, top_n, exclude_ids=frozenset(excluded_ids)
            ),
            "strategy": "popularity",
        }

    return {
        "recommendations": recommendations,
        "strategy": "hybrid_tfidf_popularity",
        "scope": "aggregate" if aggregate_scope else "user",
        "weights": {"content": CONTENT_WEIGHT, "popularity": POPULARITY_WEIGHT},
    }
