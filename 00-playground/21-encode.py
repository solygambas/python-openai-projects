# python3 21-encode.py "abcdefg"

import sys

# Get the input text from the command line arguments
input_text = sys.argv[1]

# Shift every character one character to the left
output_text = ""
for char in input_text:
    if char == "a":  # Handle special case for 'a'
        output_text += "z"
    elif char == "A":  # Handle special case for 'A'
        output_text += "Z"
    else:
        output_text += chr(ord(char) - 1)

# Output the result in the console
print(output_text)
