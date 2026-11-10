#!/usr/bin/env python3
"""Seed sample movies for testing without TMDB API"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import uuid
from datetime import datetime
from app.models.movie import Movie
from app.config import settings

data_dir = Path(settings.DATA_DIR)
movies_file = data_dir / "movies.json"

sample_movies = [
    Movie(
        id=str(uuid.uuid4()),
        tmdb_id=1001,
        title="The Dark Knight",
        overview="When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        poster_path="/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        backdrop_path="/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
        release_date="2008-07-18",
        runtime=152,
        genres=["Action", "Crime", "Drama"],
        vote_average=9.0,
        vote_count=28000,
        popularity=150.0,
        original_language="en",
    ),
    Movie(
        id=str(uuid.uuid4()),
        tmdb_id=1002,
        title="Inception",
        overview="A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        poster_path="/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        backdrop_path="/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
        release_date="2010-07-16",
        runtime=148,
        genres=["Action", "Science Fiction", "Thriller"],
        vote_average=8.8,
        vote_count=24000,
        popularity=140.0,
        original_language="en",
    ),
    Movie(
        id=str(uuid.uuid4()),
        tmdb_id=1003,
        title="Interstellar",
        overview="A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        poster_path="/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        backdrop_path="/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg",
        release_date="2014-11-07",
        runtime=169,
        genres=["Adventure", "Drama", "Science Fiction"],
        vote_average=8.6,
        vote_count=20000,
        popularity=130.0,
        original_language="en",
    ),
    Movie(
        id=str(uuid.uuid4()),
        tmdb_id=1004,
        title="The Matrix",
        overview="A computer programmer discovers that reality as he knows it is a simulation created by machines, and joins a rebellion to break free.",
        poster_path="/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        backdrop_path="/lG3WxD0KPgjGhgAmE5V3VETY7P5.jpg",
        release_date="1999-03-31",
        runtime=136,
        genres=["Action", "Science Fiction"],
        vote_average=8.7,
        vote_count=22000,
        popularity=135.0,
        original_language="en",
    ),
    Movie(
        id=str(uuid.uuid4()),
        tmdb_id=1005,
        title="Pulp Fiction",
        overview="The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        poster_path="/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
        backdrop_path="/4cDFJr4HnXN5Qd2xrQa5U5nL3uP.jpg",
        release_date="1994-10-14",
        runtime=154,
        genres=["Crime", "Drama"],
        vote_average=8.9,
        vote_count=23000,
        popularity=125.0,
        original_language="en",
    ),
]

with open(movies_file, "w") as f:
    json.dump([m.to_dict() for m in sample_movies], f, indent=2)

print(f"Seeded {len(sample_movies)} movies to {movies_file}")
