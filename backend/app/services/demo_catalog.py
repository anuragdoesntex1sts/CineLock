from datetime import datetime, timedelta
from typing import Any

from app.models.show import Show
from app.models.theater import Screen, Theater
from app.repositories import MovieRepository, ShowRepository, TheaterRepository


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import asin, cos, radians, sin, sqrt

    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))


def ensure_city_demo_data(
    city: str,
    latitude: float,
    longitude: float,
    features: list[dict[str, Any]],
    movie_id: str = "",
) -> list[dict[str, Any]]:
    theater_repo = TheaterRepository()
    show_repo = ShowRepository()
    movie = MovieRepository().get_by_id(movie_id) if movie_id else None
    if movie_id and not movie:
        raise ValueError("Movie not found")
    city_key = city.strip().casefold()
    city_theaters = [theater for theater in theater_repo.get_all() if theater.city.strip().casefold() == city_key]
    results: list[dict[str, Any]] = []
    represented_theaters: set[str] = set()
    new_theaters: list[Theater] = []

    for feature in features:
        properties = feature.get("properties", {})
        name = properties.get("name") or properties.get("address_line1") or "Cinema"
        address = properties.get("address_line1") or properties.get("formatted") or name
        cinema_lat, cinema_lon = properties.get("lat"), properties.get("lon")
        if cinema_lat is None or cinema_lon is None:
            continue
        place_id = properties.get("place_id") or f"geoapify:{cinema_lat}:{cinema_lon}"

        theater = next((item for item in city_theaters if item.external_place_id == place_id), None)
        if theater is None:
            theater = next((
                item for item in city_theaters
                if not item.is_demo
                and item.id not in represented_theaters
                and (
                    item.name.casefold() in name.casefold()
                    or name.casefold() in item.name.casefold()
                    or (item.latitude is not None and item.longitude is not None
                        and _distance_km(cinema_lat, cinema_lon, item.latitude, item.longitude) < 0.5)
                )
            ), None)

        if theater is None:
            theater = Theater(
                name=name,
                address=address,
                city=properties.get("city") or city,
                latitude=cinema_lat,
                longitude=cinema_lon,
                external_place_id=place_id,
                is_demo=True,
            )
            theater.screens = [Screen(
                theater_id=theater.id,
                name="Demo Screen 1",
                rows=8,
                seats_per_row=12,
                aisle_after_row=6,
            )]
            new_theaters.append(theater)
            city_theaters.append(theater)
        else:
            theater.external_place_id = place_id
            theater.latitude = theater.latitude if theater.latitude is not None else cinema_lat
            theater.longitude = theater.longitude if theater.longitude is not None else cinema_lon
            if not theater.screens:
                theater.screens = [Screen(
                    theater_id=theater.id,
                    name="Demo Screen 1",
                    rows=8,
                    seats_per_row=12,
                    aisle_after_row=6,
                )]
            if theater not in new_theaters:
                theater_repo.update(theater)

        represented_theaters.add(theater.id)
        results.append({
            "id": place_id,
            "name": name,
            "address": properties.get("formatted") or address,
            "city": properties.get("city") or city,
            "latitude": cinema_lat,
            "longitude": cinema_lon,
            "distance_km": round(_distance_km(latitude, longitude, cinema_lat, cinema_lon), 1),
            "theater_id": theater.id,
            "has_cinelock_shows": False,
            "is_demo": theater.is_demo,
        })

    if new_theaters:
        theater_repo.bulk_create(new_theaters)

    for theater in city_theaters:
        if theater.id in represented_theaters or theater.latitude is None or theater.longitude is None:
            continue
        results.append({
            "id": theater.external_place_id or theater.id,
            "name": theater.name,
            "address": theater.address,
            "city": theater.city,
            "latitude": theater.latitude,
            "longitude": theater.longitude,
            "distance_km": round(_distance_km(latitude, longitude, theater.latitude, theater.longitude), 1),
            "theater_id": theater.id,
            "has_cinelock_shows": False,
            "is_demo": theater.is_demo,
        })

    if movie_id:
        existing_shows = show_repo.get_by_movie(movie_id)
        scheduled_dates = {(show.theater_id, show.start_time[:10]) for show in existing_shows if show.is_active}
        now = datetime.now()
        duration = max(movie.runtime or 120, 45)
        new_shows: list[Show] = []

        for theater_index, theater in enumerate(city_theaters):
            if not theater.screens:
                theater.screens = [Screen(
                    theater_id=theater.id,
                    name="Demo Screen 1",
                    rows=8,
                    seats_per_row=12,
                    aisle_after_row=6,
                )]
                theater_repo.update(theater)
            screen = theater.screens[0]
            for day_offset in range(7):
                date = (now + timedelta(days=day_offset)).date()
                day_key = (theater.id, date.isoformat())
                if day_key in scheduled_dates:
                    continue
                hour = (11, 15, 19)[(theater_index + day_offset) % 3]
                start = datetime.combine(date, datetime.min.time()).replace(hour=hour, minute=30)
                if start <= now + timedelta(minutes=15):
                    continue
                new_shows.append(Show(
                    movie_id=movie_id,
                    theater_id=theater.id,
                    screen_id=screen.id,
                    start_time=start.isoformat(),
                    end_time=(start + timedelta(minutes=duration + 20)).isoformat(),
                    price=180 + (theater_index % 5) * 30,
                    language="English",
                    format="2D",
                    is_active=True,
                    is_demo=True,
                ))
                scheduled_dates.add(day_key)

        if new_shows:
            show_repo.bulk_create(new_shows)
        for item in results:
            item["has_cinelock_shows"] = True

    results.sort(key=lambda theater: theater["distance_km"])
    return results
