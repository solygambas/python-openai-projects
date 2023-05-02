import argparse
from dotenv import dotenv_values
import json
import openai
import os
import spotipy
import datetime
import logging

# import pprint

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

config = dotenv_values(".env")

openai.api_key = config["OPENAI_API_KEY"]


def main():
    parser = argparse.ArgumentParser(
        description="Simple command line playlist generator"
    )
    parser.add_argument(
        "-p",
        type=str,
        default="fun songs",
        help="The prompt to describe the playlist (optional)",
    )
    parser.add_argument(
        "-n",
        type=int,
        default=5,
        help="The number of songs to add to the playlist (optional)",
    )
    args = parser.parse_args()
    if any(
        [
            x not in os.environ
            for x in ("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "OPENAI_API_KEY")
        ]
    ):
        raise ValueError(
            "Error: missing environment variables. Please check your env file."
        )
    if args.n not in range(1, 50):
        raise ValueError("Error: n should be between 0 and 50")

    playlist_prompt = args.p
    count = args.n
    playlist = get_playlist(playlist_prompt, count)
    add_songs_to_spotify(playlist_prompt, playlist)


def get_playlist(prompt="fun songs", count=5):
    example_json = """
    [
    {"song": "Happy", "artist": "Pharrell Williams"},
    {"song": "Don't Stop Me Now", "artist": "Queen"},
    {"song": "Walking on Sunshine", "artist": "Katrina and The Waves"},
    {"song": "I Wanna Dance with Somebody", "artist": "Whitney Houston"},
    {"song": "Can't Stop the Feeling!", "artist": "Justin Timberlake"},
    {"song": "Good Vibrations", "artist": "The Beach Boys"},
    {"song": "I Gotta Feeling", "artist": "The Black Eyed Peas"},
    {"song": "Dancing Queen", "artist": "ABBA"},
    {"song": "Happy Together", "artist": "The Turtles"},
    {"song": "Uptown Funk", "artist": "Mark Ronson ft. Bruno Mars"}
    ]
    """

    messages = [
        {
            "role": "system",
            "content": """You are a helpful playlist generating assistant.
        You should generate a list of songs and their artists according to a text prompt.
        You should return a JSON array, where each element follows this format:
        {"song": <song_title>, "artist": <artist_name>}
        """,
        },
        {
            "role": "user",
            "content": "Generate a playlist of 10 songs based on this prompt: super super happy songs",
        },
        {"role": "assistant", "content": example_json},
        {
            "role": "user",
            "content": f"Generate a playlist of {count} songs based on this prompt: {prompt}",
        },
    ]

    response = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=messages)

    playlist = json.loads(response.choices[0].message.content)
    return playlist


def add_songs_to_spotify(playlist_prompt, playlist):
    # Sign up as a developer and register your app
    # at https://developer.spotify.com/dashboard/applications
    # Spotipy Documentation
    # https://spotipy.readthedocs.io/en/2.22.1/#getting-started

    sp = spotipy.Spotify(
        auth_manager=spotipy.SpotifyOAuth(
            client_id=config["SPOTIFY_CLIENT_ID"],
            client_secret=config["SPOTIFY_CLIENT_SECRET"],
            redirect_uri="http://localhost:9999",
            # scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
            scope="playlist-modify-private",
        )
    )

    current_user = sp.current_user()

    assert current_user is not None

    track_uris = []
    for item in playlist:
        artist, song = item["artist"], item["song"]
        # https://developer.spotify.com/documentation/web-api/reference/#/operations/search

        advanced_query = f"artist:({artist}) track:({song})"
        basic_query = f"{song} {artist}"

        for query in [advanced_query, basic_query]:
            log.debug(f"Searching for query: {query}")
            search_results = sp.search(
                q=query, limit=10, type="track"
            )  # , market=market)

            if (
                not search_results["tracks"]["items"]
                or search_results["tracks"]["items"][0]["popularity"] < 20
            ):
                continue
            else:
                good_guess = search_results["tracks"]["items"][0]
                print(f"Found: {good_guess['name']} [{good_guess['id']}]")
                # print(f"FOUND USING QUERY: {query}")
                track_uris.append(good_guess["id"])
                break

        else:
            print(
                f"Queries {advanced_query} and {basic_query} returned no good results. Skipping."
            )

    created_playlist = sp.user_playlist_create(
        current_user["id"],
        public=False,
        name=f"{playlist_prompt} ({datetime.datetime.now().strftime('%c')})",
    )

    sp.user_playlist_add_tracks(current_user["id"], created_playlist["id"], track_uris)

    print("\n")
    print(f"Created playlist: {created_playlist['name']}")
    print(created_playlist["external_urls"]["spotify"])


if __name__ == "__main__":
    main()
