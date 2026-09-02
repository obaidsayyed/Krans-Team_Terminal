from fastapi import FastAPI

from app.api.routes.complaints import router as complaints_router
from app.api.routes.departments import router as departments_router
from app.api.routes.health import router as health_router
from app.api.routes.routing import router as routing_router
from app.api.routes.tracking import router as tracking_router


app = FastAPI(
    title="AI Grievance Redressal System",
    description=(
        "Backend for AI-powered grievance "
        "analysis, routing and tracking"
    ),
    version="0.2.0",
)


app.include_router(complaints_router)
app.include_router(departments_router)
app.include_router(routing_router)
app.include_router(tracking_router)
app.include_router(health_router)


@app.get("/")
def root():
    return {
        "service": "AI Grievance Redressal System",
        "status": "running",
        "version": "0.2.0",
    }