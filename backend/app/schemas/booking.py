from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class BookedSeatBase(BaseModel):
    seat_id: str
    row: str
    number: int
    price: float


class BookedSeatResponse(BookedSeatBase):
    pass


class BookingBase(BaseModel):
    user_id: str
    show_id: str
    seats: List[BookedSeatBase]
    total_amount: float = Field(..., ge=0)
    lock_token: str


class BookingCreate(BookingBase):
    payment_id: str


class BookingResponse(BaseModel):
    id: str
    user_id: str
    show_id: str
    seats: List[BookedSeatResponse]
    total_amount: float
    status: str
    payment_id: str
    lock_token: str
    booking_reference: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    bookings: List[BookingResponse]
    total: int