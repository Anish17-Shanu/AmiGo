from datetime import datetime, timedelta
import numpy as np
from sklearn.linear_model import LinearRegression


def forecast_sales(series: list, horizon_days: int = 7):
    if len(series) < 2:
        return {
            "forecast": [
                {
                    "date": (datetime.utcnow() + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
                    "predicted_total": 0.0,
                }
                for i in range(horizon_days)
            ]
        }

    sorted_series = sorted(series, key=lambda x: x["date"])
    y = np.array([float(item["total"]) for item in sorted_series])
    X = np.arange(len(sorted_series)).reshape(-1, 1)

    model = LinearRegression()
    model.fit(X, y)

    start = len(sorted_series)
    future_x = np.arange(start, start + horizon_days).reshape(-1, 1)
    preds = model.predict(future_x)

    last_date = datetime.fromisoformat(sorted_series[-1]["date"].replace("Z", ""))
    forecast = []
    for i, pred in enumerate(preds):
        forecast.append(
            {
                "date": (last_date + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
                "predicted_total": max(0.0, round(float(pred), 2)),
            }
        )

    return {"forecast": forecast}
