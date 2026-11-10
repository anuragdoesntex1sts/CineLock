from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from app.schemas.seat import (
    SeatLockRequest,
    SeatLockResponse,
    SeatConfirmRequest,
    SeatReleaseRequest,
    SeatExtendRequest,
    SeatActionResponse,
    SeatMapResponse,
)
from app.services.seat_lock_service import SeatLockService
from app.api.auth import get_current_user

router = APIRouter(prefix="/seats", tags=["Seats"])
seat_lock_service = SeatLockService()


@router.post("/lock", response_model=SeatLockResponse, status_code=status.HTTP_201_CREATED)
async def lock_seats(
    request: SeatLockRequest,
    user_id: str = Depends(get_current_user),
):
    """Lock seats for the current user. Returns lock_token with 5-minute TTL."""
    try:
        return seat_lock_service.lock_seats(
            show_id=request.show_id,
            seat_ids=request.seat_ids,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/confirm", response_model=SeatActionResponse)
async def confirm_locks(
    request: SeatConfirmRequest,
    user_id: str = Depends(get_current_user),
):
    """Confirm locked seats with payment_id. Converts locks to booked seats."""
    result = seat_lock_service.confirm_locks(
        lock_token=request.lock_token,
        payment_id=request.payment_id,
        user_id=user_id,
    )
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.post("/release", response_model=SeatActionResponse)
async def release_locks(
    request: SeatReleaseRequest,
    user_id: str = Depends(get_current_user),
):
    """Release locks early (user cancelled or timeout)."""
    result = seat_lock_service.release_locks(
        lock_token=request.lock_token,
        user_id=user_id,
    )
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.post("/extend", response_model=SeatActionResponse)
async def extend_locks(
    request: SeatExtendRequest,
    user_id: str = Depends(get_current_user),
):
    """Extend lock expiry time."""
    result = seat_lock_service.extend_locks(
        lock_token=request.lock_token,
        additional_minutes=request.additional_minutes,
        user_id=user_id,
    )
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    return result


@router.get("/map/{show_id}", response_model=SeatMapResponse)
async def get_seat_map(show_id: str):
    """Get full seat map with real-time lock status for a show. Public endpoint."""
    try:
        return seat_lock_service.get_seat_map(show_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))