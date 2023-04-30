import openai
from dotenv import dotenv_values

config = dotenv_values(".env")
openai.api_key = config["OPENAI_API_KEY"]

while True:
    try:
        user_input = input("You: ")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_input}],
            max_tokens=10,
        )
        print(response["choices"][0].message.content)
    except KeyboardInterrupt:
        print("Exiting...")
        break
