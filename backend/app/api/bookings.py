from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from typing import List
from datetime import datetime
from app.repositories import BookingRepository, ShowRepository, MovieRepository, TheaterRepository, ScreenRepository
from app.api.auth import get_current_user
from app.utils.ticket import generate_ticket_pdf

router = APIRouter(prefix="/bookings", tags=["Bookings"])
booking_repo = BookingRepository()
show_repo = ShowRepository()
movie_repo = MovieRepository()
theater_repo = TheaterRepository()
screen_repo = ScreenRepository()


@router.get("", response_model=List[dict])
async def get_user_bookings(user_id: str = Depends(get_current_user)):
    """Get all bookings for the current user."""
    bookings = booking_repo.get_by_user(user_id)
    result = []
    for b in bookings:
        show = show_repo.get_by_id(b.show_id)
        movie = movie_repo.get_by_id(show.movie_id) if show else None
        theater = theater_repo.get_by_id(show.theater_id) if show else None

        b_dict = b.to_dict()
        b_dict["movie_title"] = movie.title if movie else "Unknown"
        b_dict["movie_poster"] = movie.poster_path if movie else ""
        b_dict["theater_name"] = theater.name if theater else "Unknown"
        b_dict["show_start_time"] = show.start_time if show else ""
        result.append(b_dict)
    return result


@router.get("/{booking_id}")
async def get_booking(booking_id: str, user_id: str = Depends(get_current_user)):
    """Get one booking owned by the current user."""
    booking = booking_repo.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    show = show_repo.get_by_id(booking.show_id)
    movie = movie_repo.get_by_id(show.movie_id) if show else None
    theater = theater_repo.get_by_id(show.theater_id) if show else None
    screen = screen_repo.get_by_id(show.screen_id) if show else None
    result = booking.to_dict()
    result.update({
        "movie_title": movie.title if movie else "Unknown",
        "movie_poster": movie.poster_path if movie else "",
        "theater_name": theater.name if theater else "Unknown",
        "show_start_time": show.start_time if show else "",
        "screen_name": screen.name if screen else "",
    })
    return result


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, user_id: str = Depends(get_current_user)):
    """Cancel a booking owned by the current user."""
    booking = booking_repo.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if booking.status == "cancelled":
        raise HTTPException(status_code=409, detail="Booking is already cancelled")

    booking.status = "cancelled"
    booking.updated_at = datetime.utcnow()
    booking_repo.update(booking)
    return booking.to_dict()


@router.get("/{booking_id}/ticket")
async def download_ticket(booking_id: str, user_id: str = Depends(get_current_user)):
    """Download PDF ticket for a booking."""
    booking = booking_repo.get_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if booking.status == "cancelled":
        raise HTTPException(status_code=409, detail="Cancelled bookings do not have a valid ticket")
    if booking.payment_status != "paid":
        raise HTTPException(status_code=409, detail="Payment has not been reconciled yet")

    show = show_repo.get_by_id(booking.show_id)
    movie = movie_repo.get_by_id(show.movie_id) if show else None
    theater = theater_repo.get_by_id(show.theater_id) if show else None
    screen = screen_repo.get_by_id(show.screen_id) if show else None

    movie_data = movie.to_dict() if movie else {}
    theater_data = theater.to_dict() if theater else {}
    show_data = {
        "start_time": show.start_time if show else "",
        "screen_name": screen.name if screen else "Screen 1",
    }

    pdf_bytes = generate_ticket_pdf(booking.to_dict(), movie_data, theater_data, show_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=ticket-{booking.booking_reference}.pdf"
        },
    )
