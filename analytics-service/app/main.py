from fastapi import FastAPI
from app.api.routes import router
from app.core.config import settings

app = FastAPI(title=settings.service_name, version="1.1.0")
app.include_router(router)


@app.get("/")
def index():
    return {
        "success": True,
        "service": settings.service_name,
        "version": app.version,
        "endpoints": ["/health", "/recommend", "/forecast", "/segment"],
    }
