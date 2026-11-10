from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid


@dataclass
class SeatLock:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    seat_id: str = ""
    show_id: str = ""
    user_id: str = ""
    lock_token: str = field(default_factory=lambda: str(uuid.uuid4()))
    expires_at: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "seat_id": self.seat_id,
            "show_id": self.show_id,
            "user_id": self.user_id,
            "lock_token": self.lock_token,
            "expires_at": self.expires_at.isoformat(),
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "SeatLock":
        lock = cls(
            id=data.get("id", str(uuid.uuid4())),
            seat_id=data.get("seat_id", ""),
            show_id=data.get("show_id", ""),
            user_id=data.get("user_id", ""),
            lock_token=data.get("lock_token", str(uuid.uuid4())),
        )
        if "expires_at" in data:
            lock.expires_at = datetime.fromisoformat(data["expires_at"])
        if "created_at" in data:
            lock.created_at = datetime.fromisoformat(data["created_at"])
        return lock

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at