import argparse
import json
import logging
import os

# If the readline module was loaded, then input() will use it to provide
# elaborate line editing and history features.
try:
    import readline
except ImportError:
    pass

from dataclasses import dataclass
from typing import List

import openai
from dotenv import load_dotenv
from openai.error import APIConnectionError, APIError, RateLimitError
from prompting import generate_base_messages, num_tokens_from_messages
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)
from utilities import color_diff, style

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

load_dotenv()

openai.api_key = os.environ["OPENAI_API_KEY"]


class MisformattedCompletionError(Exception):
    pass


class InvalidFindStringError(Exception):
    pass


@dataclass
class FindAndReplace:
    find: str
    replace: str


@dataclass
class SuggestedChange:
    changes: List[FindAndReplace]
    message: str


@dataclass
class ChatCompletionCodeReviewResult:
    messages: List[dict]
    suggested_change: SuggestedChange


def extract_suggested_change(text: str) -> SuggestedChange:
    """
    Extract SuggestedChanges from the text of a chat completion.

    The text format is specified in the prompt, but is as follows:

    ```
    <find:>
    Part 1 of code to find.
    <replace:>
    Part 1 of code to replace.
    <find:>
    Part 2 of code to find.
    <replace:>
    Part 2 of code to replace.
    <message:>
    An message of what you are changing and why.
    ```

    :param text: The text of the chat completion.
    :return: A SuggestedChange object.
    :raises MisformattedCompletionError: If the text does not contain the expected blocks.
    """

    message_split = text.split("<message:>\n")

    if len(message_split) > 2:
        raise MisformattedCompletionError(
            f"Invalid response. Found more than one <message:> block in completion: {text}"
        )
    elif len(message_split) < 2:
        # No changes suggested.
        return SuggestedChange(changes=[], message=message_split[0])
    else:
        message = message_split[1].strip()

    changes = []
    non_empty_find_and_replace_blocks = [
        x for x in message_split[0].split("<find:>\n") if len(x.strip()) != 0
    ]
    for block in non_empty_find_and_replace_blocks:
        replace_split = block.split("<replace:>\n")

        if len(replace_split) > 2:
            raise MisformattedCompletionError(
                f"Invalid response. Found more than one <replace:> block in segment of completion: {text}"
            )
        elif len(replace_split) < 2:
            raise MisformattedCompletionError(
                f"Invalid response. Found <find:> block but no <replace:> block in segment of completion: {text}"
            )
        else:
            changes.append(
                FindAndReplace(find=replace_split[0], replace=replace_split[1])
            )

    return SuggestedChange(changes=changes, message=message)


def modify_code(file_contents: str, find_and_replace_list: List[FindAndReplace]) -> str:
    """
    Apply a SuggestedChange to a file.
    :param file_contents: The contents of the file to update.
    :param find_and_replace_list: The list of FindAndReplace objects to apply.
    :return: The updated file contents.
    :raises InvalidFindStringError: If the file does not contain the find string.
    """
    updated_string = file_contents
    for change in find_and_replace_list:
        if file_contents.find(change.find) == -1:
            raise InvalidFindStringError(
                f"The code does not contain the find string: {change}"
            )
        updated_string = updated_string.replace(change.find, change.replace)
    return updated_string


# We double-wrap this function to retry differently on different types of errors.
# We exponentially back off if the error is transient and due to load. Otherwise, we immediately retry.
@retry(
    wait=wait_random_exponential(multiplier=1, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(APIConnectionError)
    | retry_if_exception_type(APIError)
    | retry_if_exception_type(RateLimitError),
)
@retry(
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(MisformattedCompletionError)
    | retry_if_exception_type(InvalidFindStringError),
)
def chat_completion_code_review(
    messages: List[dict], file_contents: str, chat_model: str
) -> ChatCompletionCodeReviewResult:
    """
    Return a ChatCompletionCodeReviewResult object.

    Given a list of messages for context, a file contents, and a chat model, update the file contents with the suggested change from the chat model.

    :param messages: A list of messages to use as context for the chat completion.
    :param file_contents: The contents of the file to be modified.
    :param chat_model: The chat model to use for the completion.
    :raises: MisformattedCompletionError if the completion is not in the correct format.
    :raises: InvalidFindStringError if the find string is not in the file.
    :return: A ChatCompletionCodeReviewResult object.
    """

    logger.debug(
        f"Invoking completion with messages state: {json.dumps(messages[-1]['content'],indent=4)}"
    )
    response = openai.ChatCompletion.create(
        model=chat_model,
        messages=messages,
        temperature=0.9,
    )

    assistant_reply = response.choices[0].message
    logger.debug(f"Assistant reply: {assistant_reply}")

    # This will raise MisformattedCompletionError if the completion is not in the correct format.
    suggested_change = extract_suggested_change(assistant_reply["content"])

    # Attempt to apply the changes to verify they'd work. We'll redo this later, but we want to fail
    # fast to retry our completion stage if the changes reference a string that can't be found.
    # This will raise InvalidFindStringError if the find string is not in the file.
    modify_code(file_contents, suggested_change.changes)

    return ChatCompletionCodeReviewResult(
        messages=messages + [assistant_reply], suggested_change=suggested_change
    )


def print_diff_and_prompt_user_to_accept_or_reject_change(
    diff: str, message: str
) -> str:
    """
    :param diff: The diff of the change.
    :param message: The <message:> from the assistant.
    """
    # Print the diff
    print(style("\n\nThe assistant suggested a change. The diff is:", "bold"))
    print(diff)

    # Then print the message
    print(style("\nAssistant: ", ("bold", "blue")) + message)

    # Ask the user for their response.
    print(style("\nWould you like to apply this change?", "bold"))
    print(style(f"""  "Y" : Save the changes to the file.""", "bold"))
    print(style(f"""  "N" : Don't apply the changes. Continue.""", "bold"))
    print(
        style(
            f"""  else: Communicate directly back to the chat_model (to improve/alter/critique their suggestion)""",
            "bold",
        )
    )
    return input(style("Your reply [Y/N/<whatever you want>]: ", "bold"))


def automated_code_review(
    filename: str,
    chat_model: str,
    ignore_list: List[str] = [],
    accept_list: List[str] = [],
) -> None:
    """
    Interactively review a file using a chat model.

    :param filename: The file to review.
    :param chat_model: The chat model to use for the completion.
    :param ignore_list: A list of previously suggested changes that the model should ignore
    :return: None
    :raises: MisformattedCompletionError if the completion is not in the correct format and retries exhausted.
    :raises: InvalidFindStringError if the find string is not in the file and retries exhausted.
    """
    with open(filename, "r") as file:
        file_contents = file.read()

    logger.info(f"Reviewing {filename}")

    # The base messages set includes an initial rejection of a suggestion that we change the word GPT-4 to GPT-3.
    # It helps to establish how completely serious we are that we don't want to hear rejected suggestions twice
    # and we don't want to hear suggestions that are already in the ignore list.
    messages = generate_base_messages(
        file_contents,
        ignore_list=ignore_list,
        accept_list=accept_list,
        include_extra_warning=True,
    )

    logger.info(f"Prompt: {messages[-1]['content']}")

    if num_tokens_from_messages(messages, chat_model) > 8000:
        raise ValueError("The prompt is too long. Please reduce the size of the file.")

    logger.debug(f'Prompt: {messages[-1]["content"]}')

    while True:
        # Update messages list and get a suggested_change
        chat_completion_code_review_result = chat_completion_code_review(
            messages, file_contents=file_contents, chat_model=chat_model
        )
        messages = chat_completion_code_review_result.messages

        if len(chat_completion_code_review_result.suggested_change.changes) == 0:
            # The assistant did not provide any find/replace pairs. It's asking for clarification or a response.

            print(style("\n\nThe assistant did not suggest a change.", "bold"))
            print(style("Assistant: ", ("bold", "blue")) + messages[-1]["content"])
            user_response = input(style("Your reply: ", "bold"))
            messages.append({"role": "user", "content": user_response})

        else:
            # The assistant is suggesting changes.

            changes = chat_completion_code_review_result.suggested_change.changes
            explanation = chat_completion_code_review_result.suggested_change.message

            changed_code = modify_code(file_contents, changes)
            diff = color_diff(file_contents, changed_code)

            user_response = print_diff_and_prompt_user_to_accept_or_reject_change(
                diff=diff, message=explanation
            )

            if user_response.upper() == "Y":
                # The user accepts this suggestion. Apply the change and re-invoke code review
                with open(filename, "w") as file:
                    logger.debug(f"Saving changes to {filename}")
                    file.write(changed_code)

                print(style(f"Saved this change to file. Re-examining code...", "bold"))

                # Indicate that this change was already made to this code (so the model doesn't suggest something contradcitory later on)
                accept_list.append(
                    chat_completion_code_review_result.suggested_change.message
                )

                # We've written the suggested change. Now code review the file again.
                logger.debug(f"Re-invoking code-review on updated file")
                automated_code_review(
                    filename,
                    chat_model,
                    ignore_list=ignore_list,
                    accept_list=accept_list,
                )
                return

            elif user_response.upper() == "N":
                # Indicate that the user rejected this change to tell the chat_model not to suggest this set of changes again.
                print(style(f"Rejecting this suggestion. Re-examining code...", "bold"))
                ignore_list.append(
                    chat_completion_code_review_result.suggested_change.message
                )

                # The user did not like this suggestion. Re-invoke code review.
                logger.debug(
                    f"Re-invoking code-review on updated file; ignoring this suggestion."
                )
                automated_code_review(
                    filename,
                    chat_model,
                    ignore_list=ignore_list,
                    accept_list=accept_list,
                )
                return

            else:
                # The user responded with a reply. Add it to the messages list and re-invoke ChatCompletion.
                logger.debug(f"User responded with a suggestion")
                messages.append(
                    {
                        "role": "user",
                        "content": f"The user did not apply the change. Instead, they responded with:\n{user_response}",
                    }
                )


def main():
    parser = argparse.ArgumentParser(
        description="Automated code review using OpenAI API"
    )
    parser.add_argument("filename", help="The target file to review")
    parser.add_argument(
        "--model",
        default="gpt-3.5-turbo",
        help="The chat model to use for code review (default: gpt-3.5-turbo)",
    )
    args = parser.parse_args()

    try:
        automated_code_review(args.filename, args.model)
    except KeyboardInterrupt:
        print("Exiting...")


if __name__ == "__main__":
    main()
