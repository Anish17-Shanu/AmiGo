import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def recommend_products(interactions: list, products: list, user_id: str | None = None, top_n: int = 8):
    if not products:
        return {"recommendations": []}

    products_df = pd.DataFrame(products)
    id_col = "_id" if "_id" in products_df.columns else "id" if "id" in products_df.columns else None
    if id_col is None:
        products_df["_id"] = [f"prod-{i}" for i in range(len(products_df))]
        id_col = "_id"

    products_df["content"] = products_df["title"].fillna("") + " " + products_df["category"].fillna("") + " " + products_df["tags"].apply(lambda x: " ".join(x) if isinstance(x, list) else "")

    tfidf = TfidfVectorizer(stop_words="english")
    matrix = tfidf.fit_transform(products_df["content"])
    similarity = cosine_similarity(matrix)

    # Fallback: highest aggregate co-occurrence/popularity from interactions.
    popularity = {}
    for interaction in interactions:
        pid = interaction.get("product_id")
        popularity[pid] = popularity.get(pid, 0) + int(interaction.get("quantity", 1))

    if not user_id:
        ranked = sorted(popularity.items(), key=lambda x: x[1], reverse=True)
        if ranked:
            return {"recommendations": [{"product_id": pid, "score": score} for pid, score in ranked[:top_n]]}

    user_history = [item for item in interactions if item.get("user_id") == user_id]
    if not user_history:
        default_rank = products_df[id_col].head(top_n).tolist()
        return {"recommendations": [{"product_id": pid, "score": 0.5} for pid in default_rank]}

    seen_ids = {item.get("product_id") for item in user_history}
    seen_indices = products_df[products_df[id_col].astype(str).isin({str(x) for x in seen_ids})].index.tolist()

    if not seen_indices:
        default_rank = products_df[id_col].head(top_n).tolist()
        return {"recommendations": [{"product_id": pid, "score": 0.4} for pid in default_rank]}

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

    return {"recommendations": output}
