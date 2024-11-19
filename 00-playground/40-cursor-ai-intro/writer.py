def write_file(filename: str, text: str):
    with open(filename, "w") as f:
        f.write(text)

def read_file(filename: str) -> str:
    with open(filename, "r") as f:
        return f.read()

def append_file(filename: str, text: str):
    with open(filename, "a") as f:
        f.write(text)

def parse_input(text: str) -> str:
    return text.strip('\n')

if __name__ == "__main__":
    # Get the input text from the user and store it in a file
    while True:
        input_text = input("Enter your text: ")
        append_file("output.txt", input_text)
        if input_text == "":
            break

    print("File written successfully.")
