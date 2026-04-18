from dotenv import load_dotenv
from pydantic import BaseModel
import os

load_dotenv()


class Settings(BaseModel):
    service_name: str = os.getenv("SERVICE_NAME", "AmiGo Analytics Service")
    service_port: int = int(os.getenv("SERVICE_PORT", "8000"))


settings = Settings()
