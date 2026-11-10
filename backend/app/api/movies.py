from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional
from app.schemas.movie import MovieListResponse, MovieResponse, MovieCreate, MovieUpdate
from app.services.movie_service import MovieService
from app.api.auth import get_current_user

router = APIRouter(prefix="/movies", tags=["Movies"])
movie_service = MovieService()


@router.get("", response_model=MovieListResponse)
async def list_movies(
    query: str = Query("", description="Search query"),
    genre: str = Query("", description="Filter by genre"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    return movie_service.get_movies(query, genre, page, page_size)


@router.get("/popular", response_model=list[MovieResponse])
async def get_popular_movies(limit: int = Query(10, ge=1, le=50)):
    return movie_service.get_popular(limit)


@router.get("/genres", response_model=list[str])
async def get_genres():
    return movie_service.get_genres()


@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(movie_id: str):
    movie = movie_service.get_movie(movie_id)
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    return movie


# Admin routes (protected)
@router.post("", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def create_movie(movie_data: MovieCreate, user_id: str = Depends(get_current_user)):
    return movie_service.create_movie(movie_data)


@router.put("/{movie_id}", response_model=MovieResponse)
async def update_movie(movie_id: str, movie_data: MovieUpdate, user_id: str = Depends(get_current_user)):
    movie = movie_service.update_movie(movie_id, movie_data)
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    return movie


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(movie_id: str, user_id: str = Depends(get_current_user)):
    if not movie_service.delete_movie(movie_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")