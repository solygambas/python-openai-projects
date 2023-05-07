from __future__ import division
import os
import re
import textwrap

from utilities import (
    num_tokens_from_messages,
    summarization_prompt_messages,
    split_text_into_sections,
    memoize_to_file,
    split_text_into_sections,
)
from typing import Dict, List

import tiktoken
import openai
import requests
import random
import time

from dotenv import load_dotenv
from openai.error import APIConnectionError, APIError, RateLimitError


load_dotenv(".env")
openai.api_key = os.environ["OPENAI_API_KEY"]

actual_tokens = 0


def gpt_summarize(text: str, target_summary_size: int) -> str:
    global actual_tokens
    # Otherwise, we can just summarize the text directly
    tries = 0
    while True:
        try:
            tries += 1
            result = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=summarization_prompt_messages(text, target_summary_size),
            )
            actual_tokens += result.usage.total_tokens
            return "[[[" + result.choices[0].message.to_dict()["content"] + "]]]"
        except (APIConnectionError, APIError, RateLimitError) as e:
            if tries >= MAX_ATTEMPTS:
                print(f"OpenAI exception after {MAX_ATTEMPTS} tries. Aborting. {e}")
                raise e
            if hasattr(e, "should_retry") and not e.should_retry:
                print(f"OpenAI exception with should_retry false. Aborting. {e}")
                raise e
            else:
                print(f"Summarize failed (Try {tries} of {MAX_ATTEMPTS}). {e}")
                random_wait = (
                    random.random() * 4.0 + 1.0
                )  # Wait between 1 and 5 seconds
                random_wait = (
                    random_wait * tries
                )  # Scale that up by the number of tries (more tries, longer wait)
                time.sleep(random_wait * tries)


from dataclasses import dataclass

# Using repr allows us to use this is in our memoization function.
# Specifying frozen=True causes python to generate a __hash__ and __eq__ function for us.


@dataclass(frozen=True, repr=True)
class SummarizationParameters:
    # Pass around our parameters for summarization in a hashable dataclass (like a namedtuple)
    target_summary_size: int
    summary_input_size: int


def summarization_token_parameters(
    target_summary_size: int, model_context_size: int
) -> SummarizationParameters:
    """
    Compute the number of tokens that should be used for the context window, the target summary, and the base prompt.
    """
    base_prompt_size = num_tokens_from_messages(
        summarization_prompt_messages("", target_summary_size), model=model_name
    )
    summary_input_size = model_context_size - (base_prompt_size + target_summary_size)
    return SummarizationParameters(
        target_summary_size=target_summary_size,
        summary_input_size=summary_input_size,
    )


import re


@memoize_to_file(cache_file="cache.json")
def summarize(
    text: str,
    token_quantities: SummarizationParameters,
    division_point: str,
    model_name: str,
) -> str:
    # Shorten text for our console logging
    text_to_print = re.sub(r" +\|\n\|\t", " ", text).replace("\n", "")
    print(
        f"\nSummarizing {len(enc.encode(text))}-token text: {text_to_print[:60]}{'...' if len(text_to_print) > 60 else ''}"
    )

    if len(enc.encode(text)) <= token_quantities.target_summary_size:
        # If the text is already short enough, just return it (this is our final summary)
        return text
    elif len(enc.encode(text)) <= token_quantities.summary_input_size:
        summary = gpt_summarize(text, token_quantities.target_summary_size)
        print(
            f"Summarized {len(enc.encode(text))}-token text into {len(enc.encode(summary))}-token summary: {summary[:250]}{'...' if len(summary) > 250 else ''}"
        )
        return summary
    else:
        # The text is too long, split it into sections and summarize each section
        split_input = split_text_into_sections(
            text, token_quantities.summary_input_size, division_point, model_name
        )

        summaries = [
            summarize(x, token_quantities, division_point, model_name)
            for x in split_input
        ]

        return summarize(
            "\n\n".join(summaries), token_quantities, division_point, model_name
        )


@memoize_to_file(cache_file="cache.json")
def synthesize_summaries(summaries: List[str], model: str) -> str:
    """
    Use a more powerful GPT model to synthesize the summaries into a single summary.
    """
    print(f"Synthesizing {len(summaries)} summaries into a single summary.")

    summaries_joined = ""
    for i, summary in enumerate(summaries):
        summaries_joined += f"Summary {i + 1}: {summary}\n\n"

    messages = [
        {
            "role": "user",
            "content": f"""
A less powerful GPT model generated {len(summaries)} summaries of a book.

Because of the way that the summaries are generated, they may not be perfect. Please review them
and synthesize them into a single more detailed summary that you think is best.

The summaries are as follows: {summaries_joined}
""".strip(),
        },
    ]

    # Check that the summaries are short enough to be synthesized
    assert num_tokens_from_messages(messages, model=model_name) <= 8192
    print(messages)

    result = openai.ChatCompletion.create(
        model=model,
        messages=messages,
    )
    return result.choices[0].message.to_dict()["content"]


model_name = "gpt-3.5-turbo"
enc = tiktoken.encoding_for_model(model_name)


# Great Gatsby
# response = requests.get("https://www.gutenberg.org/cache/epub/64317/pg64317.txt")

# PETER PAN
response = requests.get("https://www.gutenberg.org/files/16/16-0.txt")

# Metamorphosis
# response = requests.get("https://www.gutenberg.org/files/5200/5200-0.txt")

assert response.status_code == 200
book_complete_text = response.text

# We replace the carriage return character. Because why do these exist in the first place.
book_complete_text = book_complete_text.replace("\r", "")

# We remove Project Gutenberg's header and footer
# Project Gutenberg's header is always the same, so we can just remove it:
split = re.split(r"\*\*\* .+ \*\*\*", book_complete_text)

print("Divided into parts of length:", [len(s) for s in split])

# We select the middle of the split, which is the actual book
book = split[1]

print(f"Text contains {len(enc.encode(book))} tokens")
MAX_ATTEMPTS = 3

num_tokens = len(enc.encode(book))
cost_per_token = 0.002 / 1000
print(
    f"As of Q1 2023, the approximate price of this summary will somewhere be on the order of: ${num_tokens * cost_per_token:.2f}"
)

division_point = "."  # we don't want to stop in the middle of a sentence.

# summary = summarize(
#     book,
#     summarization_token_parameters(target_summary_size=1000, model_context_size=4097),
#     division_point,
#     model_name
# ).replace("[[[", "").replace("]]]", "")

# print(summary)


summaries: Dict[int, str] = {}
target_summary_sizes = [500, 750, 1000]
for target_summary_size in target_summary_sizes:
    actual_tokens = 0
    summaries[target_summary_size] = (
        summarize(
            book,
            summarization_token_parameters(
                target_summary_size=target_summary_size, model_context_size=4097
            ),
            division_point,
            model_name,
        )
        .replace("[[[", "")
        .replace("]]]", "")
    )
print(summaries)


print(synthesize_summaries(list(summaries.values()), "gpt-4"))
