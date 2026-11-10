from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


PaymentMethod = Literal["card", "upi", "wallet"]


class PaymentBase(BaseModel):
    amount: float = Field(..., ge=0)
    method: PaymentMethod
    booking_id: str


class PaymentCreate(PaymentBase):
    # Mock payment details
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None
    upi_id: Optional[str] = None
    wallet_type: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    amount: float
    method: str
    status: str  # pending, completed, failed, refunded
    transaction_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MockPaymentRequest(BaseModel):
    booking_id: str
    method: PaymentMethod = "card"
    # Mock success/failure simulation
    should_succeed: bool = True