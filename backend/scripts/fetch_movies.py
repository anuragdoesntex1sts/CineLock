#!/usr/bin/env python3
"""
Fetch movies from TMDB API and save to movies.json
Run after setting TMDB_API_KEY in .env
"""
import asyncio
import json
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx
from app.config import settings
from app.models.movie import Movie


TMDB_GENRE_MAP = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
}


async def fetch_genres(client: httpx.AsyncClient) -> dict:
    """Fetch genre mapping from TMDB."""
    response = await client.get(f"{settings.TMDB_BASE_URL}/genre/movie/list", params={"api_key": settings.TMDB_API_KEY})
    response.raise_for_status()
    data = response.json()
    return {g["id"]: g["name"] for g in data.get("genres", [])}


async def fetch_movies(client: httpx.AsyncClient, page: int = 1) -> dict:
    """Fetch popular movies from TMDB."""
    response = await client.get(
        f"{settings.TMDB_BASE_URL}/movie/popular",
        params={"api_key": settings.TMDB_API_KEY, "page": page, "language": "en-US"},
    )
    response.raise_for_status()
    return response.json()


async def fetch_movie_details(client: httpx.AsyncClient, movie_id: int) -> dict:
    """Fetch detailed movie info including runtime."""
    response = await client.get(
        f"{settings.TMDB_BASE_URL}/movie/{movie_id}",
        params={"api_key": settings.TMDB_API_KEY, "language": "en-US"},
    )
    response.raise_for_status()
    return response.json()


async def main():
    if not settings.TMDB_API_KEY or settings.TMDB_API_KEY == "your-tmdb-api-key":
        print("ERROR: Set TMDB_API_KEY in .env file")
        print("Get your API key from https://www.themoviedb.org/settings/api")
        sys.exit(1)

    data_dir = Path(settings.DATA_DIR)
    data_dir.mkdir(parents=True, exist_ok=True)
    movies_file = data_dir / "movies.json"

    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Fetching genres...")
        genre_map = await fetch_genres(client)

        print("Fetching popular movies (first 5 pages)...")
        all_movies = []
        for page in range(1, 6):
            print(f"  Page {page}...")
            data = await fetch_movies(client, page)
            for movie_data in data.get("results", []):
                # Get full details for runtime
                details = await fetch_movie_details(client, movie_data["id"])

                genres = [genre_map.get(gid, "") for gid in movie_data.get("genre_ids", [])]

                movie = Movie(
                    tmdb_id=movie_data["id"],
                    title=movie_data["title"],
                    overview=movie_data.get("overview", ""),
                    poster_path=movie_data.get("poster_path", "") or "",
                    backdrop_path=movie_data.get("backdrop_path", "") or "",
                    release_date=movie_data.get("release_date", ""),
                    runtime=details.get("runtime", 0) or 0,
                    genres=genres,
                    vote_average=movie_data.get("vote_average", 0.0),
                    vote_count=movie_data.get("vote_count", 0),
                    popularity=movie_data.get("popularity", 0.0),
                    original_language=movie_data.get("original_language", "en"),
                    adult=movie_data.get("adult", False),
                )
                all_movies.append(movie.to_dict())

        # Save to file
        with open(movies_file, "w") as f:
            json.dump(all_movies, f, indent=2)

        print(f"Saved {len(all_movies)} movies to {movies_file}")


if __name__ == "__main__":
    asyncio.run(main())