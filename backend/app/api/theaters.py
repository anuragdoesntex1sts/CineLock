from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from app.schemas.theater import (
    TheaterListResponse, TheaterResponse, TheaterCreate, TheaterUpdate,
    ScreenResponse, ScreenCreate, ScreenUpdate
)
from app.services.theater_service import TheaterService
from app.api.auth import get_current_user

router = APIRouter(prefix="/theaters", tags=["Theaters"])
theater_service = TheaterService()


@router.get("", response_model=TheaterListResponse)
async def list_theaters(city: str = Query("", description="Filter by city")):
    return theater_service.get_theaters(city)


@router.get("/cities", response_model=List[str])
async def get_cities():
    return theater_service.get_cities()


@router.get("/{theater_id}", response_model=TheaterResponse)
async def get_theater(theater_id: str):
    theater = theater_service.get_theater(theater_id)
    if not theater:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theater not found")
    return theater


@router.get("/{theater_id}/screens", response_model=List[ScreenResponse])
async def get_screens(theater_id: str):
    return theater_service.get_screens(theater_id)


@router.get("/{theater_id}/screens/{screen_id}", response_model=ScreenResponse)
async def get_screen(theater_id: str, screen_id: str):
    screen = theater_service.get_screen(theater_id, screen_id)
    if not screen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screen not found")
    return screen


# Admin routes (protected)
@router.post("", response_model=TheaterResponse, status_code=status.HTTP_201_CREATED)
async def create_theater(theater_data: TheaterCreate, user_id: str = Depends(get_current_user)):
    return theater_service.create_theater(theater_data)


@router.put("/{theater_id}", response_model=TheaterResponse)
async def update_theater(theater_id: str, theater_data: TheaterUpdate, user_id: str = Depends(get_current_user)):
    theater = theater_service.update_theater(theater_id, theater_data)
    if not theater:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theater not found")
    return theater


@router.delete("/{theater_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_theater(theater_id: str, user_id: str = Depends(get_current_user)):
    if not theater_service.delete_theater(theater_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theater not found")


@router.post("/{theater_id}/screens", response_model=ScreenResponse, status_code=status.HTTP_201_CREATED)
async def add_screen(theater_id: str, screen_data: ScreenCreate, user_id: str = Depends(get_current_user)):
    screen = theater_service.add_screen(theater_id, screen_data)
    if not screen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theater not found")
    return screen


@router.put("/{theater_id}/screens/{screen_id}", response_model=ScreenResponse)
async def update_screen(theater_id: str, screen_id: str, screen_data: ScreenUpdate, user_id: str = Depends(get_current_user)):
    screen = theater_service.update_screen(theater_id, screen_id, screen_data)
    if not screen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screen not found")
    return screen


@router.delete("/{theater_id}/screens/{screen_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_screen(theater_id: str, screen_id: str, user_id: str = Depends(get_current_user)):
    if not theater_service.delete_screen(theater_id, screen_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screen not found")