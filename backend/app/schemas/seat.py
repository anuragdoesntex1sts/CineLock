from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


SeatStatus = Literal["available", "selected", "locked", "booked", "wheelchair"]


class SeatBase(BaseModel):
    seat_id: str
    row: str
    number: int
    status: SeatStatus = "available"
    price: float = 0.0
    is_wheelchair: bool = False


class SeatResponse(SeatBase):
    lock_expires_at: Optional[datetime] = None
    locked_by_user_id: Optional[str] = None


class SeatMapResponse(BaseModel):
    show_id: str
    screen_name: str
    rows: int
    seats_per_row: int
    aisle_after_row: int = 0
    seats: List[SeatResponse]
    wheelchair_positions: List[str] = []


class SeatLockRequest(BaseModel):
    show_id: str
    seat_ids: List[str] = Field(..., min_length=1, max_length=10)


class SeatLockResponse(BaseModel):
    lock_token: str
    expires_at: datetime
    locked_seats: List[SeatResponse]


class SeatConfirmRequest(BaseModel):
    lock_token: str
    payment_id: str


class SeatReleaseRequest(BaseModel):
    lock_token: str


class SeatExtendRequest(BaseModel):
    lock_token: str
    additional_minutes: int = Field(5, ge=1, le=10)


class SeatActionResponse(BaseModel):
    success: bool
    message: str
    lock_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    booking_id: Optional[str] = None
