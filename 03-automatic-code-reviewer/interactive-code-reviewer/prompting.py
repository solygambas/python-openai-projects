from typing import Dict, List

import tiktoken


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


def generate_base_messages(code: str, ignore_list: List[str], accept_list: List[str], include_extra_warning: bool) -> List[Dict]:
    """
    :param code: The code to review.
    :param ignore_list: A list of suggestions that have already been ignored.
    :param accept_list: A list of suggestions that have already been accepted.
    :param include_extra_warning: Reiterate to the model that it should not suggest changes that are already in the ignore list.
    :return: A list of messages to prime the conversation with a Chat GPT model.

    Developer note: GPT-4 _hates_ the idea that we are referencing GPT-4. It also struggles to comprehend that we don't
      want to hear a rejected suggestion again. We begin the conversation with a rejection of a fictitious previous
      suggestion to prime the model to ignore the suggestion. Without this step, the model often disregards the ignore.
    """
    ignore_list_string = ""
    ignore_list_string += "\n# Rejected Suggestions\n"
    ignore_list_string += "\nYou previously provided the following suggestions that the I rejected:\n"
    ignore_list_string += """\n- DO NOT SUGGEST: "I suggest changing the chat_model to "gpt-3.5-turbo" which is currently the latest GPT version in OpenAI's API, and will provide the best performance for this code review script."\n"""
    ignore_list_string += "\n".join([f"\n- DO NOT SUGGEST '{ignore}'.\n" for ignore in ignore_list])

    accept_list_string = ""
    if accept_list:
        accept_list_string += "\n# Accepted Suggestions\n"
        accept_list_string += "\nYou previously provided the following suggestions that I accepted. Unless it's critical, you probably shouldn't contradict these suggestions:\n"
        accept_list_string += "\n".join([f"\n- You previously suggested '{accepted}' which I accepted. Do not contradict yourself.\n" for accepted in accept_list])

    # Note: in an f""" string, you use {{ and }} to escape the { and } characters.
    system_prompt = f"""
# Directive

You are performing the role of a code reviewer in an automated code-review script. You will receive the contents of a file and I will ask you to review it.


# Rules

1. Strive to improve code quality: make suggestions that enhance reusability, readability, performance, and style.

2. When you have an improvement to suggest, do so according to the following syntax.

    A. One or more pairs of <find:> and <replace:> blocks representing all the modified code for your change.

    B. Followed by exactly one <message:> block. This is the message that will be displayed to the user. It should explain what you are changing and why.

An example of a valid response:

```
<find:>
Code to find
<replace:>
Code to replace
<message:>
Message to display to the user.
```

3. If you are at all uncertain about the code, then ask for clarification. To do so, simply include a <message:> block with no <find:> or <replace:> blocks. The user can clarify and you will have another opportunity to suggest changes in the same format.

4. You will address a single issue at a time. A single issue might involve many changes, but it should be conceptually a single change.

5. If you have no change to suggest, then simply include a <message:> followed by your feedback. For example:

```
<message:>
Great work. This code is perfect.
```

6. Preserve spacing exactly. Your blocks should be indented the same as the code they are replacing. They will be used as the find in a string.replace() call.

7. If you're suggesting a modification to a specific sequence but that sequence is not unique, then provide more lines of context so as not to clobber other instances of the sequence. In the worst case, your find string can be the entire file's contents.

8. If there are no further changes to make, then tell the user that. Just like above, simply include a <message:> block with no <find:> or <replace:> blocks.

9. If you encounter OpenAI code that references "gpt-4" or "gpt-3.5-turbo", don't worry about it not being in your training corpus. You are a language model trained on data that predates these newer-named models.
{ignore_list_string}
{accept_list_string}

Again. **DO NOT SUGGEST** any suggestions that we have already rejected/accepted and do not complain about the use of a GPT version you do not recognize.
""".strip()

    messages = [
        {"role": "system", "content": system_prompt},
        # This is a simple example interaction. The user accepts the change.
        {
            "role": "user",
            "content": """Review the following code:
import logger
log = logger.get_logger(__name__)

def fibonacci(n):
    log.info("fibonacci(" + n + ") invoked.")
    if n <= 1:
        log.info("fibonacci(" + n + ") returning " + n + ".")
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
""",
        },
        {
            "role": "assistant",
            "content": """<find:>
    log.info("fibonacci(" + n + ") invoked.")
<replace:>
    log.info(f"fibonacci({n}) invoked.")
<find:>
    log.info("fibonacci(" + n + ") returning " + n + ".")
<replace:>
    log.info(f"fibonacci({n}) returning {n}")
<message:>
The logger supports string interpolation. You can use it to avoid the string concatenation.
""",
        },
        {"role": "user", "content": "Great."},
        # In this exchange, the user follows up with further modifications they'd like in the alteration.
        {
            "role": "user",
            "content": """Review the following code:
import logger
log = logger.get_logger(__name__)

def fibonacci(n):
    log.info(f"fibonacci({n}) invoked.")
    if n <= 1:
        log.info(F"fibonacci({n}) returning {n}")
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
""",
        },
        {
            "role": "assistant",
            "content": """<find:>
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
<replace:>
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
<message:>
Your current implementation uses recursion and runs in O(2^n) time. You can improve that to O(n) by using a loop instead of recursion.
""",
        },
        {"role": "user", "content": "The user did not apply the change. Instead, they responded with:\nThis is great, but can you add a docstring regarding your approach, too?"},
        {
            "role": "assistant",
            "content": """<find:>
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
<replace:>
    # This is a standard implementation of the Fibonacci sequence. It runs in O(n) time and O(1) space.
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
<message:>
Your current implementation uses recursion and runs in O(2^n) time. You can improve that to O(n) by using a loop instead of recursion.
""",
        },
        {"role": "user", "content": "Great, thanks!"},
        # In this exchange, you indicate that a user's implementation can be replaced with a built-in library.
        {
            "role": "user",
            "content": """Review the following code:
def count_words(text):
    words = text.split()
    for word in words:
        if word in word_counts:
            word_counts[word] += 1
        else:
            word_counts[word] = 1
    return word_counts
""",
        },
        {
            "role": "assistant",
            "content": """<find:>
def count_words(text):
<replace:>
from collections import Counter
def count_words(text):
<find:>
    words = text.split()
    for word in words:
        if word in word_counts:
            word_counts[word] += 1
        else:
            word_counts[word] = 1
    return word_counts
<replace:>
    return Counter(text.split())
<message:>
The collections.Counter class is a great way to count things. It's a subclass of dict, so you can use it just like a dict.
""",
        },
        {"role": "user", "content": "Great, thanks!"},
        # In this exchange, you make changes at distant separate locations in the code with one semantic change in mind.
        {
            "role": "user",
            "content": """Review the following code:
import requests

def get_api_parameters(title: str):
    return {
        "action": "query",
        "format": "json",
        "prop": "links",
        "titles": title,
        "pllimit": "max",
    }

def get_outbound_links(title):
    url = "https://en.wikipedia.org/w/api.php"
    response = requests.get(url, params=get_api_parameters(title)).json()
    pages = response["query"]["pages"]
    base_url = "https://en.wikipedia.org/wiki/"
    return [(link["title"], base_url + link["title"].replace(" ", "_")) for page_id in pages for link in pages[page_id].get("links", [])]
""",
        },
        {
            "role": "assistant",
            "content": """<find:>
import requests
<replace:>
import requests
from typing import List, Tuple
<find:>
def get_api_parameters(title: str):
<replace:>
def get_api_parameters(title: str) -> dict:
<find:>
def get_outbound_links(title):
<replace:>
def get_outbound_links(title) -> List[Tuple[str, str]]:
<message:>
I've added some type annotations to your code. They're not required, but they can help you and others understand your code.
""",
        },
        {"role": "user", "content": "Great, thanks!"},
        # Now, finally, we pass our actual code.
        {"role": "user", "content": f"Review the following code:\n{code}"},
    ]

    if include_extra_warning:
        # This is surprisingly effective. It's a bit of a hack, but it works.
        messages.extend(
            [
                {
                    "role": "assistant",
                    "content": """<find:>
gpt-4
<replace:>
gpt-3
<message:>
There is no such thing as GPT-4. I suggest you change it to GPT-3.
""",
                },
                {
                    "role": "user",
                    "content": "Do not suggest changes to GPT models and do not ignore the list of already rejected suggestions. Make no mention that you made this mistake, just proceed without apologizing. Suggest something else.",
                },
            ]
        )

    return messages
