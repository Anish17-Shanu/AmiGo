import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _popularity_ranking(interactions: list, products_df: pd.DataFrame, id_col: str, top_n: int):
    popularity = {}
    for interaction in interactions:
        pid = interaction.get("product_id")
        if not pid:
            continue
        popularity[pid] = popularity.get(pid, 0) + int(interaction.get("quantity", 1))

    ranked = sorted(popularity.items(), key=lambda x: x[1], reverse=True)
    if ranked:
        return [{"product_id": pid, "score": score} for pid, score in ranked[:top_n]]

    fallback_ids = [pid for pid in products_df[id_col].tolist() if pid not in (None, "", "None")]
    return [{"product_id": str(pid), "score": 0.5} for pid in fallback_ids[:top_n]]


def recommend_products(interactions: list, products: list, user_id: str | None = None, top_n: int = 8):
    if not products:
        return {"recommendations": []}

    products_df = pd.DataFrame(products)
    id_col = next(
        (column for column in ("_id", "id", "product_id") if column in products_df.columns),
        None,
    )
    if id_col is None:
        products_df["_id"] = [f"prod-{i}" for i in range(len(products_df))]
        id_col = "_id"

    products_df = products_df[
        products_df[id_col].notna() & (products_df[id_col].astype(str) != "None")
    ].reset_index(drop=True)
    if products_df.empty:
        return {"recommendations": []}

    tags = products_df["tags"] if "tags" in products_df.columns else pd.Series([[]] * len(products_df))
    products_df["content"] = (
        products_df["title"].fillna("")
        + " "
        + products_df["category"].fillna("")
        + " "
        + tags.apply(lambda x: " ".join(x) if isinstance(x, list) else "")
    )

    user_history = [item for item in interactions if item.get("user_id") == user_id]
    seen_ids = {item.get("product_id") for item in user_history}

    if not user_history:
        return {"recommendations": _popularity_ranking(interactions, products_df, id_col, top_n)}

    seen_indices = products_df[products_df[id_col].astype(str).isin({str(x) for x in seen_ids})].index.tolist()
    if not seen_indices:
        return {"recommendations": _popularity_ranking(interactions, products_df, id_col, top_n)}

    if products_df["content"].str.strip().eq("").all():
        return {"recommendations": _popularity_ranking(interactions, products_df, id_col, top_n)}

    try:
        tfidf = TfidfVectorizer(stop_words="english")
        matrix = tfidf.fit_transform(products_df["content"])
        similarity = cosine_similarity(matrix)
    except ValueError:
        return {"recommendations": _popularity_ranking(interactions, products_df, id_col, top_n)}

    aggregate_scores = np.mean(similarity[seen_indices], axis=0)
    ranked_indices = np.argsort(aggregate_scores)[::-1]

    output = []
    for idx in ranked_indices:
        pid = str(products_df.iloc[idx][id_col])
        if pid in {str(x) for x in seen_ids}:
            continue
        output.append({"product_id": pid, "score": float(aggregate_scores[idx])})
        if len(output) >= top_n:
            break

    if not output:
        return {"recommendations": _popularity_ranking(interactions, products_df, id_col, top_n)}

    return {"recommendations": output}
