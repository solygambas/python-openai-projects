from openai import OpenAI
import sys

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="something-doesnt-matter",
)

print("Chat with the local model (type 'quit' to exit)")

while True:
    user_input = input("> ")
    if user_input.lower() == "quit":
        break

    try:
        stream = client.chat.completions.create(
            model="gemma3:12b-it-qat",
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

# > Ciao! Come stai? :)
# AI: Ciao! Sto bene, grazie per avermelo chiesto! 😊 

# Come stai tu? Raccontami qualcosa di bello della tua giornata!