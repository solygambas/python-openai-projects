// node 21-encode.js "abcdefg"

// Get the input text from the command line arguments
const inputText = process.argv[2];

// Shift every character one character to the left
let outputText = "";
for (let i = 0; i < inputText.length; i++) {
  const char = inputText.charAt(i);
  if (char === "a") {
    // Handle special case for 'a'
    outputText += "z";
  } else if (char === "A") {
    // Handle special case for 'A'
    outputText += "Z";
  } else {
    outputText += String.fromCharCode(char.charCodeAt(0) - 1);
  }
}

// Output the result in the console
console.log(outputText);
