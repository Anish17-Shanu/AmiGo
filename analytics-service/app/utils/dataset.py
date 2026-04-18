import pandas as pd


def load_sample_data(path: str = "data/sample_sales.csv"):
    df = pd.read_csv(path)
    return df.to_dict(orient="records")
