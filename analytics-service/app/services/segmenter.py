import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def segment_customers(customers: list, n_clusters: int = 3):
    if len(customers) < n_clusters:
        n_clusters = max(2, min(len(customers), n_clusters))

    if len(customers) < 2:
        return {"segments": []}

    X = np.array([[float(c["order_value"]), float(c["order_count"])] for c in customers])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = model.fit_predict(X_scaled)

    output = []
    for i, customer in enumerate(customers):
        output.append(
            {
                "user_id": customer["user_id"],
                "segment": int(labels[i]),
                "order_value": customer["order_value"],
                "order_count": customer["order_count"],
            }
        )

    return {"segments": output}
