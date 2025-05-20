import requests
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

    api_url = os.getenv("OPENAI_API_URL")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
    }

    model = os.getenv("OPENAI_MODEL")
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful, friendly assistant."},
        ] + history
    }

    response = requests.post(api_url, headers=headers, json=body)

    # print("Status Code:", response.status_code)
    # print("Response Headers:", response.headers)

    if response.status_code == 200:
        data = response.json()
        content = data['choices'][0]['message']['content']
        print("\nExtracted content:")
        print(content)
        history.append({"role": "assistant", "content": content})

# Your prompt or questions: write a short poem about a dog

# Extracted content:
# In morning light, he leaps with glee,
# A wagging tail, a friend to me.
# Soft, warm fur and shining eyes,
# Boundless love that never lies.

# He chases dreams across the yard,
# His trust in me—simple, hard.
# With every bark and playful tug,
# Life’s brighter with my faithful dog.
# Your prompt or questions: make it about a cat, keep the story though

# Extracted content:
# In morning light, she leaps with grace,
# A gentle purr, a whiskered face.
# Soft, warm fur and shining eyes,
# Secret love that never lies.

# She chases shadows 'cross the floor,
# Her trust in me—quiet, sure.
# With every stretch and gentle tug,
# Life’s softer with my faithful cat.
# Your prompt or questions: exit
# Exiting the program.