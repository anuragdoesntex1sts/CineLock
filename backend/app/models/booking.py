from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import uuid


@dataclass
class BookedSeat:
    seat_id: str = ""
    row: str = ""
    number: int = 0
    price: float = 0.0


@dataclass
class Booking:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    show_id: str = ""
    seats: List[BookedSeat] = field(default_factory=list)
    total_amount: float = 0.0
    status: str = "confirmed"  # confirmed, cancelled, completed
    payment_status: str = "pending"  # pending, observed, paid, failed
    payment_id: str = ""
    payment_reference: str = ""
    gateway_delivery_ids: List[str] = field(default_factory=list)
    lock_token: str = ""
    booking_reference: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "show_id": self.show_id,
            "seats": [{"seat_id": s.seat_id, "row": s.row, "number": s.number, "price": s.price} for s in self.seats],
            "total_amount": self.total_amount,
            "status": self.status,
            "payment_status": self.payment_status,
            "payment_id": self.payment_id,
            "payment_reference": self.payment_reference,
            "gateway_delivery_ids": self.gateway_delivery_ids,
            "lock_token": self.lock_token,
            "booking_reference": self.booking_reference,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Booking":
        booking = cls(
            id=data.get("id", str(uuid.uuid4())),
            user_id=data.get("user_id", ""),
            show_id=data.get("show_id", ""),
            total_amount=data.get("total_amount", 0.0),
            status=data.get("status", "confirmed"),
            # A payment ID is only a reference, not proof of settlement. Older
            # records without an explicit status must remain unpaid until a
            # signed gateway reconciliation marks them paid.
            payment_status=data.get("payment_status", "pending"),
            payment_id=data.get("payment_id", ""),
            payment_reference=data.get("payment_reference", ""),
            gateway_delivery_ids=data.get("gateway_delivery_ids", []),
            lock_token=data.get("lock_token", ""),
            booking_reference=data.get("booking_reference", ""),
        )
        booking.seats = [BookedSeat(**s) for s in data.get("seats", [])]
        if "created_at" in data:
            booking.created_at = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data:
            booking.updated_at = datetime.fromisoformat(data["updated_at"])
        return booking
