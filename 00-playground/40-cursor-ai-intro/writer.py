def write_file(filename: str, text: str):
    try:
        with open(filename, "w") as f:
            f.write(text)
    except IOError as e:
        print(f"Error writing to file {filename}: {e}")
    except Exception as e:
        print(f"Unexpected error occurred: {e}")

def read_file(filename: str) -> str:
    try:
        with open(filename, "r") as f:
            return f.read()
    except FileNotFoundError:
        print(f"File {filename} not found")
        return ""
    except IOError as e:
        print(f"Error reading file {filename}: {e}")
        return ""
    except Exception as e:
        print(f"Unexpected error occurred: {e}")
        return ""

def append_file(filename: str, text: str):
    try:
        with open(filename, "a") as f:
            f.write(text)
    except IOError as e:
        print(f"Error appending to file {filename}: {e}")
    except Exception as e:
        print(f"Unexpected error occurred: {e}")

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
