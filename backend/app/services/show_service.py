from datetime import datetime
from typing import List, Optional
from app.repositories import ShowRepository, MovieRepository, TheaterRepository, ScreenRepository
from app.models.show import Show
from app.schemas.show import ShowCreate, ShowUpdate, ShowResponse, ShowWithDetails, ShowListResponse


class ShowService:
    def __init__(self):
        self.show_repo = ShowRepository()
        self.movie_repo = MovieRepository()
        self.theater_repo = TheaterRepository()
        self.screen_repo = ScreenRepository()

    def get_shows(self, movie_id: str = "", theater_id: str = "", limit: int = 50) -> ShowListResponse:
        now = datetime.now().isoformat()
        shows = [show for show in self.show_repo.get_all() if show.is_active and show.start_time >= now]
        if movie_id:
            shows = [show for show in shows if show.movie_id == movie_id]
        if theater_id:
            shows = [show for show in shows if show.theater_id == theater_id]
        shows.sort(key=lambda show: show.start_time)
        shows = shows[:limit]

        movies_by_id = {movie.id: movie for movie in self.movie_repo.get_all()}
        theaters_by_id = {theater.id: theater for theater in self.theater_repo.get_all()}
        screens_by_id = {screen.id: screen for screen in self.screen_repo.get_all()}

        # Enrich with details
        enriched = []
        for show in shows:
            movie = movies_by_id.get(show.movie_id)
            theater = theaters_by_id.get(show.theater_id)
            screen = screens_by_id.get(show.screen_id)

            enriched.append(ShowWithDetails(
                **show.to_dict(),
                movie_title=movie.title if movie else "",
                movie_poster=movie.poster_path if movie else "",
                theater_name=theater.name if theater else "",
                screen_name=screen.name if screen else "",
            ))

        return ShowListResponse(shows=enriched, total=len(enriched))

    def get_show(self, show_id: str) -> Optional[ShowWithDetails]:
        show = self.show_repo.get_by_id(show_id)
        if not show:
            return None

        movie = self.movie_repo.get_by_id(show.movie_id)
        theater = self.theater_repo.get_by_id(show.theater_id)
        screen = self.screen_repo.get_by_id(show.screen_id)

        return ShowWithDetails(
            **show.to_dict(),
            movie_title=movie.title if movie else "",
            movie_poster=movie.poster_path if movie else "",
            theater_name=theater.name if theater else "",
            screen_name=screen.name if screen else "",
        )

    def get_shows_by_movie_and_date(self, movie_id: str, date_str: str) -> List[ShowWithDetails]:
        shows = self.show_repo.get_by_movie_and_date(movie_id, date_str)

        enriched = []
        for show in shows:
            movie = self.movie_repo.get_by_id(show.movie_id)
            theater = self.theater_repo.get_by_id(show.theater_id)
            screen = self.screen_repo.get_by_id(show.screen_id)

            enriched.append(ShowWithDetails(
                **show.to_dict(),
                movie_title=movie.title if movie else "",
                movie_poster=movie.poster_path if movie else "",
                theater_name=theater.name if theater else "",
                screen_name=screen.name if screen else "",
            ))

        return enriched

    def get_shows_by_theater_and_date(self, theater_id: str, date_str: str) -> List[ShowWithDetails]:
        shows = self.show_repo.get_by_theater_and_date(theater_id, date_str)

        enriched = []
        for show in shows:
            movie = self.movie_repo.get_by_id(show.movie_id)
            theater = self.theater_repo.get_by_id(show.theater_id)
            screen = self.screen_repo.get_by_id(show.screen_id)

            enriched.append(ShowWithDetails(
                **show.to_dict(),
                movie_title=movie.title if movie else "",
                movie_poster=movie.poster_path if movie else "",
                theater_name=theater.name if theater else "",
                screen_name=screen.name if screen else "",
            ))

        return enriched

    def get_dates_with_shows(self, movie_id: str = "", theater_id: str = "") -> List[str]:
        return self.show_repo.get_dates_with_shows(movie_id, theater_id)

    def create_show(self, show_data: ShowCreate) -> ShowResponse:
        show = Show(**show_data.model_dump())
        self.show_repo.create(show)
        return ShowResponse.model_validate(show.to_dict())

    def update_show(self, show_id: str, show_data: ShowUpdate) -> Optional[ShowResponse]:
        show = self.show_repo.get_by_id(show_id)
        if not show:
            return None

        update_dict = show_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(show, key, value)

        self.show_repo.update(show)
        return ShowResponse.model_validate(show.to_dict())

    def delete_show(self, show_id: str) -> bool:
        return self.show_repo.delete(show_id)
