import fnmatch
import os
import re
from dataclasses import dataclass
from typing import Generator, Iterable, List

import openai
import pandas as pd
import tiktoken
from dotenv import load_dotenv
from openai.embeddings_utils import cosine_similarity
from utilities import get_embedding, num_tokens_from_messages

# Thanks to http://www.oldmanumby.com/ for his remaster and converion of the Dungeons
# and Dragons 5th Edition SRD (Systems Reference Document)
# https://github.com/OldManUmby/DND.SRD.Wiki

# Thanks to Wizards of the Coast for DnD and preserving its openness with the Open Gaming License.


@dataclass(frozen=True, repr=True)
class WikipediaPath:
    article: str
    header: str

    def __str__(self):
        return f"{self.article} - {self.header}"


@dataclass(frozen=True, repr=True)
class Section:
    """
    A segment is defined by anything that follows an h1 header (# ...) or
    an entire document if the file has no h1 headers.
    """

    location: WikipediaPath
    text: str

    def __str__(self):
        return f"{self.location}:\n{self.text}"


def wikipedia_splitter(contents: str, article_title: str, token_limit: int, split_point_regexes: List[str]) -> Iterable[Section]:
    # Take a markdown file and the article split on `==` sections.
    """
    Generate sections of Wikipedia pages.
    :param contents: The contents of the wikipedia page
    :param article_title: The title of the article, to be included in the emitted section object
    :param token_limit: The maximum number of tokens to allow in a section
    :param split_point_regexes: A list of regexes to split on. The first one is the highest precedence.
        If we can't fit a section into the token limit, we'll split on the next lower regex.
    """
    split_point_regex = split_point_regexes[0]
    sections = re.split(split_point_regex, contents)

    if not sections[0].strip():
        # Remove the first section if it's empty (this happens when the file starts with a "#" line)
        sections.pop(0)
    else:
        # Otherwise: Wikipedia articles often begin with a section that has no `==` header.
        first_section = sections.pop(0)
        yield Section(location=WikipediaPath(article=article_title, header=article_title), text=first_section)

    # And now proceed into splitting sections based on the `==` header
    for section in sections:
        if not section.strip():
            # Remove trailing empty sections.
            continue

        header = section.splitlines()[0].strip()
        if "=" in split_point_regex:
            # If we're splitting on equal-sign headers, then we need to remove the trailing equal signs
            header = re.sub(r"=+$", "", header).strip()

        # To be better steer embeddings, we include the article's title and section name with one another above the text.
        emit = Section(location=WikipediaPath(article=article_title, header=header), text=f"{article_title}: {section}")

        if len(str(section).replace("\n", " ")) > token_limit:
            print(f"Section is too long: {emit.location}, splitting")
            subtitle = f"{article_title} - {header}"
            # If the section is too long, split it on a lower precedence split point

            yield from wikipedia_splitter(section, subtitle, token_limit, split_point_regexes[1:])
        else:
            yield emit