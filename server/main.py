from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predict, optimize, profile
from db.database import init_db

app = FastAPI(title="KB 밸런스 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api/predict/garch", tags=["predict"])
app.include_router(optimize.router, prefix="/api/optimize/hrp", tags=["optimize"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def health_check():
    return {"status": "ok"}