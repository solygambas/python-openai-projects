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

    api_url = os.getenv("OPENAI_API_BASE")
    token = os.getenv('OPENAI_API_KEY')
    model = os.getenv("OPENAI_MODEL")

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

# Your prompt or questions: tell me a short Indian joke

# Extracted content:
# Sure! Here’s a light-hearted Indian joke:

# Why did the math book look sad?

# Because it had too many “problems”… and its family wanted it to become an engineer!
# Your prompt or questions: Make it in the Belgian style 

# Extracted content:
# Of course! Here’s the joke with a Belgian touch:

# Pourquoi le livre de maths belge avait-il l’air triste ?

# Parce qu’il avait trop de « problèmes »… et ses parents voulaient quand même qu’il devienne ingénieur !