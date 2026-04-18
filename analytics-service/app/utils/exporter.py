import os
import pandas as pd
import matplotlib.pyplot as plt


def export_forecast_chart(forecast_data: list, output_path: str = "data/forecast.png"):
    if not forecast_data:
        return None

    df = pd.DataFrame(forecast_data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    plt.figure(figsize=(8, 4))
    plt.plot(df["date"], df["predicted_total"], marker="o")
    plt.title("Forecasted Sales")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    return output_path
