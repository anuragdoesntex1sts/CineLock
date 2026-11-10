import hashlib
import hmac
import json
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse
import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from app.schemas.payment import MockPaymentRequest, PaymentResponse
from app.api.auth import get_current_user
from app.config import settings
from app.repositories import BookingRepository
import uuid
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["Payments"])
booking_repo = BookingRepository()


@router.post("/mock", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_mock_payment(
    request: MockPaymentRequest,
    user_id: str = Depends(get_current_user),
):
    """Process a mock payment for a booking/lock."""
    if not request.should_succeed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment failed. Please try again.",
        )

    return PaymentResponse(
        id=str(uuid.uuid4()),
        booking_id=request.booking_id,
        amount=500.0,  # mock default
        method=request.method,
        status="completed",
        transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.post("/youpi/checkout-session")
async def create_youpi_checkout_session(
    booking_id: str = Body(..., embed=True),
    user_id: str = Depends(get_current_user),
):
    """Create a trusted YouPI session for an owned booking; keep merchant credentials server-side."""
    if not settings.YOUPI_MERCHANT_ID or not settings.YOUPI_MERCHANT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="YouPI is missing its server-side Merchant API Key. Generate one in YOUPI Webhooks & Secrets and set YOUPI_MERCHANT_API_KEY in backend/.env.",
        )

    booking = booking_repo.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if booking.status == "cancelled":
        raise HTTPException(status_code=409, detail="This booking was cancelled")
    if booking.payment_status == "paid":
        raise HTTPException(status_code=409, detail="This booking has already been paid")

    order_id = booking.id
    idempotency_key = f"cinelock-booking-{order_id}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{settings.YOUPI_API_BASE_URL.rstrip('/')}/api/v1/payments",
                headers={
                    "X-Merchant-Id": settings.YOUPI_MERCHANT_ID,
                    "X-Merchant-Key": settings.YOUPI_MERCHANT_API_KEY,
                    "Idempotency-Key": idempotency_key,
                },
                json={
                    "orderId": order_id,
                    "amount": str(Decimal(str(booking.total_amount)).quantize(Decimal("0.01"))),
                    "currency": "INR",
                    "method": "UPI",
                    "metadata": {"source": "CineLock", "bookingId": order_id},
                },
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the local YouPI Payment API at YOUPI_API_BASE_URL.",
        ) from exc

    if response.is_error:
        try:
            provider_error = response.json()
        except ValueError:
            provider_error = {}
        reason = provider_error.get("message") or provider_error.get("error")
        if response.status_code == 401:
            detail = "YouPI rejected the Merchant API Key. Check YOUPI_MERCHANT_API_KEY in backend/.env."
        else:
            detail = f"YouPI could not create the checkout session (HTTP {response.status_code})."
            if reason:
                detail += f" {reason}"
        raise HTTPException(status_code=502, detail=detail)

    try:
        session = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="YouPI returned an invalid checkout response.") from exc

    checkout_url = session.get("checkoutUrl")
    payment_id = session.get("paymentId")
    try:
        checkout_origin = urlparse(checkout_url)
        expected_origin = urlparse(settings.YOUPI_CHECKOUT_BASE_URL)
        is_safe_checkout_url = (
            checkout_origin.scheme in {"http", "https"}
            and checkout_origin.netloc == expected_origin.netloc
            and checkout_origin.scheme == expected_origin.scheme
            and not checkout_origin.username
            and not checkout_origin.password
        )
    except (TypeError, ValueError):
        is_safe_checkout_url = False
    if not payment_id or not is_safe_checkout_url:
        raise HTTPException(status_code=502, detail="YouPI returned an invalid checkout URL or payment ID.")

    return {"payment_id": payment_id, "checkout_url": checkout_url}


@router.post("/youpi/webhook")
async def youpi_webhook(request: Request):
    """Accept only signed gateway events; browser callbacks never mark a booking paid."""
    if not settings.YOUPI_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="YouPI webhook is not configured")

    raw_body = await request.body()
    signature = request.headers.get("X-Gateway-Signature-V2", "")
    timestamp = request.headers.get("X-Gateway-Timestamp", "")
    delivery_id = request.headers.get("X-Gateway-Delivery-Id", "")
    signed_payload = f"{timestamp}.".encode("utf-8") + raw_body
    expected = "sha256=" + hmac.new(
        settings.YOUPI_WEBHOOK_SECRET.encode("utf-8"), signed_payload, hashlib.sha256
    ).hexdigest()
    if not signature or not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid gateway signature")

    try:
        payload = json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid gateway event") from exc

    order_id = str(payload.get("orderId", ""))
    if not delivery_id or payload.get("deliveryId") != delivery_id or str(payload.get("timestamp", "")) != timestamp:
        raise HTTPException(status_code=400, detail="Gateway event headers do not match payload")
    booking = booking_repo.get_by_id(order_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if delivery_id in booking.gateway_delivery_ids:
        return {"received": True, "duplicate": True}

    if payload.get("method") != "UPI":
        raise HTTPException(status_code=400, detail="Unsupported payment method")
    try:
        received_amount = Decimal(str(payload.get("amount", "")))
        expected_amount = Decimal(str(booking.total_amount)).quantize(Decimal("0.01"))
    except InvalidOperation as exc:
        raise HTTPException(status_code=400, detail="Invalid payment amount") from exc
    if received_amount.quantize(Decimal("0.01")) != expected_amount or payload.get("currency", "INR") != "INR":
        raise HTTPException(status_code=409, detail="Payment amount or currency does not match booking")

    event = payload.get("event")
    if event == "OBSERVED_SUCCESS":
        booking.payment_status = "observed"
    elif event == "RECONCILED" and payload.get("settlementState") == "RECONCILED" and payload.get("utr"):
        booking.payment_status = "paid"
    else:
        # Keep failure/expiry outcomes visible without treating them as settled.
        if event in {"FAILED", "EXPIRED", "CANCELLED"}:
            booking.payment_status = "failed"
    booking.payment_id = str(payload.get("paymentId", booking.payment_id))
    booking.payment_reference = str(payload.get("utr", ""))
    booking.gateway_delivery_ids.append(delivery_id)
    booking.updated_at = datetime.utcnow()
    booking_repo.update(booking)
    return {"received": True, "payment_status": booking.payment_status}
