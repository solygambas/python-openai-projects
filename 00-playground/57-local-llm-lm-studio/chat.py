from openai import OpenAI
import sys

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="something-doesnt-matter",
)

print("Chat with the local model (type 'quit' to exit)")

while True:
    user_input = input("> ")
    if user_input.lower() == "quit":
        break

    try:
        stream = client.chat.completions.create(
            model="gemma-3-12b-it-qat",
            messages=[{"role": "user", "content": user_input}],
            stream=True,
            temperature=0.7,
        )

        print("AI: ", end="")
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                print(chunk.choices[0].delta.content, end="")
                sys.stdout.flush()
        print()

    except Exception as e:
        print(f"An error occurred: {e}")

print("Exiting chat.")

# > how are you doing today?
# AI: I'm doing well, thank you for asking! As an AI, I don't experience feelings like humans do, but my systems are running smoothly and I'm ready to assist with your requests. 😊

# How about *you*? How are you doing today?