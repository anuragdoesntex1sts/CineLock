from typing import List, Optional
from app.repositories import TheaterRepository, ScreenRepository
from app.models.theater import Theater, Screen
from app.schemas.theater import (
    TheaterCreate, TheaterUpdate, TheaterResponse, TheaterListResponse,
    ScreenCreate, ScreenUpdate, ScreenResponse
)


class TheaterService:
    def __init__(self):
        self.theater_repo = TheaterRepository()
        self.screen_repo = ScreenRepository()

    def get_theaters(self, city: str = "") -> TheaterListResponse:
        if city:
            theaters = self.theater_repo.get_by_city(city)
        else:
            theaters = self.theater_repo.get_all()

        return TheaterListResponse(
            theaters=[TheaterResponse.model_validate(t.to_dict()) for t in theaters],
            total=len(theaters),
        )

    def get_theater(self, theater_id: str) -> Optional[TheaterResponse]:
        theater = self.theater_repo.get_by_id(theater_id)
        if theater:
            return TheaterResponse.model_validate(theater.to_dict())
        return None

    def get_cities(self) -> List[str]:
        return self.theater_repo.get_all_cities()

    def create_theater(self, theater_data: TheaterCreate) -> TheaterResponse:
        theater = Theater(**theater_data.model_dump())
        self.theater_repo.create(theater)
        return TheaterResponse.model_validate(theater.to_dict())

    def update_theater(self, theater_id: str, theater_data: TheaterUpdate) -> Optional[TheaterResponse]:
        theater = self.theater_repo.get_by_id(theater_id)
        if not theater:
            return None

        update_dict = theater_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(theater, key, value)

        self.theater_repo.update(theater)
        return TheaterResponse.model_validate(theater.to_dict())

    def delete_theater(self, theater_id: str) -> bool:
        return self.theater_repo.delete(theater_id)

    # Screen operations
    def get_screens(self, theater_id: str) -> List[ScreenResponse]:
        screens = self.screen_repo.get_by_theater(theater_id)
        return [ScreenResponse.model_validate(s.to_dict()) for s in screens]

    def get_screen(self, theater_id: str, screen_id: str) -> Optional[ScreenResponse]:
        screen = self.screen_repo.get_by_theater_and_id(theater_id, screen_id)
        if screen:
            return ScreenResponse.model_validate(screen.to_dict())
        return None

    def add_screen(self, theater_id: str, screen_data: ScreenCreate) -> Optional[ScreenResponse]:
        theater = self.theater_repo.get_by_id(theater_id)
        if not theater:
            return None

        screen = Screen(**screen_data.model_dump())
        theater.screens.append(screen)
        self.theater_repo.update(theater)
        return ScreenResponse.model_validate(screen.to_dict())

    def update_screen(self, theater_id: str, screen_id: str, screen_data: ScreenUpdate) -> Optional[ScreenResponse]:
        theater = self.theater_repo.get_by_id(theater_id)
        if not theater:
            return None

        screen = self.screen_repo.get_by_theater_and_id(theater_id, screen_id)
        if not screen:
            return None

        update_dict = screen_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(screen, key, value)

        self.theater_repo.update(theater)
        return ScreenResponse.model_validate(screen.to_dict())

    def delete_screen(self, theater_id: str, screen_id: str) -> bool:
        theater = self.theater_repo.get_by_id(theater_id)
        if not theater:
            return False

        theater.screens = [s for s in theater.screens if s.id != screen_id]
        self.theater_repo.update(theater)
        return True