from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.core.database import engine, Base
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.family import router as family_router
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

docs_enabled = settings.is_development or settings.SHOW_API_DOCS

app = FastAPI(
    title="SeniorCare360 API",
    description="The #1 Senior Care Platform — medication tracking, delivery, health vitals, benefits & emergency services.",
    version="1.0.0",
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

# CORS — keep origins explicit in deployed environments.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        if not settings.is_development:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


app.add_middleware(SecurityHeadersMiddleware)

# Register all routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(family_router)
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
        "docs": "/docs" if docs_enabled else None,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
