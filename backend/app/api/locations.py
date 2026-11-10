import asyncio
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.repositories import TheaterRepository
from app.services.demo_catalog import ensure_city_demo_data

router = APIRouter(prefix="/locations", tags=["Locations"])
theater_repo = TheaterRepository()
GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode"


def _require_api_key() -> str:
    if not settings.GEOAPIFY_API_KEY:
        raise HTTPException(status_code=503, detail="Location search is not configured")
    return settings.GEOAPIFY_API_KEY


def _location_result(properties: dict[str, Any]) -> dict[str, Any]:
    return {
        "label": properties.get("formatted", ""),
        "city": properties.get("city") or properties.get("county") or "",
        "latitude": properties.get("lat"),
        "longitude": properties.get("lon"),
        "place_id": properties.get("place_id"),
    }


@router.get("/search")
async def search_locations(text: str = Query(min_length=2, max_length=160)):
    api_key = _require_api_key()
    async with httpx.AsyncClient(timeout=8) as client:
        try:
            response = await client.get(
                f"{GEOAPIFY_URL}/search",
                params={"text": text, "type": "city", "format": "json", "limit": 6, "apiKey": api_key},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Could not search locations right now") from exc
    payload = response.json()
    return {"results": [_location_result(item) for item in payload.get("results", [])]}


@router.get("/reverse")
async def reverse_location(lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)):
    api_key = _require_api_key()
    async with httpx.AsyncClient(timeout=8) as client:
        try:
            response = await client.get(
                f"{GEOAPIFY_URL}/reverse",
                params={"lat": lat, "lon": lon, "type": "city", "format": "json", "apiKey": api_key},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Could not identify this location") from exc
    results = response.json().get("results", [])
    if not results:
        raise HTTPException(status_code=404, detail="No address found for this location")
    return _location_result(results[0])


async def _geocode_theater(client: httpx.AsyncClient, theater: Any, api_key: str) -> None:
    query = ", ".join(part for part in (theater.address, theater.city, "India") if part)
    try:
        response = await client.get(
            f"{GEOAPIFY_URL}/search",
            params={"text": query, "format": "json", "limit": 1, "apiKey": api_key},
        )
        response.raise_for_status()
        results = response.json().get("results", [])
        if results:
            theater.latitude = results[0].get("lat")
            theater.longitude = results[0].get("lon")
            theater_repo.update(theater)
    except httpx.HTTPError:
        return


@router.get("/nearby-theaters")
async def nearby_theaters(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    city: str = Query(min_length=2, max_length=120),
    place_id: str | None = Query(default=None, min_length=2, max_length=2048),
    movie_id: str = Query(default="", max_length=80),
):
    api_key = _require_api_key()
    city_theaters = [t for t in theater_repo.get_all() if t.city.strip().casefold() == city.strip().casefold()]
    cached_theaters = [t for t in city_theaters if t.external_place_id]
    # Once a city's venues have been discovered, reuse the persistent catalog
    # instead of spending several Geoapify requests again for each movie.
    features = [
        {
            "properties": {
                "place_id": theater.external_place_id,
                "name": theater.name,
                "address_line1": theater.address,
                "formatted": f"{theater.address}, {city}",
                "city": city,
                "lat": theater.latitude,
                "lon": theater.longitude,
            }
        }
        for theater in cached_theaters
    ]
    if not features:
        async with httpx.AsyncClient(timeout=15) as client:
            resolved_place_id = place_id
            if not resolved_place_id:
                try:
                    area_response = await client.get(
                        f"{GEOAPIFY_URL}/search",
                        params={"text": city, "type": "city", "format": "json", "limit": 1, "apiKey": api_key},
                    )
                    area_response.raise_for_status()
                    area_results = area_response.json().get("results", [])
                    resolved_place_id = area_results[0].get("place_id") if area_results else None
                except httpx.HTTPError as exc:
                    raise HTTPException(status_code=502, detail="Could not resolve this city") from exc
            if not resolved_place_id:
                raise HTTPException(status_code=404, detail="Could not find a city boundary for this location")

            offset = 0
            page_size = 20
            try:
                while True:
                    places_response = await client.get(
                        "https://api.geoapify.com/v2/places",
                        params={
                            "categories": "entertainment.cinema",
                            "filter": f"place:{resolved_place_id}",
                            "limit": page_size,
                            "offset": offset,
                            "apiKey": api_key,
                        },
                    )
                    places_response.raise_for_status()
                    page = places_response.json().get("features", [])
                    features.extend(page)
                    if len(page) < page_size:
                        break
                    offset += page_size
            except httpx.HTTPError as exc:
                raise HTTPException(status_code=502, detail="Could not fetch cinemas for this city") from exc

    local_theaters = city_theaters
    missing_coordinates = [t for t in local_theaters if t.latitude is None or t.longitude is None]
    if missing_coordinates:
        async with httpx.AsyncClient(timeout=8) as client:
            await asyncio.gather(
                *(_geocode_theater(client, theater, api_key) for theater in missing_coordinates)
            )
    try:
        results = ensure_city_demo_data(city, lat, lon, features, movie_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"theaters": results, "total": len(results), "city": city}
