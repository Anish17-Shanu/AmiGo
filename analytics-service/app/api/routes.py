from fastapi import APIRouter
from app.models.schemas import RecommendRequest, ForecastRequest, SegmentRequest
from app.services.recommender import recommend_products
from app.services.forecaster import forecast_sales
from app.services.segmenter import segment_customers

router = APIRouter()


@router.get("/health")
def health_check():
    return {"success": True, "status": "ok"}


@router.post("/recommend")
def recommend(payload: RecommendRequest):
    return recommend_products(
        interactions=[i.model_dump() for i in payload.interactions],
        products=[p.model_dump() for p in payload.products],
        user_id=payload.user_id,
    )


@router.post("/forecast")
def forecast(payload: ForecastRequest):
    return forecast_sales(series=[point.model_dump() for point in payload.sales_series], horizon_days=payload.horizon_days)


@router.post("/segment")
def segment(payload: SegmentRequest):
    return segment_customers(customers=[customer.model_dump() for customer in payload.customers], n_clusters=payload.n_clusters)
