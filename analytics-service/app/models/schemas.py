from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from typing import List, Optional


class Interaction(BaseModel):
    user_id: str
    product_id: str
    quantity: int = Field(default=1, ge=1)


class ProductPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("_id", "id", "product_id"),
    )
    title: str
    category: str
    tags: List[str] = []


class RecommendRequest(BaseModel):
    interactions: List[Interaction] = Field(default_factory=list, max_length=10000)
    products: List[ProductPayload] = Field(default_factory=list, max_length=5000)
    user_id: Optional[str] = None
    top_n: int = Field(default=8, ge=1, le=20)


class SalesPoint(BaseModel):
    date: str
    total: float = Field(ge=0)


class ForecastRequest(BaseModel):
    sales_series: List[SalesPoint] = Field(default_factory=list, max_length=3660)
    horizon_days: int = Field(default=7, ge=1, le=30)


class CustomerPoint(BaseModel):
    user_id: str
    order_value: float = Field(ge=0)
    order_count: int = Field(ge=0)


class SegmentRequest(BaseModel):
    customers: List[CustomerPoint] = Field(default_factory=list, max_length=10000)
    n_clusters: Optional[int] = Field(default=None, ge=2, le=6)
