import asyncio
from app.config import settings
from app.repositories.seat_lock_repo import SeatLockRepository


async def cleanup_expired_locks():
    """Background task to clean up expired seat locks."""
    seat_lock_repo = SeatLockRepository()
    while True:
        try:
            await asyncio.sleep(settings.SEAT_LOCK_CLEANUP_INTERVAL_SECONDS)
            deleted = seat_lock_repo.delete_expired()
            if deleted:
                print(f"Cleaned up {deleted} expired seat locks")
        except Exception as e:
            print(f"Lock cleanup error: {e}")


def start_cleanup_task():
    """Start the background cleanup task."""
    asyncio.create_task(cleanup_expired_locks())