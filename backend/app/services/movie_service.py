from typing import List, Optional, Tuple
from app.repositories import MovieRepository
from app.models.movie import Movie
from app.schemas.movie import MovieCreate, MovieUpdate, MovieResponse, MovieListResponse


class MovieService:
    def __init__(self):
        self.repo = MovieRepository()

    def get_movies(self, query: str = "", genre: str = "", page: int = 1, page_size: int = 20) -> MovieListResponse:
        movies, total = self.repo.search(query, genre, page, page_size)
        total_pages = (total + page_size - 1) // page_size

        return MovieListResponse(
            movies=[MovieResponse.model_validate(m.to_dict()) for m in movies],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_movie(self, movie_id: str) -> Optional[MovieResponse]:
        movie = self.repo.get_by_id(movie_id)
        if movie:
            return MovieResponse.model_validate(movie.to_dict())
        return None

    def get_movie_by_tmdb_id(self, tmdb_id: int) -> Optional[MovieResponse]:
        movie = self.repo.get_by_tmdb_id(tmdb_id)
        if movie:
            return MovieResponse.model_validate(movie.to_dict())
        return None

    def get_popular(self, limit: int = 10) -> List[MovieResponse]:
        movies = self.repo.get_popular(limit)
        return [MovieResponse.model_validate(m.to_dict()) for m in movies]

    def get_genres(self) -> List[str]:
        movies = self.repo.get_all()
        genres = set()
        for movie in movies:
            genres.update(movie.genres)
        return sorted(genres)

    def create_movie(self, movie_data: MovieCreate) -> MovieResponse:
        movie = Movie(**movie_data.model_dump())
        self.repo.create(movie)
        return MovieResponse.model_validate(movie.to_dict())

    def update_movie(self, movie_id: str, movie_data: MovieUpdate) -> Optional[MovieResponse]:
        movie = self.repo.get_by_id(movie_id)
        if not movie:
            return None

        update_dict = movie_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(movie, key, value)

        self.repo.update(movie)
        return MovieResponse.model_validate(movie.to_dict())

    def delete_movie(self, movie_id: str) -> bool:
        return self.repo.delete(movie_id)