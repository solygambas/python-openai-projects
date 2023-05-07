import hashlib
import json
import os
from typing import Dict, List, Tuple

import openai
import tiktoken
from dotenv import load_dotenv

load_dotenv(".env")

openai.api_key = os.environ["OPENAI_API_KEY"]


# https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
def num_tokens_from_messages(messages, model):
    """Returns the number of tokens used by a list of messages."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    if model == "gpt-3.5-turbo":
        return num_tokens_from_messages(messages, model="gpt-3.5-turbo-0301")
    elif model == "gpt-4":
        return num_tokens_from_messages(messages, model="gpt-4-0314")
    elif model == "gpt-3.5-turbo-0301":
        tokens_per_message = 4  # every message follows <|start|>{role/name}\n{content}<|end|>\n
        tokens_per_name = -1  # if there's a name, the role is omitted
    elif model == "gpt-4-0314":
        tokens_per_message = 3
        tokens_per_name = 1
    else:
        raise NotImplementedError(
            f"""num_tokens_from_messages() is not implemented for model {model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens."""
        )
    num_tokens = 0
    for message in messages:
        num_tokens += tokens_per_message
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":
                num_tokens += tokens_per_name
    num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
    return num_tokens


def take_tokens(
    text: str,
    max_token_quantity: int,
    division_point: str,
    model: str,
) -> Tuple[str, str]:
    """
    @param text: The text to split
    @param max_token_quantity: The maximum number of tokens to take from the text
    @param division_point: A string on which to divide.
    If the division point does not appear in the text, then splitting a word is acceptable
    for this implementation.
    @return: A tuple containing the first part of the text (a best-effort chunk of fewer than max_token_quantity tokens)
        and the remainder of the text.
    Split a piece text into two parts, such that the first part contains at most `max_token_quantity` tokens. Divide along
    division_point[0] unless the string can't be subdivided. If it can't be subdivided, try division_point[1], and so on.
    """

    # Our initial token count is the number of tokens used by our base prompt, encoded as messages.
    enc = tiktoken.encoding_for_model(model)
    current_token_count = num_tokens_from_messages("", model=model)
    sections = text.split(division_point)
    non_empty_sections = [section for section in sections if section.strip() != ""]

    for i, section in enumerate(non_empty_sections):
        if current_token_count + len(enc.encode(section)) >= max_token_quantity:
            # Entering this loop means the incoming section brings us past max_token_quantity.

            if i == 0:
                # If i == 0, then we're in the special case where there exists no division-point-separated
                # section of token length less than max_token_quantity.

                # Thus, we return the first `max_token_quantity` tokens as a chunk, even if it ends on an
                # awkward split.
                max_token_chunk = enc.decode(enc.encode(text)[:max_token_quantity])
                remainder = text[len(max_token_chunk) :]
                return max_token_chunk, remainder
            else:
                # Otherwise, return the accumulated text as a chunk.
                emit = division_point.join(sections[: i - 1])
                remainder = division_point.join(sections[i - 1 :])
                return emit, remainder
        else:
            current_token_count += len(enc.encode(section))
            current_token_count += len(enc.encode(division_point))

    return text, ""


def split_text_into_sections(text: str, max_token_quantity: int, division_point: str, model: str) -> List[str]:
    # Divide the text into sections of at most `max_token_quantity` tokens. Strive to split along division_points[0],
    # but if that can't be done, then fall back to a lower precedence division point.
    sections = []
    while text:
        section, text = take_tokens(text, max_token_quantity, division_point, model)
        sections.append(section)
    return sections


def summarization_prompt_messages(text: str, target_summary_size: int) -> List[Dict]:
    # Craft the list of messages that will be sent to the model to instruct summarization.
    return [
        {
            "role": "system",
            "content": f"""
The user is asking you to summarize a book. Because the book it too long you are being asked to summarize one
chunk at a time. If a chunk contains a section surrounded by three square brackets, such as
    [[[ some text ]]]
then the content enclosed is itself a GPT-generated summary of another larger chunk. Weigh such summaries with
greater significance than ordinary text they represent the entire passage that they summarize.
In your summary, make no mention of the "chunks" or "passages" used in dividing the text for summarization.
Strive to make your summary as detailed as possible while remaining under a {target_summary_size} token limit.
""".strip(),
        },
        {"role": "user", "content": f"Summarize the following: {text}"},
    ]


def memoize_to_file(cache_file="cache.json"):
    """
    Memoization decorator that caches the output of a method in a JSON file.
    """

    def memoize(func):
        # Load the cache from the JSON file
        if os.path.exists(cache_file):
            with open(cache_file, "r") as f:
                cache = json.load(f)
        else:
            cache = {}

        def wrapped(*args):
            # Compute the hash of the argument
            arg_hash = hashlib.sha256(repr(tuple(args)).encode("utf-8")).hexdigest()
            print("ASSESSING HASH OF: ", repr(tuple(args[1:])), hash(str(args[0])))
            # Check if the result is already cached
            if arg_hash in cache:
                print(f"Cached result found for {arg_hash}. Returning it.")
                return cache[arg_hash]
            else:
                print("CACHE NOT FOUND")

            # Compute the result and cache it
            result = func(*args)
            cache[arg_hash] = result

            # Write the cache to the JSON file
            with open(cache_file, "w") as f:
                json.dump(cache, f)

            return result

        return wrapped

    return memoize
