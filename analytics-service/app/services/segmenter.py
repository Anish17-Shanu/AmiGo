import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

CLUSTER_LABELS = {
    2: ["High-value", "Occasional"],
    3: ["VIP", "Loyal", "Occasional"],
    4: ["VIP", "High-value", "Loyal", "Occasional"],
    5: ["VIP", "High-value", "Loyal", "Occasional", "New"],
    6: ["VIP", "High-value", "Loyal", "Occasional", "New", "Tier 6"],
}


def _choose_cluster_count(matrix: np.ndarray, requested: int | None, sample_count: int) -> int:
    if requested is not None:
        return max(2, min(int(requested), sample_count))
    if sample_count < 4:
        return 2

    upper = min(4, sample_count - 1)
    best_k = 2
    best_score = -1.0
    for candidate in range(2, upper + 1):
        model = KMeans(n_clusters=candidate, random_state=42, n_init=10)
        labels = model.fit_predict(matrix)
        if len(set(labels)) < 2:
            continue
        score = float(silhouette_score(matrix, labels))
        if score > best_score:
            best_k = candidate
            best_score = score
    return best_k


def segment_customers(customers: list, n_clusters: int | None = None):
    if len(customers) < 2:
        return {
            "segments": [],
            "summary": [],
            "n_clusters": 0,
            "model": "kmeans_standardized",
        }

    features = np.array(
        [[float(customer["order_value"]), float(customer["order_count"])] for customer in customers]
    )
    scaled = StandardScaler().fit_transform(features)

    cluster_count = _choose_cluster_count(scaled, n_clusters, len(customers))
    model = KMeans(n_clusters=cluster_count, random_state=42, n_init=10)
    labels = model.fit_predict(scaled)

    total_revenue = float(sum(float(customer["order_value"]) for customer in customers)) or 1.0
    cluster_stats = []
    for cluster in range(cluster_count):
        members = [index for index, label in enumerate(labels) if int(label) == cluster]
        if not members:
            continue
        cluster_stats.append(
            {
                "segment": cluster,
                "customers": len(members),
                "avg_order_value": float(
                    np.mean([float(customers[index]["order_value"]) for index in members])
                ),
                "avg_order_count": float(
                    np.mean([float(customers[index]["order_count"]) for index in members])
                ),
                "revenue": float(
                    sum(float(customers[index]["order_value"]) for index in members)
                ),
            }
        )

    cluster_stats.sort(key=lambda entry: (-entry["avg_order_value"], entry["segment"]))
    label_pool = CLUSTER_LABELS.get(
        len(cluster_stats), [f"Tier {index + 1}" for index in range(len(cluster_stats))]
    )
    cluster_labels = {}
    for rank, stats in enumerate(cluster_stats):
        stats["label"] = label_pool[min(rank, len(label_pool) - 1)]
        stats["revenue_share"] = round(stats["revenue"] / total_revenue, 3)
        cluster_labels[stats["segment"]] = stats["label"]

    segments = [
        {
            "user_id": customer["user_id"],
            "segment": int(labels[index]),
            "label": cluster_labels.get(int(labels[index]), f"Segment {int(labels[index])}"),
            "order_value": float(customer["order_value"]),
            "order_count": int(customer["order_count"]),
        }
        for index, customer in enumerate(customers)
    ]

    summary = [
        {
            "segment": stats["segment"],
            "label": stats["label"],
            "customers": stats["customers"],
            "avg_order_value": round(stats["avg_order_value"], 2),
            "avg_order_count": round(stats["avg_order_count"], 2),
            "revenue": round(stats["revenue"], 2),
            "revenue_share": stats["revenue_share"],
        }
        for stats in cluster_stats
    ]

    return {
        "segments": segments,
        "summary": summary,
        "n_clusters": cluster_count,
        "model": "kmeans_standardized",
    }
