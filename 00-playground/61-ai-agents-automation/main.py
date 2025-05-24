import os
import json

from dotenv import load_dotenv
from openai import OpenAI
from serpapi import Client

load_dotenv()

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_API_ENDPOINT = os.environ.get("OPENAI_API_ENDPOINT")


if OPENAI_API_KEY is None or OPENAI_API_KEY == "":
    raise "OPENAI_API_KEY must be set!"

SERPAPI_KEY = os.environ["SERPAPI_KEY"]

if SERPAPI_KEY is None or SERPAPI_KEY == "":
    raise "SERPAPI_KEY must be set!"

client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_API_ENDPOINT)
search_client = Client(api_key=SERPAPI_KEY)


def get_temperature(location):
    print("TOOL CALL: Get Temperature")
    print(f"TOOL INPUT: {location}")
    return f"Temperature for {location}: 29.5°C"


def convert_temperature(value, unit):
    print("TOOL CALL: Convert Temperature")
    print(f"TOOL INPUT: Value={value}, Unit={unit}")
    try:
        val = float(value)
        if unit.upper() == "C":
            converted_value = (val * 9 / 5) + 32
            return f"{value}°C is {converted_value:.1f}°F"
        elif unit.upper() == "F":
            converted_value = (val - 32) * 5 / 9
            return f"{value}°F is {converted_value:.1f}°C"
        else:
            return "Invalid unit. Please specify 'C' for Celsius or 'F' for Fahrenheit."
    except ValueError:
        return "Invalid temperature value provided."


def search_web(search_term):
    print("TOOL CALL: Search Web")
    print(f"TOOL INPUT: {search_term}")
    params = {
        "engine": "google",
        "q": search_term,
        "hl": "en",
        "gl": "us",
        "google_domain": "google.com",
        "api_key": SERPAPI_KEY,
        "num": "10",
    }

    result = search_client.search(**params)
    return json.dumps(result.as_dict()["organic_results"])


def get_ai_response(user_prompt, history):
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_temperature",
                "description": "Get the temperature for a specified location.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "Name of the place you want to get the temperature for.",
                        }
                    },
                    "required": ["location"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "convert_temperature",
                "description": "Convert temperature between Celsius and Fahrenheit.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "value": {
                            "type": "number",
                            "description": "The temperature value to convert.",
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["C", "F"],
                            "description": "The unit of the input temperature ('C' for Celsius, 'F' for Fahrenheit).",
                        },
                    },
                    "required": ["value", "unit"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_web",
                "description": "Search the web for a specified search term.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "search_term": {
                            "type": "string",
                            "description": "The search term you want to search the web for.",
                        }
                    },
                    "required": ["search_term"],
                    "additionalProperties": False,
                },
            },
        },
    ]

    messages = history.copy()
    response = client.chat.completions.create(
        model=os.environ.get("OPENAI_MODEL_NAME"),
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    # Extract the response message
    response_message = response.choices[0].message
    
    # Check if there's a tool call
    if response_message.tool_calls:
        tool_call = response_message.tool_calls[0]
        tool_name = tool_call.function.name
        tool_result = "Tool use failed or yielded no result."

        if tool_name == "get_temperature":
            location = json.loads(tool_call.function.arguments)["location"]
            tool_result = get_temperature(location)

        if tool_name == "search_web":
            search_term = json.loads(tool_call.function.arguments)["search_term"]
            tool_result = search_web(search_term)

        if tool_name == "convert_temperature":
            args = json.loads(tool_call.function.arguments)
            value = args.get("value")
            unit = args.get("unit")
            if value is not None and unit:
                tool_result = convert_temperature(value, unit)
            else:
                tool_result = "Missing value or unit for temperature conversion."

        history.append(
            {
                "role": "assistant",
                "content": f"Tool call: {tool_name}. Result: {tool_result}.",
            }
        )

        history.append({
            "role": "user",
            "content": f"Based on the chat history, which may include tool calls & results, please answer this question / prompt: {user_prompt}",
        })

        return get_ai_response(user_prompt, history)

    return response_message.content


def main():
    chat_history = []

    while True:
        user_input = input("Your question: ")
        if user_input == "":
            break
        chat_history.append({"role": "user", "content": user_input})
        ai_response = get_ai_response(user_input, chat_history)
        chat_history.append({"role": "assistant", "content": ai_response})
        print(ai_response)
        print("Do you have any other questions?")

    print("Goodbye!")


if __name__ == "__main__":
    main()

#     Your question: what's the weather in New Delhi?
# TOOL CALL: Get Temperature
# TOOL INPUT: New Delhi
# The current temperature in New Delhi is 29.5°C.
# Do you have any other questions?
# Your question: can you convert it to Fahrenheit?
# TOOL CALL: Convert Temperature
# TOOL INPUT: Value=29.5, Unit=C
# The temperature in New Delhi, which is 29.5°C, converts to approximately 85.1°F.
# Do you have any other questions?
# Your question: what can you do for me?
# I can assist you with a variety of tasks, including:

# - Providing current weather information for locations around the world.
# - Converting temperatures between Celsius and Fahrenheit.
# - Searching the web for information on various topics.
# - Answering questions and providing explanations.
# - Assisting with general knowledge inquiries.

# If you have any specific requests or questions, feel free to ask!
# Do you have any other questions?
# Your question: current president of the USA in 2025?
# TOOL CALL: Search Web
# TOOL INPUT: current president of the USA in 2025
# The current president of the USA in 2025 is Donald J. Trump.
# Do you have any other questions?
# Your question:
# Goodbye!
