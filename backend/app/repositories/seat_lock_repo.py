import os
from typing import List, Optional
from datetime import datetime
from app.repositories.base import JSONFileRepository
from app.models.seat_lock import SeatLock
from app.config import settings


class SeatLockRepository(JSONFileRepository[SeatLock]):
    def __init__(self):
        super().__init__(
            file_path=os.path.join(settings.DATA_DIR, "seat_locks.json"),
            model_class=SeatLock,
            id_field="id",
        )

    def get_by_show(self, show_id: str) -> List[SeatLock]:
        return self.get_by_field("show_id", show_id)

    def get_by_user(self, user_id: str) -> List[SeatLock]:
        return self.get_by_field("user_id", user_id)

    def get_by_lock_token(self, lock_token: str) -> List[SeatLock]:
        return self.get_by_field("lock_token", lock_token)

    def get_by_seat_and_show(self, seat_id: str, show_id: str) -> Optional[SeatLock]:
        locks = self.get_by_show(show_id)
        for lock in locks:
            if lock.seat_id == seat_id and not lock.is_expired():
                return lock
        return None

    def get_active_locks_for_show(self, show_id: str) -> List[SeatLock]:
        locks = self.get_by_show(show_id)
        return [l for l in locks if not l.is_expired()]

    def get_locked_seat_ids(self, show_id: str) -> List[str]:
        locks = self.get_active_locks_for_show(show_id)
        return [l.seat_id for l in locks]

    def delete_by_lock_token(self, lock_token: str) -> int:
        locks = self.get_by_lock_token(lock_token)
        if locks:
            ids = [l.id for l in locks]
            return self.delete_many(ids)
        return 0

    def delete_expired(self) -> int:
        """Delete all expired locks. Returns count deleted."""
        all_locks = self.get_all()
        expired_ids = [l.id for l in all_locks if l.is_expired()]
        if expired_ids:
            return self.delete_many(expired_ids)
        return 0

    def create_locks(self, locks: List[SeatLock]) -> List[SeatLock]:
        return self.bulk_create(locks)

    def atomic_create_locks(self, show_id: str, seat_ids: List[str], user_id: str, expires_at: datetime) -> tuple[bool, str, List[SeatLock]]:
        """
        Atomically create locks for seats.
        Returns: (success, message/lock_token, locks)
        """
        def operation(data):
            # Check for conflicts
            existing_locks = [l for l in data if l.get("show_id") == show_id and l.get("seat_id") in seat_ids]
            active_conflicts = [l for l in existing_locks if datetime.fromisoformat(l["expires_at"]) > datetime.utcnow()]

            if active_conflicts:
                conflict_seats = [l["seat_id"] for l in active_conflicts]
                return (False, f"Seats already locked: {', '.join(conflict_seats)}", [])

            # Create new locks
            import uuid
            lock_token = str(uuid.uuid4())
            new_locks = []
            for seat_id in seat_ids:
                lock = SeatLock(
                    seat_id=seat_id,
                    show_id=show_id,
                    user_id=user_id,
                    lock_token=lock_token,
                    expires_at=expires_at,
                )
                new_locks.append(lock.to_dict())

            data.extend(new_locks)
            return (True, lock_token, [SeatLock.from_dict(l) for l in new_locks])

        return self.atomic_operation(operation)

    def atomic_confirm_locks(self, lock_token: str) -> tuple[bool, str, List[SeatLock]]:
        """
        Atomically confirm (convert to booked) and remove locks.
        Returns: (success, message, confirmed_locks)
        """
        def operation(data):
            locks_to_confirm = [l for l in data if l.get("lock_token") == lock_token]

            if not locks_to_confirm:
                return (False, "Invalid or expired lock token", [])

            # Check all locks are valid and not expired
            for lock_data in locks_to_confirm:
                if datetime.fromisoformat(lock_data["expires_at"]) <= datetime.utcnow():
                    return (False, "Lock token has expired", [])

            # Remove locks from data
            remaining = [l for l in data if l.get("lock_token") != lock_token]
            data[:] = remaining

            confirmed = [SeatLock.from_dict(l) for l in locks_to_confirm]
            return (True, "Locks confirmed", confirmed)

        return self.atomic_operation(operation)

    def atomic_release_locks(self, lock_token: str) -> tuple[bool, str]:
        """
        Atomically release locks.
        Returns: (success, message)
        """
        def operation(data):
            initial_len = len(data)
            data[:] = [l for l in data if l.get("lock_token") != lock_token]
            if len(data) < initial_len:
                return (True, "Locks released")
            return (False, "Lock token not found")

        return self.atomic_operation(operation)