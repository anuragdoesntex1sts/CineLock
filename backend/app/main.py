from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth_router, movies_router, theaters_router, shows_router, seats_router, payments_router, bookings_router, locations_router
from app.tasks import start_cleanup_task


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_cleanup_task()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.APP_NAME,
    description="Movie Ticket Booking System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(movies_router, prefix=settings.API_PREFIX)
app.include_router(theaters_router, prefix=settings.API_PREFIX)
app.include_router(shows_router, prefix=settings.API_PREFIX)
app.include_router(seats_router, prefix=settings.API_PREFIX)
app.include_router(payments_router, prefix=settings.API_PREFIX)
app.include_router(bookings_router, prefix=settings.API_PREFIX)
app.include_router(locations_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
