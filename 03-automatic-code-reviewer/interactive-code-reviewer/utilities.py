import difflib
from typing import Iterable, Union


def style(text: str, style: Union[str, Iterable[str]]) -> str:
    """
    Applies the specified style(s) to the given text by encapsulating
    the text with the start and end ANSI SGR codes for the specified
    style(s).

    :param text: The input text to apply the style(s) to.
    :param style: The style(s) to apply to the text. Can be a string or an iterable of strings.

    :return: The input text with the specified style(s) applied.
    """

    styles = {
        "bold": "\033[1m",
        "italic": "\033[3m",
        "underline": "\033[4m",
        "strikethrough": "\033[9m",
        "black": "\033[30m",
        "red": "\033[31m",
        "green": "\033[32m",
        "yellow": "\033[33m",
        "blue": "\033[34m",
        "magenta": "\033[35m",
        "cyan": "\033[36m",
        "white": "\033[37m",
    }
    style_start = styles[style] if isinstance(style, str) else "".join(styles[s] for s in style)
    reset = "\033[0m"
    return f"{style_start}{text}{reset}"


def color_diff(text1, text2, context=3):
    """
    :param text1: The first text to compare.
    :param text2: The second text to compare.
    :param context: The number of lines of context to show around changes.
    :return: The diff of text1 and text2 with colorized output and line numbers.
    """
    diff = difflib.unified_diff(text1.splitlines(keepends=True), text2.splitlines(keepends=True), n=context, lineterm="")

    result = []
    for line in diff:
        if line.startswith("---") or line.startswith("+++"):
            continue
        elif line.startswith("-"):
            result.append(style(line, "red"))  # red
        elif line.startswith("+"):
            result.append(style(line, "green"))  # green
        elif line.startswith("@@"):
            result.append(style(line, "cyan"))  # cyan
        else:
            result.append(line)
    return "".join(result)
