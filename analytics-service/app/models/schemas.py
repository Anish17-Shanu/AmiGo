from pydantic import BaseModel, Field
from typing import List, Optional


class Interaction(BaseModel):
    user_id: str
    product_id: str
    quantity: int = 1


class ProductPayload(BaseModel):
    _id: Optional[str] = None
    id: Optional[str] = None
    title: str
    category: str
    tags: List[str] = []


class RecommendRequest(BaseModel):
    interactions: List[Interaction] = []
    products: List[ProductPayload] = []
    user_id: Optional[str] = None


class SalesPoint(BaseModel):
    date: str
    total: float = Field(ge=0)


class ForecastRequest(BaseModel):
    sales_series: List[SalesPoint]
    horizon_days: int = Field(default=7, ge=1, le=30)


class CustomerPoint(BaseModel):
    user_id: str
    order_value: float = Field(ge=0)
    order_count: int = Field(ge=0)


class SegmentRequest(BaseModel):
    customers: List[CustomerPoint]
    n_clusters: int = Field(default=3, ge=2, le=6)
