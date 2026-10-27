from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

import numpy as np
from sklearn.linear_model import LinearRegression


def _parse_day(value) -> date | None:
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def _empty_forecast(horizon_days: int, anchor: date | None = None):
    start = anchor or datetime.now(timezone.utc).date()
    return {
        "forecast": [
            {
                "date": (start + timedelta(days=index + 1)).isoformat(),
                "predicted_total": 0.0,
            }
            for index in range(horizon_days)
        ],
        "model": "empty",
        "history_points": 0,
    }


def _weekday_factors(observed_days, observed_totals, fitted_totals):
    ratios = defaultdict(list)
    for day, actual, fitted in zip(observed_days, observed_totals, fitted_totals):
        if fitted <= 1e-6:
            continue
        ratio = float(actual) / float(fitted)
        if 0.3 <= ratio <= 3.0:
            ratios[day.weekday()].append(ratio)

    if len(observed_days) < 14 or len(ratios) < 5:
        return None
    if any(len(values) < 2 for values in ratios.values()):
        return None

    factors = {
        weekday: min(1.35, max(0.65, float(np.median(values))))
        for weekday, values in ratios.items()
    }
    mean_factor = float(np.mean(list(factors.values())))
    if mean_factor <= 0:
        return None
    return {weekday: factor / mean_factor for weekday, factor in factors.items()}


def forecast_sales(series: list, horizon_days: int = 7):
    daily = defaultdict(float)
    for point in series:
        day = _parse_day(point.get("date"))
        if day is None:
            continue
        daily[day] += max(0.0, float(point.get("total", 0)))

    if not daily:
        return _empty_forecast(horizon_days)

    observed = sorted(daily.items())
    if len(observed) == 1:
        last_day, last_total = observed[0]
        return {
            "forecast": [
                {
                    "date": (last_day + timedelta(days=index + 1)).isoformat(),
                    "predicted_total": round(last_total, 2),
                }
                for index in range(horizon_days)
            ],
            "model": "flat",
            "history_points": 1,
        }

    first_day, last_day = observed[0][0], observed[-1][0]
    continuous_days = []
    continuous_totals = []
    cursor = first_day
    while cursor <= last_day:
        continuous_days.append(cursor)
        continuous_totals.append(daily.get(cursor, 0.0))
        cursor += timedelta(days=1)

    totals = np.array(continuous_totals, dtype=float)
    positions = np.arange(len(totals)).reshape(-1, 1)
    model = LinearRegression().fit(positions, totals)
    trend = model.predict(positions)

    observed_days = [day for day, _ in observed]
    observed_totals = [total for _, total in observed]
    observed_positions = np.array(
        [(day - first_day).days for day in observed_days], dtype=float
    ).reshape(-1, 1)
    observed_trend = model.predict(observed_positions)
    factors = _weekday_factors(observed_days, observed_totals, observed_trend)

    forecast = []
    for index in range(horizon_days):
        target_day = last_day + timedelta(days=index + 1)
        future_position = np.array([[len(totals) + index]], dtype=float)
        trend_value = float(model.predict(future_position)[0])
        factor = factors.get(target_day.weekday(), 1.0) if factors else 1.0
        forecast.append(
            {
                "date": target_day.isoformat(),
                "predicted_total": round(max(0.0, trend_value * factor), 2),
            }
        )

    return {
        "forecast": forecast,
        "model": "seasonal_trend" if factors else "linear_trend",
        "history_points": len(totals),
    }
