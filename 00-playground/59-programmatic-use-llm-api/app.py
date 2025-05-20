import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_url = os.getenv("OPENAI_API_URL")
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
}
prompt = "Write a one-sentence bedtime story about a unicorn."
model = os.getenv("OPENAI_MODEL")
body = {
    "model": model,
    "messages": [
        {"role": "user", "content": prompt}
    ]
}

response = requests.post(api_url, headers=headers, json=body)

# print("Status Code:", response.status_code)
# print("Response Headers:", response.headers)

if response.status_code == 200:
    data = response.json()
    content = data['choices'][0]['message']['content']
    print("\nExtracted content:")
    print(content)
    # Under a blanket of sparkling stars, a gentle unicorn tiptoed through a moonlit meadow, leaving trails of dreams for all the children fast asleep.