import logging
import os
import re
import time
from typing import Mapping

import openai
import requests
from dotenv import load_dotenv
from flask import Flask, render_template, request
from openai.error import (
    APIConnectionError,
    APIError,
    RateLimitError,
    ServiceUnavailableError,
)
from tenacity import (
    retry,
    retry_if_exception_type,
    retry_if_not_result,
    stop_after_attempt,
)

load_dotenv()

openai.api_key = os.environ["OPENAI_API_KEY"]

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

app = Flask(
    __name__,
    static_url_path="",
    static_folder="static",
)


system_directive = """
You, 'assistant', are telling me, 'user', an interactive choose-your-own-adventure story. Your repsonses are with labels so I can parse them and display them in a user interface.
Each step of the story, you present the following information.
Story. The current state of the story.
Caption. A detailed caption showing the current state of the story to be used as a DALL-E image prompt. It should be as consistent as possible with the previous caption.
Choice1. The text of the first choice.
Choice2. The text of the second choice.
Your image captions should be concise but repeat specific details about the setting, characters, and objects in the story to help generate consistent images across repeated invocations.
Present exactly two choices to the user. Never offer blank (empty) choices.
Only present choices that build on the story. Do not present choices that lead the main character away from action or conflict (such as "going home").
Do not repeat yourself.
An example exchange is as follows:

user:
A wizard enters a dungeon.

assistant:
Story: An aged wizard quietly enters a dark dungeon. He can tell by the echo of his footsteps that the chamber is large and seemingly empty.
Caption: A grey-bearded wizard with a flowing blue cloak, a blue hat, a long grey beard, and a 6-foot wooden staff entering a dark dungeon with high-ceilings from the left side of the frame.
Choice1: The wizard illuminates the dungeon
Choice2: The wizard turns himself invisble

user:
The wizard illuminates the dungeon

assistant:
Story: The wizard illuminates the tip of his staff and lights the room. In the light, he sees a giant ogre! The ogre leaps at him.
Caption: On the left, a grey-bearded wizard with a flowing blue cloak, a blue hat, a long grey beard illuminates a high-ceilinged dark dungeon with the 6-foot wooden staff he carries. An 8-foot hulking ogre wearing a tattered brown tunic and an axe lunges at the wizard from the right side of the frame.
Choice1: The wizard steps aside, dodging the ogre.
Choice2: The wizard casts a spell, freezing the ogre in place.

user:
The wizard casts a spell, freezing the ogre in place.

assistant:
Story: The wizard casts "petrificus schmetrificus", freezing the ogre in mid-air.
Caption: In a high-ceilinged dark dungeon, a wizard with a flowing blue cloak, a blue hat, a long grey beard, and a 6-foot wooden staff stands to the left. He has petrified an 8-foot hulking ogre that wears a tattered brown tunic and holds an axe that was lunging towards him from the right side of the frame.
Choice1: The wizard looks through the ogres pockets.
Choice2: The wizard, fearing his spell will wear off, hurries away.
""".strip()


def get_caption_from_chat_response(chat_response_object: Mapping) -> str:
    """
    :raises: AttributeError if no caption is found
    """
    return (
        re.search(r"Caption:(.*)(?:\n|$)", chat_response_object["content"])
        .group(1)
        .strip()
    )


def is_valid_cyoa(chat_response_object) -> bool:
    try:
        get_caption_from_chat_response(chat_response_object)
    except AttributeError:
        return False
    return (
        bool(re.search(r"Story:(.*)(?:\n|$)", chat_response_object["content"]))
        and bool(re.search(r"Choice1:(.*)(?:\n|$)", chat_response_object["content"]))
        and bool(re.search(r"Choice2:(.*)(?:\n|$)", chat_response_object["content"]))
    )


@retry(
    stop=stop_after_attempt(3),
    retry=retry_if_not_result(is_valid_cyoa)
    | retry_if_exception_type(APIConnectionError)
    | retry_if_exception_type(APIError)
    | retry_if_exception_type(RateLimitError),
)
def generate_cyoa_next_message(messages) -> Mapping:
    messages_payload = [{"role": "system", "content": system_directive}]

    # Filter out our image_url we sneak into their API call
    messages_payload.extend(
        [
            {k: v for k, v in message.items() if k != "cyoa_image_base64"}
            for message in messages
        ]
    )

    print("************************************")
    print("************************************")
    print("************************************")
    print(messages_payload)

    # The ChatCompletion API has the gpt-3.5-turbo model available to it. As of Q1 2023, it's 1/10th the cost of text-davinci-003 at $0.002/1K tokens.
    chat_response = openai.ChatCompletion.create(
        # model="gpt-4",
        model="gpt-3.5-turbo",
        messages=messages_payload,
        frequency_penalty=1.0,
        temperature=0.8,
    )
    log.info(f"Chat generated in {chat_response.response_ms} milliseconds")
    log.debug(f"Chat Response: {chat_response}")

    return chat_response.choices[0].message.to_dict()


def generate_image_base64_dalle(image_caption, dimensions=(512, 512)):
    try:
        image_response = openai.Image.create(
            prompt=(image_caption[:1000]),
            n=1,
            size=f"{dimensions[0]}x{dimensions[1]}",
            response_format="b64_json",
        )
        log.debug(f"Image Response: {image_response}")
        base64_image = image_response["data"][0]["b64_json"]
    except openai.InvalidRequestError as e:
        log.warn(
            f"Skipping image generation. Image prompt was rejected by OpenAI: {e.args}"
        )
        return None
    except (APIConnectionError, APIError, RateLimitError, ServiceUnavailableError) as e:
        # We don't retry these because the story is more important than the images. Don't slow the story down
        # if we simply miss a single image.
        log.warn(f"Temporary API error. Skipping image generation: {e.args}")
        return None
    else:
        return base64_image


def generate_image_base64_stability(image_caption, dimensions=(512, 512)):
    STABILITY_ENGINE_ID = "stable-diffusion-512-v2-1"  # "stable-diffusion-v1-5"
    # The latter arg is a default
    STABILITY_API_HOST = os.getenv("API_HOST", "https://api.stability.ai")
    STABILITY_API_KEY = os.environ["STABILITY_AI_KEY"]

    print(f"Generating image with caption: {image_caption[:1000]}")

    response = requests.post(
        f"{STABILITY_API_HOST}/v1/generation/{STABILITY_ENGINE_ID}/text-to-image",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {STABILITY_API_KEY}",
        },
        json={
            "text_prompts": [{"text": image_caption[:1000]}],
            "cfg_scale": 7,
            "clip_guidance_preset": "FAST_BLUE",
            "height": dimensions[1],
            "width": dimensions[1],
            "samples": 1,
            "steps": 50,
        },
    )
    if response.status_code != 200:
        log.warn(
            f"Skipping image generation. Stability response was {response.status_code}: {response.text}"
        )
        return None
    else:
        data = response.json()
        return data["artifacts"][0]["base64"]


# POST endpoint
@app.route("/cyoa", methods=["POST"])
def cyoa():
    request_json = request.get_json()

    assert "messages" in request_json
    if len(request_json["messages"]) != 0:
        assert request_json["messages"][0]["role"] == "user"
        assert request_json["messages"][-1]["role"] == "user"

    # Note: In a production context, you should validate this input.
    messages = request_json["messages"].copy()

    chat_response_object = generate_cyoa_next_message(messages)

    messages.append(chat_response_object)

    t_image = time.time()

    try:
        image_caption = get_caption_from_chat_response(chat_response_object)
    except AttributeError:
        log.warn("Skipping image generation. GPT response did not have a caption.")
        return {"messages": messages}

    # Continue on to generate an image and affix it to the last message

    # image_base64 = generate_image_base64_dalle(image_caption)
    image_base64 = generate_image_base64_stability(
        "A first person view in the style of detailed fantasy art: " + image_caption
    )

    if image_base64:
        # ...
        # Optionally, store the image locally
        # ...
        messages[-1]["cyoa_image_base64"] = image_base64
        log.info(f"Image generated and saved in {time.time() - t_image} seconds")

    return {"messages": messages}


# GET endpoint
@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
