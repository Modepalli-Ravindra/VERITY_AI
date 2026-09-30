import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure project root directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Load root .env
dotenv_path = os.path.join(root_dir, '.env')
load_dotenv(dotenv_path)

try:
    from backend.api.router import router, limiter
except ModuleNotFoundError:
    from api.router import router, limiter

app = FastAPI(
    title="VERITY AI/ML Service",
    description="Transformer Semantic Representation + Stylometric Feature Fusion Detection API",
    version="1.0.0"
)

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
