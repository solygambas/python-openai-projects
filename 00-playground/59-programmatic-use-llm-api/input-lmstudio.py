from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

history = []

while True:
    user_input = input("Your prompt or questions: ")

    if user_input.lower() == "exit":
        print("Exiting the program.")
        break

    history.append({"role": "user", "content": user_input})

    api_url = "http://localhost:1234/v1"
    token = "lm-studio"
    model = "gemma-3-4b-it-qat"

    client = OpenAI(api_key=token, base_url=api_url)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful, friendly assistant."},
        ] + history
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful, friendly assistant."},
            ] + history
        )
        
        content = response.choices[0].message.content
        print("\nExtracted content:")
        print(content)
        history.append({"role": "assistant", "content": content})
        
    except Exception as e:
        print(f"Error occurred: {e}")

# Your prompt or questions: can you introduce yourself in a few sentences?

# Extracted content:
# Hello there! I’m Gemma, a large language model created by the team at Google DeepMind. I'm an open-weights model, which means I’m available for anyone to use and experiment with – and I’m here to help you with all sorts of tasks, from answering questions to generating creative text formats! 😊