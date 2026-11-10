from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from app.schemas.show import ShowListResponse, ShowWithDetails, ShowCreate, ShowUpdate, ShowResponse
from app.services.show_service import ShowService
from app.api.auth import get_current_user

router = APIRouter(prefix="/shows", tags=["Shows"])
show_service = ShowService()


@router.get("", response_model=ShowListResponse)
async def list_shows(
    movie_id: str = Query("", description="Filter by movie"),
    theater_id: str = Query("", description="Filter by theater"),
    limit: int = Query(50, ge=1, le=1000, description="Max results"),
):
    return show_service.get_shows(movie_id, theater_id, limit)


@router.get("/dates", response_model=List[str])
async def get_dates_with_shows(
    movie_id: str = Query("", description="Filter by movie"),
    theater_id: str = Query("", description="Filter by theater"),
):
    return show_service.get_dates_with_shows(movie_id, theater_id)


@router.get("/by-movie/{movie_id}", response_model=List[ShowWithDetails])
async def get_shows_by_movie_and_date(movie_id: str, date: str = Query(..., description="Date (YYYY-MM-DD)")):
    return show_service.get_shows_by_movie_and_date(movie_id, date)


@router.get("/by-theater/{theater_id}", response_model=List[ShowWithDetails])
async def get_shows_by_theater_and_date(theater_id: str, date: str = Query(..., description="Date (YYYY-MM-DD)")):
    return show_service.get_shows_by_theater_and_date(theater_id, date)


@router.get("/{show_id}", response_model=ShowWithDetails)
async def get_show(show_id: str):
    show = show_service.get_show(show_id)
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found")
    return show


# Admin routes (protected)
@router.post("", response_model=ShowResponse, status_code=status.HTTP_201_CREATED)
async def create_show(show_data: ShowCreate, user_id: str = Depends(get_current_user)):
    return show_service.create_show(show_data)


@router.put("/{show_id}", response_model=ShowResponse)
async def update_show(show_id: str, show_data: ShowUpdate, user_id: str = Depends(get_current_user)):
    show = show_service.update_show(show_id, show_data)
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found")
    return show


@router.delete("/{show_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_show(show_id: str, user_id: str = Depends(get_current_user)):
    if not show_service.delete_show(show_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found")
