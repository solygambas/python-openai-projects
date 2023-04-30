import argparse
from dotenv import dotenv_values
import openai

config = dotenv_values(".env")
openai.api_key = config["OPENAI_API_KEY"]


def bold(text):
    bold_start = "\033[1m"
    bold_end = "\033[0m"
    return bold_start + text + bold_end


def blue(text):
    blue_start = "\033[34m"
    blue_end = "\033[0m"
    return blue_start + text + blue_end


def red(text):
    red_start = "\033[31m"
    red_end = "\033[0m"
    return red_start + text + red_end


def main():
    parser = argparse.ArgumentParser(
        description="Simple command line chatbot with GPT-4"
    )
    parser.add_argument(
        "--personality",
        type=str,
        help="A brief summary of the chatbot's personality",
        default="friendly and helpful",
    )
    args = parser.parse_args()

    initialPrompt = (
        f"You are a conversational chatbot. Your personality is: {args.personality}"
    )
    messages = [{"role": "system", "content": initialPrompt}]

    while True:
        try:
            user_input = input(bold(blue("You: ")))
            messages.append({"role": "user", "content": user_input})
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=100,
            )
            messages.append(response["choices"][0].message.to_dict())
            print(bold(red("Assistant: ")), response["choices"][0].message.content)
        except KeyboardInterrupt:
            print("Exiting...")
            break


if __name__ == "__main__":
    main()
