#!/usr/bin/env python3
"""
Seed theaters, screens, and shows data
Run after fetch_movies.py to create complete demo data
"""
import json
import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.models.theater import Theater, Screen
from app.models.show import Show
from app.models.movie import Movie


def load_movies() -> list:
    """Load movies from JSON file."""
    movies_file = Path(settings.DATA_DIR) / "movies.json"
    if not movies_file.exists():
        print("ERROR: movies.json not found. Run fetch_movies.py first.")
        sys.exit(1)
    with open(movies_file, "r") as f:
        return json.load(f)


def create_theaters() -> list:
    """Create sample theaters with screens."""
    theaters = [
        Theater(
            name="PVR Cinemas - Phoenix Marketcity",
            address="Phoenix Marketcity, LBS Marg, Kurla West",
            city="Mumbai",
            phone="+91 22 6149 7777",
            facilities=["Parking", "Food Court", "Dolby Atmos", "IMAX", "Recliner Seats", "Wheelchair Access"],
            screens=[
                Screen(name="Screen 1 - IMAX", rows=12, seats_per_row=18, aisle_after_row=6, wheelchair_positions=["A1", "A2", "A17", "A18"]),
                Screen(name="Screen 2 - Dolby Atmos", rows=10, seats_per_row=16, aisle_after_row=5, wheelchair_positions=["A1", "A2", "A15", "A16"]),
                Screen(name="Screen 3", rows=8, seats_per_row=14, aisle_after_row=4),
                Screen(name="Screen 4", rows=8, seats_per_row=14, aisle_after_row=4),
            ],
        ),
        Theater(
            name="INOX - R City Mall",
            address="R City Mall, LBS Marg, Ghatkopar West",
            city="Mumbai",
            phone="+91 22 6158 7777",
            facilities=["Parking", "Food Court", "Dolby Atmos", "4DX", "Recliner Seats"],
            screens=[
                Screen(name="Screen 1 - 4DX", rows=10, seats_per_row=16, aisle_after_row=5, wheelchair_positions=["A1", "A2", "A15", "A16"]),
                Screen(name="Screen 2", rows=9, seats_per_row=15, aisle_after_row=4),
                Screen(name="Screen 3", rows=8, seats_per_row=14, aisle_after_row=4),
            ],
        ),
        Theater(
            name="Cinepolis - Viviana Mall",
            address="Viviana Mall, Eastern Express Highway, Thane West",
            city="Mumbai",
            phone="+91 22 6145 8888",
            facilities=["Parking", "Food Court", "Dolby Atmos", "MX4D", "Recliner Seats"],
            screens=[
                Screen(name="Screen 1 - MX4D", rows=11, seats_per_row=17, aisle_after_row=5, wheelchair_positions=["A1", "A2", "A16", "A17"]),
                Screen(name="Screen 2", rows=9, seats_per_row=15, aisle_after_row=4),
                Screen(name="Screen 3", rows=8, seats_per_row=14, aisle_after_row=4),
            ],
        ),
        Theater(
            name="PVR Cinemas - Select Citywalk",
            address="Select Citywalk, Saket District Centre, Saket",
            city="Delhi",
            phone="+91 11 6145 9999",
            facilities=["Parking", "Food Court", "Dolby Atmos", "IMAX", "Recliner Seats", "Wheelchair Access"],
            screens=[
                Screen(name="Screen 1 - IMAX", rows=12, seats_per_row=18, aisle_after_row=6, wheelchair_positions=["A1", "A2", "A17", "A18"]),
                Screen(name="Screen 2", rows=10, seats_per_row=16, aisle_after_row=5),
                Screen(name="Screen 3", rows=9, seats_per_row=15, aisle_after_row=4),
            ],
        ),
        Theater(
            name="INOX - Nehru Place",
            address="Nehru Place Metro Station, Near Kalkaji Mandir",
            city="Delhi",
            phone="+91 11 6158 8888",
            facilities=["Parking", "Food Court", "Dolby Atmos", "Recliner Seats"],
            screens=[
                Screen(name="Screen 1", rows=10, seats_per_row=16, aisle_after_row=5, wheelchair_positions=["A1", "A2", "A15", "A16"]),
                Screen(name="Screen 2", rows=8, seats_per_row=14, aisle_after_row=4),
            ],
        ),
    ]
    return theaters


def create_shows(movies: list, theaters: list) -> list:
    """Create shows for the next 7 days."""
    shows = []
    base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Show times for each day
    show_times = [
        ("10:00", "13:00"),
        ("13:30", "16:30"),
        ("17:00", "20:00"),
        ("20:30", "23:30"),
        ("23:55", "02:55"),
    ]

    formats = ["2D", "3D", "IMAX", "4DX"]
    languages = ["English", "Hindi", "Tamil", "Telugu"]

    # Use first 20 movies
    selected_movies = movies[:20]

    for day_offset in range(7):
        current_date = base_date + timedelta(days=day_offset)
        date_str = current_date.strftime("%Y-%m-%d")

        for theater in theaters:
            for screen in theater.screens:
                # Assign 2-3 movies per screen per day
                for movie_idx, movie in enumerate(selected_movies[:3]):
                    for time_idx, (start_str, end_str) in enumerate(show_times):
                        if time_idx >= 3:  # Limit to 3 shows per movie per screen per day
                            break

                        start_dt = datetime.strptime(f"{date_str} {start_str}", "%Y-%m-%d %H:%M")
                        end_dt = datetime.strptime(f"{date_str} {end_str}", "%Y-%m-%d %H:%M")
                        if end_dt <= start_dt:
                            end_dt += timedelta(days=1)

                        show = Show(
                            movie_id=movie["id"],
                            theater_id=theater.id,
                            screen_id=screen.id,
                            start_time=start_dt.isoformat(),
                            end_time=end_dt.isoformat(),
                            price=round(200 + (movie_idx * 50) + (time_idx * 30), -1),  # 200-500 range
                            language=languages[movie_idx % len(languages)],
                            format=formats[movie_idx % len(formats)],
                            is_active=True,
                        )
                        shows.append(show)

    return shows


def main():
    data_dir = Path(settings.DATA_DIR)
    data_dir.mkdir(parents=True, exist_ok=True)

    print("Loading movies...")
    movies = load_movies()
    print(f"  Loaded {len(movies)} movies")

    print("Creating theaters...")
    theaters = create_theaters()
    print(f"  Created {len(theaters)} theaters with {sum(len(t.screens) for t in theaters)} screens")

    print("Creating shows...")
    shows = create_shows(movies, theaters)
    print(f"  Created {len(shows)} shows")

    # Save theaters
    theaters_file = data_dir / "theaters.json"
    with open(theaters_file, "w") as f:
        json.dump([t.to_dict() for t in theaters], f, indent=2)
    print(f"Saved theaters to {theaters_file}")

    # Save shows
    shows_file = data_dir / "shows.json"
    with open(shows_file, "w") as f:
        json.dump([s.to_dict() for s in shows], f, indent=2)
    print(f"Saved shows to {shows_file}")

    # Create empty files for other entities
    for fname in ["bookings.json", "seat_locks.json"]:
        fpath = data_dir / fname
        if not fpath.exists():
            with open(fpath, "w") as f:
                json.dump([], f)

    print("\nSeeding complete!")
    print("Run the backend with: python run.py")


if __name__ == "__main__":
    main()