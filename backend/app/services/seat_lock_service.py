from datetime import datetime, timedelta
from typing import List, Optional
from app.repositories import SeatLockRepository, ShowRepository
from app.models.seat_lock import SeatLock
from app.schemas.seat import (
    SeatLockRequest,
    SeatLockResponse,
    SeatConfirmRequest,
    SeatReleaseRequest,
    SeatActionResponse,
    SeatMapResponse,
    SeatResponse,
)
from app.config import settings


class SeatLockService:
    def __init__(self):
        self.seat_lock_repo = SeatLockRepository()
        self.show_repo = ShowRepository()

    def lock_seats(self, show_id: str, seat_ids: List[str], user_id: str) -> SeatLockResponse:
        """Lock seats for a user. Returns lock_token and expiry."""
        show = self.show_repo.get_by_id(show_id)
        if not show:
            raise ValueError("Show not found")

        # Validate seat count
        if len(seat_ids) > 10:
            raise ValueError("Maximum 10 seats per booking")

        expires_at = datetime.utcnow() + timedelta(minutes=settings.SEAT_LOCK_TTL_MINUTES)

        success, message, locks = self.seat_lock_repo.atomic_create_locks(
            show_id=show_id,
            seat_ids=seat_ids,
            user_id=user_id,
            expires_at=expires_at,
        )

        if not success:
            raise ValueError(message)

        # Get screen info for seat map
        from app.repositories import ScreenRepository
        screen_repo = ScreenRepository()
        screen = screen_repo.get_by_id(show.screen_id)

        locked_seats = []
        for lock in locks:
            locked_seats.append(SeatResponse(
                seat_id=lock.seat_id,
                row=lock.seat_id[0] if lock.seat_id else "A",
                number=int(lock.seat_id[1:]) if len(lock.seat_id) > 1 else 1,
                status="locked",
                price=show.price,
                is_wheelchair=False,
                lock_expires_at=lock.expires_at,
                locked_by_user_id=lock.user_id,
            ))

        return SeatLockResponse(
            lock_token=message,
            expires_at=expires_at,
            locked_seats=locked_seats,
        )

    def confirm_locks(self, lock_token: str, payment_id: str, user_id: str) -> SeatActionResponse:
        """Confirm locks and convert to booked seats. Removes locks."""
        success, message, locks = self.seat_lock_repo.atomic_confirm_locks(lock_token)

        if not success:
            return SeatActionResponse(success=False, message=message)

        # Verify ownership
        if locks and locks[0].user_id != user_id:
            # Re-lock if auth failed
            self.seat_lock_repo.atomic_create_locks(
                locks[0].show_id, [l.seat_id for l in locks], locks[0].user_id, locks[0].expires_at
            )
            return SeatActionResponse(success=False, message="Unauthorized: lock belongs to another user")

        # Create Booking
        from app.repositories import BookingRepository
        from app.models.booking import Booking, BookedSeat
        import random
        import string

        booking_repo = BookingRepository()
        show = self.show_repo.get_by_id(locks[0].show_id)

        booked_seats = [
            BookedSeat(seat_id=l.seat_id, row=l.seat_id[0], number=int(l.seat_id[1:]), price=show.price)
            for l in locks
        ]

        booking = Booking(
            user_id=user_id,
            show_id=locks[0].show_id,
            seats=booked_seats,
            total_amount=show.price * len(locks),
            status="confirmed",
            payment_id=payment_id,
            lock_token=lock_token,
            booking_reference=''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        )
        booking_repo.create(booking)

        return SeatActionResponse(
            success=True,
            message="Locks confirmed",
            lock_token=lock_token,
            booking_id=booking.id,
        )

    def extend_locks(self, lock_token: str, additional_minutes: int, user_id: str) -> SeatActionResponse:
        """Extend lock expiry time."""
        locks = self.seat_lock_repo.get_by_lock_token(lock_token)
        if not locks:
            return SeatActionResponse(success=False, message="Lock token not found")

        if locks[0].user_id != user_id:
            return SeatActionResponse(success=False, message="Unauthorized: lock belongs to another user")

        if locks[0].is_expired():
            return SeatActionResponse(success=False, message="Lock has already expired")

        new_expires_at = datetime.utcnow() + timedelta(minutes=additional_minutes)

        def operation(data):
            updated = False
            for item in data:
                if item.get("lock_token") == lock_token:
                    item["expires_at"] = new_expires_at.isoformat()
                    updated = True
            return updated

        success = self.seat_lock_repo.atomic_operation(operation)
        if success:
            return SeatActionResponse(
                success=True,
                message="Locks extended successfully",
                lock_token=lock_token,
                expires_at=new_expires_at,
            )
        return SeatActionResponse(success=False, message="Failed to extend locks")

    def get_seat_map(self, show_id: str) -> SeatMapResponse:
        """Get full seat map with current lock status for a show."""
        show = self.show_repo.get_by_id(show_id)
        if not show:
            raise ValueError("Show not found")

        from app.repositories import ScreenRepository
        screen_repo = ScreenRepository()
        screen = screen_repo.get_by_id(show.screen_id)

        if not screen:
            raise ValueError("Screen not found")

        # Generate all seats for this screen based on rows and seats_per_row
        locked_seat_ids = set(self.seat_lock_repo.get_locked_seat_ids(show_id))

        # Get booked seats from bookings
        from app.repositories import BookingRepository
        booking_repo = BookingRepository()
        bookings = booking_repo.get_by_show(show_id)
        booked_seat_ids = set()
        for booking in bookings:
            if booking.status in ["confirmed", "completed"]:
                for bs in booking.seats:
                    booked_seat_ids.add(bs.seat_id)

        seats_response = []
        wheelchair_positions = []

        # Generate seats: A1, A2, ..., A{seats_per_row}, B1, B2, ...
        for row_idx in range(screen.rows):
            row_char = chr(ord('A') + row_idx)
            for seat_num in range(1, screen.seats_per_row + 1):
                seat_id = f"{row_char}{seat_num}"
                is_wheelchair = seat_id in screen.wheelchair_positions

                if is_wheelchair:
                    wheelchair_positions.append(seat_id)

                if seat_id in booked_seat_ids:
                    status = "booked"
                elif seat_id in locked_seat_ids:
                    status = "locked"
                else:
                    status = "available"

                # Find lock expiry if locked
                lock_expires_at = None
                locked_by_user_id = None
                if seat_id in locked_seat_ids:
                    lock = self.seat_lock_repo.get_by_seat_and_show(seat_id, show_id)
                    if lock:
                        lock_expires_at = lock.expires_at
                        locked_by_user_id = lock.user_id

                seats_response.append(SeatResponse(
                    seat_id=seat_id,
                    row=row_char,
                    number=seat_num,
                    status=status,
                    price=show.price,
                    is_wheelchair=is_wheelchair,
                    lock_expires_at=lock_expires_at,
                    locked_by_user_id=locked_by_user_id,
                ))

        return SeatMapResponse(
            show_id=show_id,
            screen_name=screen.name,
            rows=screen.rows,
            seats_per_row=screen.seats_per_row,
            aisle_after_row=screen.aisle_after_row,
            seats=seats_response,
            wheelchair_positions=wheelchair_positions,
        )

    def cleanup_expired_locks(self) -> int:
        """Clean up expired locks. Called by background task."""
        return self.seat_lock_repo.delete_expired()
