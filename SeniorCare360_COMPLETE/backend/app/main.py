from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.medications import router as medications_router
from app.api.health_emergency_benefits import (
    vitals_router,
    appointments_router,
    emergency_router,
    benefits_router,
)

# Create all tables on startup (use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SeniorCare360 API",
    description="The #1 Senior Care Platform — medication tracking, delivery, health vitals, benefits & emergency services.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(medications_router)
app.include_router(vitals_router)
app.include_router(appointments_router)
app.include_router(emergency_router)
app.include_router(benefits_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": "SeniorCare360 API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
