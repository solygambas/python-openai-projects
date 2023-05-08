const state = { messages: [] };
const loader = document.querySelector(".loader");

function parseMessageContent(inputString) {
  //const regex = /(\w+):\s(.+?)(?=\n\w+:|\n?$)/gs;
  const regex = /(\w+):\s(.+?)($|\n)/g;
  const matches = inputString.matchAll(regex);
  const parsed = {};

  for (const match of matches) {
    parsed[match[1]] = match[2];
  }

  return parsed;
}

function assistantMessageToHTML(message) {
  const parsedMessage = parseMessageContent(message["content"]);

  const div = document.createElement("figure");
  div.classList.add("message");
  div.classList.add(message.role);

  if ("cyoa_image_base64" in message) {
    const image = document.createElement("img");
    image.setAttribute(
      "src",
      `data:image/png;base64,${message["cyoa_image_base64"]}`
    );
    image.setAttribute("alt", parsedMessage["Caption"]);
    div.appendChild(image);
  }

  const messageContent = document.createElement("figcaption");
  messageContent.classList.add("message-content");
  messageContent.innerHTML = parsedMessage["Story"] || ""; // Gracefully avoid GPT syntax errors
  div.appendChild(messageContent);

  return div;
}

function userMessageToHTML(message) {
  const div = document.createElement("div");
  div.innerHTML = message.content;
  return div;
}

function choicesToHTML(choice1, choice2) {
  const form = document.createElement("form");

  if (choice1) {
    const button1 = document.createElement("button");
    button1.classList.add("btn");
    button1.setAttribute("id", "choice1");
    button1.addEventListener("click", function (e) {
      handleSubmit(e, 1);
    });
    button1.setAttribute("data-choice", choice1);
    button1.setAttribute("value", "choice1");
    button1.innerHTML = choice1;

    form.appendChild(button1);
  }

  if (choice2) {
    const button2 = document.createElement("button");
    button2.classList.add("btn");
    button2.setAttribute("id", "choice2");
    button2.addEventListener("click", function (e) {
      handleSubmit(e, 2);
    });
    button2.setAttribute("data-choice", choice2);
    button2.setAttribute("value", "choice2");
    button2.innerHTML = choice2;

    form.appendChild(button2);
  }

  return form;
}

function drawBodyHTML() {
  const { messages } = state;
  const storyContainer = document.querySelector(".container");
  storyContainer.innerHTML = "";

  for (const message of messages) {
    if (message.role === "assistant") {
      storyContainer.appendChild(assistantMessageToHTML(message));
    } else if (message.role === "user") {
      // Uncomment this to show user messages
      // storyContainer.appendChild(userMessageToHTML(message));
    }
  }

  if (messages.length == 0) {
    const child = choicesToHTML(
      "A wizard enters a magical dark forest.",
      "An explorer enters an interdimensional time machine."
    );
    storyContainer.appendChild(child);
    child.scrollIntoView();
  } else {
    const parsedMessage = parseMessageContent(
      messages[messages.length - 1]["content"]
    );
    const child = choicesToHTML(
      parsedMessage["Choice1"],
      parsedMessage["Choice2"]
    );
    storyContainer.appendChild(child);
    child.scrollIntoView();
  }
}

function handleSubmit(event, choice) {
  event.preventDefault();
  loader.classList.toggle("hidden");
  const choiceString = document
    .querySelector(`#choice${choice}`)
    .getAttribute("data-choice");

  fetch("/cyoa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        ...state.messages,
        {
          role: "user",
          content: choiceString,
        },
      ],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      state.messages = data.messages;
      drawBodyHTML();
      loader.classList.toggle("hidden");
    });
}

drawBodyHTML();
