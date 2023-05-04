import hashlib
import json
import os
import sqlite3
import zipfile
from typing import Dict, List, Tuple, TypeVar

import numpy as np
import openai
import tiktoken
from openai.embeddings_utils import cosine_similarity
from openai.error import APIConnectionError, APIError, RateLimitError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_random_exponential


def get_file_with_zip_fallback(file_name: str, zip_file_name: str) -> str:
    # Check if the CSV file exists
    if not os.path.exists(file_name):
        # If not, check if the ZIP file exists and unzip it
        if os.path.exists(zip_file_name):
            with zipfile.ZipFile(zip_file_name, "r") as zip_ref:
                zip_ref.extractall()
        else:
            raise ValueError(f"Neither {file_name} nor {zip_file_name} were found in the current directory.")

    # Read the contents of the CSV file
    with open(file_name, "r", encoding="utf-8") as file:
        contents = file.read()

    return contents


# https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
def num_tokens_from_messages(messages: List[Dict], model: str) -> int:
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


def memoize_to_sqlite(filename: str = "cache.db"):
    """
    Memoization decorator that caches the output of a method in a SQLite database.
    The database connection is persisted across calls.
    """
    db_conn = sqlite3.connect(filename)
    db_conn.execute("CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, result TEXT)")

    def memoize(func):
        def wrapped(*args):
            # Compute the hash of the argument
            arg_hash = hashlib.sha256(repr(tuple(args)).encode("utf-8")).hexdigest()

            # Check if the result is already cached
            cursor = db_conn.cursor()
            cursor.execute("SELECT result FROM cache WHERE hash = ?", (arg_hash,))
            row = cursor.fetchone()
            if row is not None:
                print(f"Cached result found for {arg_hash}. Returning it.")
                return json.loads(row[0])

            # Compute the result and cache it
            result = func(*args)
            cursor.execute("INSERT INTO cache (hash, result) VALUES (?, ?)", (arg_hash, json.dumps(result)))
            db_conn.commit()

            return result

        return wrapped

    return memoize


# This is not optimized for massive reads and writes, but it's good enough for this example
@memoize_to_sqlite(filename="embeddings.db")
@retry(
    wait=wait_random_exponential(multiplier=1, max=30),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(APIConnectionError) | retry_if_exception_type(APIError) | retry_if_exception_type(RateLimitError),
)
def get_embedding(text: str) -> List[float]:
    """
    :param text: The text to compute an embedding for
    :return: The embedding for the text
    """
    # replace newlines, which can negatively affect performance.
    text_no_newlines = text.replace("\n", " ")
    print(f"Computing embedding for {text_no_newlines[:50]}")
    response = openai.Embedding.create(input=text_no_newlines, model="text-embedding-ada-002")
    embeddings = response["data"][0]["embedding"]
    return embeddings


T = TypeVar("T")  # Declare type variable


def get_n_nearest_neighbors(query_embedding: List[float], embeddings: Dict[T, List[float]], n: int) -> List[Tuple[T, float]]:
    """
    :param query_embedding: The embedding to find the nearest neighbors for
    :param embeddings: A dictionary of embeddings, where the keys are the entity type (e.g. Movie, Segment)
        and the values are the that entity's embeddings
    :param n: The number of nearest neighbors to return
    :return: A list of tuples, where the first element is the entity and the second element is the cosine
        similarity between -1 and 1
    """

    # This is not optimized for rapid indexing, but it's good enough for this example
    # If you're using this in production, you should use a more efficient vector datastore such as
    # those mentioned specifically by OpenAI here
    #
    #  https://platform.openai.com/docs/guides/embeddings/how-can-i-retrieve-k-nearest-embedding-vectors-quickly
    #
    #  * Pinecone, a fully managed vector database
    #  * Weaviate, an open-source vector search engine
    #  * Redis as a vector database
    #  * Qdrant, a vector search engine
    #  * Milvus, a vector database built for scalable similarity search
    #  * Chroma, an open-source embeddings store
    #

    target_embedding = np.array(query_embedding)

    similarities = [(segment, cosine_similarity(target_embedding, np.array(embedding))) for segment, embedding in embeddings.items()]

    # Sort by similarity and get the top n results
    nearest_neighbors = sorted(similarities, key=lambda x: x[1], reverse=True)[:n]

    return nearest_neighbors