from .auth import router as auth_router
from .movies import router as movies_router
from .theaters import router as theaters_router
from .shows import router as shows_router
from .seats import router as seats_router
from .payments import router as payments_router
from .bookings import router as bookings_router
from .locations import router as locations_router

__all__ = ["auth_router", "movies_router", "theaters_router", "shows_router", "seats_router", "payments_router", "bookings_router", "locations_router"]
