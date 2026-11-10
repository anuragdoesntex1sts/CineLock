import os
from typing import List, Optional
from app.repositories.base import JSONFileRepository
from app.models.booking import Booking, BookedSeat
from app.config import settings


class BookingRepository(JSONFileRepository[Booking]):
    def __init__(self):
        super().__init__(
            file_path=os.path.join(settings.DATA_DIR, "bookings.json"),
            model_class=Booking,
            id_field="id",
        )

    def get_by_user(self, user_id: str) -> List[Booking]:
        bookings = self.get_by_field("user_id", user_id)
        bookings.sort(key=lambda b: b.created_at, reverse=True)
        return bookings

    def get_by_show(self, show_id: str) -> List[Booking]:
        return self.get_by_field("show_id", show_id)

    def get_by_lock_token(self, lock_token: str) -> Optional[Booking]:
        return self.get_one_by_field("lock_token", lock_token)

    def get_booked_seat_ids(self, show_id: str) -> List[str]:
        """Get all seat IDs that are booked for a show."""
        bookings = self.get_by_show(show_id)
        seat_ids = []
        for booking in bookings:
            if booking.status in ["confirmed", "completed"]:
                for seat in booking.seats:
                    seat_ids.append(seat.seat_id)
        return seat_ids

    def create_booking(self, booking: Booking) -> Booking:
        return self.create(booking)